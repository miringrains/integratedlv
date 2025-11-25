import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTicketSummaryAsync } from '@/lib/ticket-summary'
import { isPlatformAdmin } from '@/lib/auth'

/**
 * Manual endpoint to regenerate ticket summary
 * Only accessible to platform admins
 * Useful for testing or regenerating summaries
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

    // Only platform admins can manually trigger summary generation
    const isPlatformAdminUser = await isPlatformAdmin()
    if (!isPlatformAdminUser) {
      return NextResponse.json({ error: 'Forbidden - Platform admin only' }, { status: 403 })
    }

    const { id } = await context.params

    // Check if ticket exists and is closed
    const { data: ticket } = await supabase
      .from('care_log_tickets')
      .select('id, status, closed_summary')
      .eq('id', id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (ticket.status !== 'closed') {
      return NextResponse.json({ 
        error: 'Ticket must be closed to generate summary',
        status: ticket.status 
      }, { status: 400 })
    }

    // Generate summary (will skip if already exists unless we force regenerate)
    const summary = await generateTicketSummaryAsync(id)

    if (!summary) {
      return NextResponse.json({ 
        error: 'Failed to generate summary',
        message: 'Check server logs for details'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      summary,
      message: 'Summary generated successfully'
    })
  } catch (error) {
    console.error('Error in summary generation endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

