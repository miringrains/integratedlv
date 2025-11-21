import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all tickets with related data
    const { data: tickets, error } = await supabase
      .from('care_log_tickets')
      .select(`
        *,
        location:locations(name),
        hardware:hardware(name),
        submitted_by_profile:profiles!care_log_tickets_submitted_by_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get attachment counts
    const ticketsWithCounts = await Promise.all(
      (tickets || []).map(async (ticket) => {
        const { count } = await supabase
          .from('ticket_attachments')
          .select('*', { count: 'exact', head: true })
          .eq('ticket_id', ticket.id)

        return {
          ...ticket,
          location_name: ticket.location?.name,
          hardware_name: ticket.hardware?.name,
          submitter_name: ticket.submitted_by_profile 
            ? `${ticket.submitted_by_profile.first_name} ${ticket.submitted_by_profile.last_name}`
            : 'Unknown',
          attachment_count: count || 0,
        }
      })
    )

    return NextResponse.json(ticketsWithCounts)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





