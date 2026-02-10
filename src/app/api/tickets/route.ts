import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { uploadTicketAttachmentServer } from '@/lib/storage'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const ticketData = JSON.parse(formData.get('data') as string)
    const files = formData.getAll('files') as File[]

    // Validate org_id - platform admins might have null, but we need an org_id for the ticket
    if (!ticketData.org_id) {
      // Check if user is platform admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_platform_admin')
        .eq('id', user.id)
        .single()

      if (profile?.is_platform_admin) {
        // Platform admin must select an org when creating a ticket
        return NextResponse.json({ error: 'Organization is required to create a ticket' }, { status: 400 })
      } else {
        return NextResponse.json({ error: 'Organization is required' }, { status: 400 })
      }
    }

    // Normalize hardware_id - convert empty string to null
    const hardwareId = ticketData.hardware_id && ticketData.hardware_id !== '' 
      ? ticketData.hardware_id 
      : null

    // Use service role for all inserts - platform admins have no org_memberships
    // so INSERT policies on care_log_tickets, ticket_events, and ticket_attachments block them
    const adminSupabase = createServiceRoleClient()

    // Create ticket
    const { data: ticket, error: ticketError } = await adminSupabase
      .from('care_log_tickets')
      .insert({
        ...ticketData,
        hardware_id: hardwareId,
        submitted_by: user.id,
        status: 'open',
        sop_acknowledged_at: ticketData.sop_acknowledged ? new Date().toISOString() : null,
      })
      .select(`
        *,
        location:locations(name),
        organization:organizations(name),
        submitted_by_profile:profiles!care_log_tickets_submitted_by_fkey(first_name, last_name, email)
      `)
      .single()

    if (ticketError) {
      return NextResponse.json({ error: ticketError.message }, { status: 500 })
    }

    // Create initial event
    const { error: eventError } = await adminSupabase
      .from('ticket_events')
      .insert({
        ticket_id: ticket.id,
        user_id: user.id,
        event_type: 'created',
        new_value: 'open',
      })

    if (eventError) {
      console.error('Failed to create ticket creation event:', eventError)
    }

    // Upload attachments if provided
    console.log('📎 Files to upload:', files?.length || 0)
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          console.log('📤 Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type)
          const fileUrl = await uploadTicketAttachmentServer(file, ticket.id, user.id)
          console.log('✅ File uploaded to:', fileUrl)
          
          const { data: attachment, error: attachmentError } = await adminSupabase
            .from('ticket_attachments')
            .insert({
              ticket_id: ticket.id,
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
            throw attachmentError
          }

          console.log('✅ Attachment saved to database:', attachment.id)

          await adminSupabase
            .from('ticket_events')
            .insert({
              ticket_id: ticket.id,
              user_id: user.id,
              event_type: 'attachment_added',
              new_value: file.name,
            })
        } catch (uploadError) {
          console.error('❌ Failed to upload file:', file.name, uploadError)
        }
      }
    }

    // Send email notifications
    try {
      const submitterName = `${(ticket as any).submitted_by_profile.first_name} ${(ticket as any).submitted_by_profile.last_name}`
      const emailContent = emailTemplates.ticketCreated(
        ticket.ticket_number,
        ticket.id,
        ticket.title,
        ticket.description,
        (ticket as any).organization.name,
        (ticket as any).location.name,
        submitterName,
        ticket.priority
      )

      // Send notification to support@integratedlowvoltage.com (not all platform admins)
      const supportEmail = 'support@integratedlowvoltage.com'
        await sendEmail({
        to: supportEmail,
          ...emailContent,
        })

      // Send confirmation to submitter with reply-to header
      const submitterEmail = (ticket as any).submitted_by_profile?.email
      const replyToEmail = `ticket-${ticket.id}@${process.env.MAILGUN_DOMAIN}`
      
      if (submitterEmail && submitterEmail !== supportEmail) {
        await sendEmail({
          to: submitterEmail,
          replyTo: replyToEmail,
          subject: `[${ticket.ticket_number}] Ticket Received: ${ticket.title}`,
          html: emailContent.html.replace(
            'A new ticket has been submitted and requires attention.',
            'Your support ticket has been received and our team will review it shortly.'
          ).replace(
            'New Support Ticket',
            'Ticket Submitted Successfully'
          ),
        })
      }
    } catch (emailError) {
      console.error('Failed to send notification emails:', emailError)
      // Don't fail the ticket creation if email fails
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Ticket creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
