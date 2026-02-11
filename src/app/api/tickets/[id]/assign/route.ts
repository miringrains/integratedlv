import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth'
import { sendEmail, emailTemplates } from '@/lib/email'
import { notifyTicketAssigned } from '@/lib/notifications'

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

    // Authorization: only platform admins can assign tickets
    const isPlatformAdminUser = await isPlatformAdmin()
    if (!isPlatformAdminUser) {
      return NextResponse.json({ error: 'Only platform admins can assign tickets' }, { status: 403 })
    }

    const { id: ticketId } = await context.params
    const body = await request.json()
    const { assigned_to } = body

    // Use service role to bypass RLS for platform admins
    const adminSupabase = createServiceRoleClient()

    // Validate assigned_to user exists and is a platform admin (if not unassigning)
    if (assigned_to && assigned_to !== 'unassigned') {
      const { data: assignee } = await adminSupabase
        .from('profiles')
        .select('id, is_platform_admin')
        .eq('id', assigned_to)
        .single()

      if (!assignee) {
        return NextResponse.json({ error: 'Assigned user not found' }, { status: 400 })
      }
      if (!assignee.is_platform_admin) {
        return NextResponse.json({ error: 'Tickets can only be assigned to platform admin technicians' }, { status: 400 })
      }
    }

    // Get ticket details before update
    const { data: ticketBefore } = await adminSupabase
      .from('care_log_tickets')
      .select(`
        *,
        organization:organizations(name),
        location:locations(name),
        submitted_by_profile:profiles!care_log_tickets_submitted_by_fkey(email, first_name, last_name),
        assigned_to_profile:profiles!care_log_tickets_assigned_to_fkey(email, first_name, last_name)
      `)
      .eq('id', ticketId)
      .single()

    if (!ticketBefore) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Update ticket using service role
    const { data: ticket, error } = await adminSupabase
      .from('care_log_tickets')
      .update({ assigned_to: assigned_to === 'unassigned' ? null : assigned_to })
      .eq('id', ticketId)
      .select(`
        *,
        organization:organizations(name),
        location:locations(name),
        submitted_by_profile:profiles!care_log_tickets_submitted_by_fkey(email, first_name, last_name),
        assigned_to_profile:profiles!care_log_tickets_assigned_to_fkey(email, first_name, last_name)
      `)
      .single()

    if (error) {
      console.error('❌ Update failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Ticket updated successfully')

    // Create event - adminSupabase already uses service role
    const { error: eventError } = await adminSupabase
      .from('ticket_events')
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        event_type: 'assigned',
        new_value: assigned_to === 'unassigned' ? 'Unassigned' : assigned_to,
      })

    if (eventError) {
      console.error('Failed to create assignment event:', eventError)
    } else {
      console.log('✅ Event created')
    }

    // Send email notification and create in-app notification for assigned technician
    if (assigned_to && assigned_to !== 'unassigned' && ticket) {
      try {
        const assignedUser = (ticket as any).assigned_to_profile
        
        // Get assigner name (current user)
        const { data: assignerProfile } = await adminSupabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single()
        
        const assignerName = assignerProfile 
          ? `${assignerProfile.first_name} ${assignerProfile.last_name}`.trim()
          : 'A team member'
        
        if (assignedUser?.id) {
          // Create in-app notification
          await notifyTicketAssigned(
            assignedUser.id,
            ticketId,
            ticket.ticket_number,
            ticket.title,
            assignerName
          )

          // Send email notification
          if (assignedUser.email) {
            const replyToEmail = `ticket-${ticketId}@${process.env.MAILGUN_DOMAIN}`
            
            await sendEmail({
              to: assignedUser.email,
              replyTo: replyToEmail,
              ...emailTemplates.ticketAssigned(
                ticket.ticket_number,
                ticket.id,
                ticket.title,
                `${assignedUser.first_name} ${assignedUser.last_name}`,
                (ticket as any).organization.name,
                (ticket as any).location.name,
                ticket.priority || 'normal'
              ),
            })
            console.log('✅ Assignment email sent to:', assignedUser.email)
          }
        }
      } catch (emailError) {
        console.error('Failed to send assignment notification:', emailError)
        // Don't fail the assignment if notification fails
      }
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('❌ Assignment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
