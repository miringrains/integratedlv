import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('care_log_tickets')
      .insert({
        ...ticketData,
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
    await supabase
      .from('ticket_events')
      .insert({
        ticket_id: ticket.id,
        user_id: user.id,
        event_type: 'created',
        new_value: 'open',
      })

    // Upload attachments if provided
    console.log('📎 Files to upload:', files?.length || 0)
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          console.log('📤 Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type)
          const fileUrl = await uploadTicketAttachmentServer(file, ticket.id, user.id)
          console.log('✅ File uploaded to:', fileUrl)
          
          const { data: attachment, error: attachmentError } = await supabase
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

          await supabase
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
      // Get all org admins for this organization
      const { data: orgAdmins } = await supabase
        .from('org_memberships')
        .select('profiles!inner(email, first_name, last_name)')
        .eq('org_id', ticketData.org_id)
        .in('role', ['org_admin', 'platform_admin'])

      // Get all platform admins (Integrated LV staff)
      const { data: platformAdmins } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('is_platform_admin', true)

      const recipients = [
        ...(orgAdmins?.map((m: any) => m.profiles.email) || []),
        ...(platformAdmins?.map(p => p.email) || []),
      ].filter((email, index, self) => email && self.indexOf(email) === index) // Remove duplicates

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

      // Send to all recipients
      for (const email of recipients) {
        await sendEmail({
          to: email,
          ...emailContent,
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
