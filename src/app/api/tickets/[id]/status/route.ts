import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/email'
import { formatDuration } from '@/lib/utils'
import { generateTicketSummaryAsync } from '@/lib/ticket-summary'

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

    const { id } = await context.params
    const body = await request.json()
    const { status: newStatus, comment } = body

    // Get current ticket with full details
    const { data: ticket } = await supabase
      .from('care_log_tickets')
      .select(`
        *,
        organization:organizations(name),
        submitted_by_profile:profiles!care_log_tickets_submitted_by_fkey(email, first_name, last_name),
        assigned_to_profile:profiles!care_log_tickets_assigned_to_fkey(email, first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const oldStatus = ticket.status

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

    // Update ticket
    const { data: updatedTicket, error } = await supabase
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

    // Create event
    await supabase
      .from('ticket_events')
      .insert({
        ticket_id: id,
        user_id: user.id,
        event_type: 'status_changed',
        old_value: oldStatus,
        new_value: newStatus,
        comment: comment || null,
      })

    // Send email notifications
    try {
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()

      const changedBy = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'A team member'

      // Notify submitter
      if ((ticket as any).submitted_by_profile?.email) {
        await sendEmail({
          to: (ticket as any).submitted_by_profile.email,
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

      // Notify assigned tech if different from submitter
      if ((ticket as any).assigned_to_profile?.email && 
          (ticket as any).assigned_to_profile.email !== (ticket as any).submitted_by_profile?.email) {
        await sendEmail({
          to: (ticket as any).assigned_to_profile.email,
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
