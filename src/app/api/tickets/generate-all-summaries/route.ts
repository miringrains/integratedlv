import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTicketSummaryAsync } from '@/lib/ticket-summary'
import { isPlatformAdmin } from '@/lib/auth'

/**
 * Batch endpoint to generate summaries for all closed tickets that don't have them
 * Only accessible to platform admins
 * 
 * GET /api/tickets/generate-all-summaries
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only platform admins can batch generate summaries
    const isPlatformAdminUser = await isPlatformAdmin()
    if (!isPlatformAdminUser) {
      return NextResponse.json({ error: 'Forbidden - Platform admin only' }, { status: 403 })
    }

    console.log('🔍 Finding closed tickets without summaries...')

    // Use service role client to bypass RLS for batch operations
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceSupabase = createServiceRoleClient()

    // Find all closed tickets without summaries
    const { data: tickets, error } = await serviceSupabase
      .from('care_log_tickets')
      .select('id, ticket_number, title, closed_at')
      .eq('status', 'closed')
      .is('closed_summary', null)
      .order('closed_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching tickets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'All closed tickets already have summaries!',
        processed: 0,
        total: 0
      })
    }

    console.log(`📋 Found ${tickets.length} closed tickets without summaries`)

    const results = {
      total: tickets.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ ticket_id: string; ticket_number: string; error: string }>
    }

    // Process each ticket
    for (const ticket of tickets) {
      console.log(`🔄 Processing ticket ${ticket.ticket_number} (${ticket.id})...`)
      
      try {
        const summary = await generateTicketSummaryAsync(ticket.id)
        
        if (summary) {
          console.log(`   ✅ Summary generated (${summary.length} characters)`)
          results.successful++
        } else {
          console.log(`   ⚠️ Summary generation returned null`)
          results.failed++
          results.errors.push({
            ticket_id: ticket.id,
            ticket_number: ticket.ticket_number,
            error: 'Summary generation returned null'
          })
        }
      } catch (error) {
        console.error(`   ❌ Error generating summary:`, error)
        results.failed++
        results.errors.push({
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log('✅ Done processing all tickets!')
    console.log(`   Successful: ${results.successful}`)
    console.log(`   Failed: ${results.failed}`)

    return NextResponse.json({
      success: true,
      message: `Processed ${results.total} tickets`,
      ...results
    })
  } catch (error) {
    console.error('Error in batch summary generation:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

