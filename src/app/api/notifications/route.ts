import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth'

/**
 * Get user's notifications
 * GET /api/notifications?unread_only=true
 * 
 * Returns notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread_only') === 'true'

    // Try to fetch notifications with ticket and user joins
    // Use simpler query without FK hints that might not exist
    let baseQuery = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (unreadOnly) {
      baseQuery = baseQuery.eq('is_read', false)
    }

    const { data: notifications, error } = await baseQuery

    if (error) {
      console.error('Failed to fetch notifications:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If we have notifications, enrich them with ticket data
    const enrichedNotifications = await Promise.all(
      (notifications || []).map(async (notification) => {
        let ticket = null
        let related_user = null

        // Fetch ticket data if ticket_id exists
        if (notification.ticket_id) {
          const { data: ticketData } = await supabase
            .from('care_log_tickets')
            .select('id, ticket_number, title, status, priority')
            .eq('id', notification.ticket_id)
            .single()
          ticket = ticketData
        }

        // Fetch related user data if related_user_id exists
        if (notification.related_user_id) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .eq('id', notification.related_user_id)
            .single()
          related_user = userData
        }

        return {
          ...notification,
          ticket,
          related_user
        }
      })
    )

    return NextResponse.json(enrichedNotifications)
  } catch (error: any) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * Mark notifications as read
 * PUT /api/notifications
 * Body: { notification_ids?: string[] } (optional - if not provided, marks all as read)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notification_ids } = body

    if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .in('id', notification_ids)
        .eq('is_read', false)

      if (error) {
        console.error('Failed to mark notifications as read:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Mark all notifications as read for this user
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Failed to mark all notifications as read:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Mark notifications read error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

