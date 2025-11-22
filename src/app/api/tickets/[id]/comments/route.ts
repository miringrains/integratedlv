import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/email'

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

    // Get ticket details
    const { data: ticket } = await supabase
      .from('care_log_tickets')
      .select(`
        *,
        submitted_by_profile:profiles!care_log_tickets_submitted_by_fkey(email, first_name, last_name),
        assigned_to_profile:profiles!care_log_tickets_assigned_to_fkey(email, first_name, last_name)
      `)
      .eq('id', ticketId)
      .single()

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
      .select(`
        *,
        user:profiles(first_name, last_name, email)
      `)
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

    // Send email notifications (only for public comments)
    if (!is_internal && ticket) {
      try {
        const commenterName = `${(newComment as any).user.first_name} ${(newComment as any).user.last_name}`
        const recipients: string[] = []

        // Notify submitter (if not the commenter)
        if ((ticket as any).submitted_by_profile?.email && 
            (ticket as any).submitted_by_profile.email !== (newComment as any).user.email) {
          recipients.push((ticket as any).submitted_by_profile.email)
        }

        // Notify assigned tech (if exists and not the commenter)
        if ((ticket as any).assigned_to_profile?.email && 
            (ticket as any).assigned_to_profile.email !== (newComment as any).user.email &&
            !recipients.includes((ticket as any).assigned_to_profile.email)) {
          recipients.push((ticket as any).assigned_to_profile.email)
        }

        // Send emails
        for (const email of recipients) {
          await sendEmail({
            to: email,
            ...emailTemplates.ticketCommentAdded(
              ticket.ticket_number,
              ticket.id,
              ticket.title,
              commenterName,
              comment,
              false
            ),
          })
        }
      } catch (emailError) {
        console.error('Failed to send comment notification emails:', emailError)
      }
    }

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
