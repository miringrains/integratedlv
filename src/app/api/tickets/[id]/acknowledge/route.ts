import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth'

/**
 * Acknowledge a ticket
 * POST /api/tickets/[id]/acknowledge
 * 
 * Sets acknowledged_at timestamp and creates ticket event
 */
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

    // Get current ticket
    const { data: ticket } = await supabase
      .from('care_log_tickets')
      .select('*')
      .eq('id', id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check permissions - only platform admins or assigned user can acknowledge
    const profile = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile.data?.is_platform_admin || false
    const isAssigned = ticket.assigned_to === user.id

    if (!isAdmin && !isAssigned) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if already acknowledged
    if (ticket.acknowledged_at) {
      return NextResponse.json({ error: 'Ticket already acknowledged' }, { status: 400 })
    }

    // Update ticket with acknowledged_at
    const { data: updatedTicket, error: updateError } = await supabase
      .from('care_log_tickets')
      .update({ 
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Create ticket event
    await supabase
      .from('ticket_events')
      .insert({
        ticket_id: id,
        user_id: user.id,
        event_type: 'updated',
        new_value: 'acknowledged',
        comment: 'Ticket acknowledged',
        metadata: {
          acknowledged_at: updatedTicket.acknowledged_at
        }
      })

    return NextResponse.json({ 
      success: true,
      ticket: updatedTicket
    })
  } catch (error: any) {
    console.error('Acknowledge ticket error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
