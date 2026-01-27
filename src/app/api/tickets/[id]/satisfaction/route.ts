import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Submit customer satisfaction rating
 * POST /api/tickets/[id]/satisfaction
 * 
 * Only the ticket submitter can rate their satisfaction
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
    const body = await request.json()
    const { rating, feedback } = body

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Get current ticket
    const { data: ticket } = await supabase
      .from('care_log_tickets')
      .select('submitted_by, status, customer_satisfaction_rating')
      .eq('id', id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Only ticket submitter can rate
    if (ticket.submitted_by !== user.id) {
      return NextResponse.json({ error: 'Only the ticket submitter can rate satisfaction' }, { status: 403 })
    }

    // Only allow rating on closed tickets
    if (ticket.status !== 'closed') {
      return NextResponse.json({ error: 'Satisfaction can only be rated for closed tickets' }, { status: 400 })
    }

    // Check if already rated
    if (ticket.customer_satisfaction_rating) {
      return NextResponse.json({ error: 'Satisfaction already rated for this ticket' }, { status: 400 })
    }

    // Update ticket with satisfaction rating
    const { data: updatedTicket, error: updateError } = await supabase
      .from('care_log_tickets')
      .update({ 
        customer_satisfaction_rating: rating,
        customer_satisfaction_feedback: feedback || null
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
        new_value: `satisfaction_rated_${rating}`,
        comment: `Customer satisfaction: ${rating}/5`,
        metadata: {
          rating,
          feedback: feedback || null
        }
      })

    return NextResponse.json({ 
      success: true,
      ticket: updatedTicket
    })
  } catch (error: any) {
    console.error('Satisfaction rating error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
