import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/email'

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

    // Get ticket details before update
    const { data: ticketBefore } = await supabase
      .from('care_log_tickets')
      .select(`
        *,
        organization:organizations(name),
        location:locations(name),
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
        assigned_to_profile:profiles!care_log_tickets_assigned_to_fkey(email, first_name, last_name)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create event
    await supabase
      .from('ticket_events')
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        event_type: 'assigned',
        new_value: assigned_to === 'unassigned' ? 'Unassigned' : assigned_to,
      })

    // Send email notification to newly assigned user
    if (assigned_to && assigned_to !== 'unassigned' && (ticket as any).assigned_to_profile?.email) {
      try {
        const assigneeName = `${(ticket as any).assigned_to_profile.first_name} ${(ticket as any).assigned_to_profile.last_name}`
        
        await sendEmail({
          to: (ticket as any).assigned_to_profile.email,
          ...emailTemplates.ticketAssigned(
            ticket.ticket_number,
            ticket.id,
            ticket.title,
            assigneeName,
            (ticket as any).organization?.name || 'Unknown',
            (ticket as any).location?.name || 'Unknown',
            ticket.priority
          ),
        })
      } catch (emailError) {
        console.error('Failed to send assignment email:', emailError)
        // Don't fail the assignment if email fails
      }
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Assignment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
