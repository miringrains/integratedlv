import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/email'
import { uploadTicketAttachmentServer } from '@/lib/storage'
import { isPlatformAdmin } from '@/lib/auth'

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

    // HARD MANDATORY: Only platform admins can create internal notes
    if (is_internal) {
      const isPlatformAdminUser = await isPlatformAdmin()
      if (!isPlatformAdminUser) {
        return NextResponse.json({ 
          error: 'Forbidden - Only platform admins can create internal notes' 
        }, { status: 403 })
      }
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
    const uploadErrors: string[] = []
    if (files && files.length > 0) {
      console.log('📤 Uploading', files.length, 'files for reply', newComment.id)
      for (const file of files) {
        try {
          console.log('📤 Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type)
          
          // Validate file
          if (!file.type.startsWith('image/')) {
            uploadErrors.push(`${file.name}: Only image files are allowed`)
            continue
          }
          
          if (file.size > 10485760) { // 10MB
            uploadErrors.push(`${file.name}: File size exceeds 10MB limit`)
            continue
          }
          
          const fileUrl = await uploadTicketAttachmentServer(file, ticketId, user.id)
          console.log('✅ File uploaded:', fileUrl)
          
          if (!fileUrl) {
            uploadErrors.push(`${file.name}: Upload failed - no URL returned`)
            continue
          }
          
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
            uploadErrors.push(`${file.name}: ${attachmentError.message}`)
          } else {
            console.log('✅ Attachment saved to database:', attachment.id)

          await supabase
            .from('ticket_events')
            .insert({
              ticket_id: ticketId,
              user_id: user.id,
              event_type: 'attachment_added',
              new_value: file.name,
            })
          }
        } catch (uploadError) {
          console.error('❌ Failed to upload file:', file.name, uploadError)
          uploadErrors.push(`${file.name}: ${uploadError instanceof Error ? uploadError.message : 'Upload failed'}`)
        }
      }
      
      // If all uploads failed, return error
      if (uploadErrors.length === files.length) {
        return NextResponse.json({ 
          error: 'Failed to upload attachments',
          details: uploadErrors 
        }, { status: 500 })
      }
      
      // If some uploads failed, include warnings but don't fail the request
      if (uploadErrors.length > 0) {
        console.warn('⚠️ Some files failed to upload:', uploadErrors)
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

    // Fetch attachments for this comment to include in response
    const { data: attachments } = await supabase
      .from('ticket_attachments')
      .select('id, file_name, file_url, file_type, file_size')
      .eq('comment_id', newComment.id)
      .order('created_at', { ascending: true })

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

        // Send emails with reply-to header for email replies
        const replyToEmail = `ticket-${ticketId}@${process.env.MAILGUN_DOMAIN}`
        
        for (const email of recipients) {
          await sendEmail({
            to: email,
            replyTo: replyToEmail,
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

    // Return comment with attachments included
    return NextResponse.json({
      ...newComment,
      attachments: attachments || []
    })
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

    // Check if user is platform admin
    const isPlatformAdminUser = await isPlatformAdmin()

    // Get comments - filter out internal comments for non-platform admins
    let query = supabase
      .from('ticket_comments')
      .select(`
        *,
        user:profiles (*)
      `)
      .eq('ticket_id', ticketId)

    // HARD MANDATORY: Only platform admins can see internal comments
    if (!isPlatformAdminUser) {
      query = query.eq('is_internal', false)
    }

    const { data: comments, error } = await query.order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Manually fetch attachments for each comment (reverse FK relationship)
    const commentsWithAttachments = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: attachments } = await supabase
          .from('ticket_attachments')
          .select('id, file_name, file_url, file_type, file_size')
          .eq('comment_id', comment.id)
          .order('created_at', { ascending: true })
        
        return {
          ...comment,
          attachments: attachments || []
        }
      })
    )

    return NextResponse.json(commentsWithAttachments)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
