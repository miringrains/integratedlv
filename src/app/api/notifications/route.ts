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

    let query = supabase
      .from('notifications')
      .select(`
        *,
        ticket:care_log_tickets (
          id,
          ticket_number,
          title,
          status,
          priority
        ),
        related_user:profiles!notifications_related_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Failed to fetch notifications:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(notifications || [])
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

/**
 * Get unread notification count
 * GET /api/notifications/count
 */
export async function GET_COUNT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('Failed to count notifications:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error: any) {
    console.error('Notification count error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

