import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Get current ticket
    const { data: ticket } = await supabase
      .from('care_log_tickets')
      .select('status')
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

    return NextResponse.json(updatedTicket)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

