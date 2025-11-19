import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadTicketAttachment } from '@/lib/storage'

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
      .select()
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
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const fileUrl = await uploadTicketAttachment(file, ticket.id, user.id)
          
          await supabase
            .from('ticket_attachments')
            .insert({
              ticket_id: ticket.id,
              uploaded_by: user.id,
              file_name: file.name,
              file_url: fileUrl,
              file_type: file.type,
              file_size: file.size,
            })

          await supabase
            .from('ticket_events')
            .insert({
              ticket_id: ticket.id,
              user_id: user.id,
              event_type: 'attachment_added',
              new_value: file.name,
            })
        } catch (uploadError) {
          console.error('Failed to upload file:', uploadError)
        }
      }
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Ticket creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

