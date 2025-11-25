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
    console.log(`📝 Starting summary generation for ticket ${ticketId}...`)
    
    // Use service role client to bypass RLS (async operation loses user context)
    const supabase = createServiceRoleClient()

    // Check if summary already exists (prevent duplicate API calls)
    const { data: existingTicket, error: checkError } = await supabase
      .from('care_log_tickets')
      .select('closed_summary, status')
      .eq('id', ticketId)
      .single()

    if (checkError) {
      console.error(`❌ Error checking ticket ${ticketId}:`, checkError)
      return null
    }

    if (!existingTicket) {
      console.error(`❌ Ticket ${ticketId} not found`)
      return null
    }

    console.log(`📋 Ticket ${ticketId} status: ${existingTicket.status}, has summary: ${!!existingTicket.closed_summary}`)

    // Only generate if ticket is closed and summary doesn't exist
    if (existingTicket.status !== 'closed') {
      console.log(`⚠️ Ticket ${ticketId} is not closed (status: ${existingTicket.status}), skipping summary generation`)
      return null
    }

    if (existingTicket.closed_summary) {
      console.log(`✅ Ticket ${ticketId} already has a summary, skipping generation`)
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
    console.log(`📝 Fetching comments for ticket ${ticketId}...`)
    const { data: commentsData, error: commentsError } = await supabase
      .from('ticket_comments')
      .select(`
        comment,
        is_internal,
        is_public,
        created_at,
        user_id
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error(`❌ Error fetching comments for ticket ${ticketId}:`, commentsError)
    } else {
      console.log(`📝 Found ${commentsData?.length || 0} comments for ticket ${ticketId}`)
    }

    // Fetch user profiles for comments
    const userIds = [...new Set((commentsData || []).map((c: any) => c.user_id).filter(Boolean))]
    console.log(`👤 Fetching profiles for ${userIds.length} users...`)
    
    const { data: profilesData } = userIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds)
      : { data: [] }

    // Create a map of user_id to profile
    const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]))

    // Transform comments to match expected format
    const comments = (commentsData || []).map((c: any) => ({
      comment: c.comment,
      is_internal: c.is_internal,
      is_public: c.is_public,
      created_at: c.created_at,
      user: c.user_id ? profilesMap.get(c.user_id) || null : null,
    }))

    const publicComments = comments.filter((c) => !c.is_internal && (c.is_public !== false))
    console.log(`📝 Using ${publicComments.length} public comments for summary generation`)

    // Fetch events (for status history)
    const { data: events } = await supabase
      .from('ticket_events')
      .select('event_type, old_value, new_value, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    // Generate summary using OpenAI
    console.log(`🤖 Calling OpenAI API to generate summary for ticket ${ticketId}...`)
    const summary = await generateTicketSummary({
      title: ticket.title,
      description: ticket.description,
      comments: comments || [],
      events: events || [],
    })

    if (!summary) {
      console.error(`❌ OpenAI returned null summary for ticket ${ticketId}`)
      console.error(`   Check OpenAI API key and model availability`)
      return null
    }

    console.log(`✅ OpenAI generated summary (${summary.length} characters) for ticket ${ticketId}`)

    // Update ticket with summary (using service role client to bypass RLS)
    console.log(`💾 Saving summary to database for ticket ${ticketId}...`)
    const { error: updateError } = await supabase
      .from('care_log_tickets')
      .update({ closed_summary: summary })
      .eq('id', ticketId)

    if (updateError) {
      console.error(`❌ Failed to update ticket ${ticketId} with summary:`, updateError)
      return null
    }

    console.log(`✅ Successfully saved summary to database for ticket ${ticketId}`)
    return summary
  } catch (error) {
    console.error(`Error generating summary for ticket ${ticketId}:`, error)
    return null
  }
}

