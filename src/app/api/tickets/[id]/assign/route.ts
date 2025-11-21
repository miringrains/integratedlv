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

    const { id: ticketId } = await context.params
    const body = await request.json()
    const { assigned_to } = body

    // Update ticket
    const { data: ticket, error } = await supabase
      .from('care_log_tickets')
      .update({ assigned_to: assigned_to === 'unassigned' ? null : assigned_to })
      .eq('id', ticketId)
      .select()
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

    return NextResponse.json(ticket)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





