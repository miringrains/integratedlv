import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    const { id: ticketId } = await context.params
    const body = await request.json()
    const { assigned_to } = body

    console.log('🎯 Assigning ticket:', ticketId, 'to:', assigned_to)

    // Get ticket details before update
    const { data: ticketBefore } = await supabase
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

    // Update ticket
    const { data: ticket, error } = await supabase
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

    // Create event
    await supabase
      .from('ticket_events')
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        event_type: 'assigned',
        new_value: assigned_to === 'unassigned' ? 'Unassigned' : assigned_to,
      })

    console.log('✅ Event created')

    // Send email notification and create in-app notification for assigned technician
    if (assigned_to && assigned_to !== 'unassigned' && ticket) {
      try {
        const assignedUser = (ticket as any).assigned_to_profile
        const assignerName = `${(ticketBefore as any).submitted_by_profile?.first_name || ''} ${(ticketBefore as any).submitted_by_profile?.last_name || ''}`.trim() || 'A team member'
        
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
