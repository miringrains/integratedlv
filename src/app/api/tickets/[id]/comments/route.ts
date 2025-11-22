import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/email'
import { uploadTicketAttachmentServer } from '@/lib/storage'

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
    
    // Handle FormData (for file uploads) or JSON
    const contentType = request.headers.get('content-type')
    let comment: string
    let is_internal: boolean
    let files: File[] = []

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()
      const data = JSON.parse(formData.get('data') as string)
      comment = data.comment
      is_internal = data.is_internal || false
      files = formData.getAll('files') as File[]
      console.log('📎 Reply with files:', files.length)
    } else {
      const body = await request.json()
      comment = body.comment
      is_internal = body.is_internal || false
    }

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

    console.log('✅ Reply created:', newComment.id)

    // Upload attachments if provided
    if (files && files.length > 0) {
      console.log('📤 Uploading', files.length, 'files for reply', newComment.id)
      for (const file of files) {
        try {
          console.log('📤 Uploading file:', file.name)
          const fileUrl = await uploadTicketAttachmentServer(file, ticketId, user.id)
          console.log('✅ File uploaded:', fileUrl)
          
          const { data: attachment, error: attachmentError } = await supabase
            .from('ticket_attachments')
            .insert({
              ticket_id: ticketId,
              comment_id: newComment.id, // Link to this specific reply
              uploaded_by: user.id,
              file_name: file.name,
              file_url: fileUrl,
              file_type: file.type,
              file_size: file.size,
            })
            .select()
            .single()

          if (attachmentError) {
            console.error('❌ Failed to save attachment to database:', attachmentError)
          } else {
            console.log('✅ Attachment saved to database:', attachment.id)
          }

          await supabase
            .from('ticket_events')
            .insert({
              ticket_id: ticketId,
              user_id: user.id,
              event_type: 'attachment_added',
              new_value: file.name,
            })
        } catch (uploadError) {
          console.error('❌ Failed to upload file:', file.name, uploadError)
        }
      }
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
    console.error('Reply creation error:', error)
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
        user:profiles (*),
        attachments:ticket_attachments (*)
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
