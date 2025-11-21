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
    const { comment, is_internal } = body

    // Add comment
    const { data: newComment, error: commentError } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        comment,
        is_internal: is_internal || false,
        is_public: !is_internal,
      })
      .select()
      .single()

    if (commentError) {
      return NextResponse.json({ error: commentError.message }, { status: 500 })
    }

    // Create event
    await supabase
      .from('ticket_events')
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        event_type: 'comment_added',
        comment: is_internal ? '[Internal Note]' : comment.substring(0, 100),
        metadata: { is_internal },
      })

    return NextResponse.json(newComment)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
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

    const { data: comments, error } = await supabase
      .from('ticket_comments')
      .select(`
        *,
        user:profiles (*)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(comments || [])
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





