import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth'
import { sendEmail, emailTemplates } from '@/lib/email'
import { formatDuration } from '@/lib/utils'
import { generateTicketSummaryAsync } from '@/lib/ticket-summary'
import { notifyTicketStatusChanged } from '@/lib/notifications'

// Valid statuses and allowed transitions
const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'cancelled']
const VALID_TRANSITIONS: Record<string, string[]> = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['resolved', 'cancelled'],
  resolved: ['closed', 'in_progress'], // can reopen to in_progress if not actually fixed
  closed: [],    // closed is final
  cancelled: [], // cancelled is final
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Authorization: only platform admins can change ticket status
    const isPlatformAdminUser = await isPlatformAdmin()
    if (!isPlatformAdminUser) {
      return NextResponse.json({ error: 'Only platform admins can change ticket status' }, { status: 403 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { status: newStatus, comment } = body

    // Validate status value
    if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
      }, { status: 400 })
    }

    // Use service role to bypass RLS for platform admins
    const adminSupabase = createServiceRoleClient()

    // Get current ticket with full details
    const { data: ticket } = await adminSupabase
      .from('care_log_tickets')
      .select(`
        *,
        organization:organizations(name),
        submitted_by_profile:profiles!care_log_tickets_submitted_by_fkey(id, email, first_name, last_name),
        assigned_to_profile:profiles!care_log_tickets_assigned_to_fkey(id, email, first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const oldStatus = ticket.status

    // Validate status transition
    const allowedTransitions = VALID_TRANSITIONS[oldStatus] || []
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json({ 
        error: `Cannot change status from "${oldStatus}" to "${newStatus}". Allowed: ${allowedTransitions.join(', ') || 'none (ticket is final)'}` 
      }, { status: 400 })
    }

    // Prepare updates
    const updates: any = { status: newStatus }
    
    // Update timing fields
    if (newStatus === 'in_progress' && oldStatus === 'open') {
      updates.first_response_at = new Date().toISOString()
    }
    
    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString()
    }
    
    if (newStatus === 'closed') {
      updates.closed_at = new Date().toISOString()
    }

    // Update ticket using service role
    const { data: updatedTicket, error } = await adminSupabase
      .from('care_log_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate summary asynchronously when ticket is closed (non-blocking)
    // Note: In Vercel serverless functions, we need to ensure the async work completes
    // We use a fire-and-forget pattern but ensure it's properly scheduled
    if (newStatus === 'closed') {
      console.log(`🔄 Triggering summary generation for ticket ${id}...`)
      
      // Use setImmediate to ensure this runs after the response is sent
      // This helps ensure the async work continues even after the function response
      setImmediate(() => {
        generateTicketSummaryAsync(id)
          .then((summary) => {
            if (summary) {
              console.log(`✅ Summary generated successfully for ticket ${id}`)
            } else {
              console.warn(`⚠️ Summary generation returned null for ticket ${id} (check logs above for details)`)
            }
          })
          .catch((error) => {
            console.error(`❌ Failed to generate summary for ticket ${id}:`, error)
            console.error(`   Error details:`, error instanceof Error ? error.stack : error)
            // Don't block ticket closure - summary generation is optional
          })
      })
    }

    // Create event - adminSupabase already uses service role to bypass RLS
    const { error: eventError } = await adminSupabase
      .from('ticket_events')
      .insert({
        ticket_id: id,
        user_id: user.id,
        event_type: 'status_changed',
        old_value: oldStatus,
        new_value: newStatus,
        comment: comment || null,
      })

    if (eventError) {
      console.error('Failed to create status change event:', eventError)
    }

    // Send email notifications and create in-app notifications
    try {
      const { data: currentUser } = await adminSupabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()

      const changedBy = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'A team member'
      const recipients: Array<{ id: string; email: string }> = []

      // Notify submitter
      if ((ticket as any).submitted_by_profile?.id) {
        recipients.push({
          id: (ticket as any).submitted_by_profile.id,
          email: (ticket as any).submitted_by_profile.email
        })
      }

      // Notify assigned tech if different from submitter
      if ((ticket as any).assigned_to_profile?.id && 
          (ticket as any).assigned_to_profile.id !== (ticket as any).submitted_by_profile?.id) {
        if (!recipients.find(r => r.id === (ticket as any).assigned_to_profile.id)) {
          recipients.push({
            id: (ticket as any).assigned_to_profile.id,
            email: (ticket as any).assigned_to_profile.email
          })
        }
      }

      // Create in-app notifications (don't notify the person who made the change)
      for (const recipient of recipients) {
        if (recipient.id !== user.id) {
          await notifyTicketStatusChanged(
            recipient.id,
            ticket.id,
            ticket.ticket_number,
            ticket.title,
            oldStatus,
            newStatus,
            changedBy
          )
        }
      }

      // Send email notifications
      for (const recipient of recipients) {
        if (recipient.email && recipient.id !== user.id) {
          await sendEmail({
            to: recipient.email,
            ...emailTemplates.ticketStatusChanged(
              ticket.ticket_number,
              ticket.id,
              ticket.title,
              oldStatus,
              newStatus,
              changedBy,
              (ticket as any).organization.name
            ),
          })
        }
      }

      // If resolved, send special resolution email to submitter
      if (newStatus === 'resolved' && (ticket as any).submitted_by_profile?.email) {
        try {
          const resolutionTime = ticket.resolved_at 
            ? formatDuration(new Date(ticket.resolved_at).getTime() - new Date(ticket.created_at).getTime())
          : 'N/A'

          const replyToEmail = `ticket-${id}@${process.env.MAILGUN_DOMAIN}`
          
        await sendEmail({
          to: (ticket as any).submitted_by_profile.email,
            replyTo: replyToEmail,
          ...emailTemplates.ticketResolved(
            ticket.ticket_number,
            ticket.id,
            ticket.title,
            (ticket as any).organization.name,
            resolutionTime
          ),
        })
        } catch (emailError) {
          console.error('Failed to send resolution email:', emailError)
        }
      }
    } catch (emailError) {
      console.error('Failed to send status change emails:', emailError)
    }

    return NextResponse.json(updatedTicket)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
