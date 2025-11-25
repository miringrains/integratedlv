import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateTicketSummary } from '@/lib/openai'

/**
 * Generate ticket summary asynchronously and store in database
 * Uses service role client to bypass RLS (async operation loses user context)
 * 
 * @param ticketId - The ticket ID to generate summary for
 * @returns The generated summary or null if generation failed
 */
export async function generateTicketSummaryAsync(ticketId: string): Promise<string | null> {
  try {
    // Use service role client to bypass RLS (async operation loses user context)
    const supabase = createServiceRoleClient()

    // Check if summary already exists (prevent duplicate API calls)
    const { data: existingTicket } = await supabase
      .from('care_log_tickets')
      .select('closed_summary, status')
      .eq('id', ticketId)
      .single()

    if (!existingTicket) {
      console.error(`Ticket ${ticketId} not found`)
      return null
    }

    // Only generate if ticket is closed and summary doesn't exist
    if (existingTicket.status !== 'closed') {
      console.log(`Ticket ${ticketId} is not closed, skipping summary generation`)
      return null
    }

    if (existingTicket.closed_summary) {
      console.log(`Ticket ${ticketId} already has a summary, skipping generation`)
      return existingTicket.closed_summary
    }

    // Fetch full ticket data
    const { data: ticket, error: ticketError } = await supabase
      .from('care_log_tickets')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        resolved_at,
        closed_at
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      console.error(`Failed to fetch ticket ${ticketId}:`, ticketError)
      return null
    }

    // Fetch comments (public only - exclude internal notes)
    const { data: comments } = await supabase
      .from('ticket_comments')
      .select(`
        comment,
        is_internal,
        is_public,
        created_at,
        user:profiles!ticket_comments_user_id_fkey(first_name, last_name)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    // Fetch events (for status history)
    const { data: events } = await supabase
      .from('ticket_events')
      .select('event_type, old_value, new_value, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    // Generate summary using OpenAI
    const summary = await generateTicketSummary({
      title: ticket.title,
      description: ticket.description,
      comments: comments || [],
      events: events || [],
    })

    if (!summary) {
      console.error(`Failed to generate summary for ticket ${ticketId}`)
      return null
    }

    // Update ticket with summary (using service role client to bypass RLS)
    const { error: updateError } = await supabase
      .from('care_log_tickets')
      .update({ closed_summary: summary })
      .eq('id', ticketId)

    if (updateError) {
      console.error(`Failed to update ticket ${ticketId} with summary:`, updateError)
      return null
    }

    console.log(`✅ Successfully generated summary for ticket ${ticketId}`)
    return summary
  } catch (error) {
    console.error(`Error generating summary for ticket ${ticketId}:`, error)
    return null
  }
}

