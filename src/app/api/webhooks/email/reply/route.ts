import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * Verify Mailgun webhook signature
 */
function verifyMailgunSignature(
  token: string,
  timestamp: string,
  signature: string
): boolean {
  const apiKey = process.env.MAILGUN_API_KEY
  if (!apiKey) {
    console.error('❌ MAILGUN_API_KEY not configured')
    return false
  }

  // Check timestamp (prevent replay attacks)
  const requestTime = parseInt(timestamp, 10)
  const currentTime = Math.floor(Date.now() / 1000)
  const timeDiff = Math.abs(currentTime - requestTime)
  
  if (timeDiff > 900) { // 15 minutes
    console.error('❌ Webhook timestamp too old:', timeDiff, 'seconds')
    return false
  }

  // Verify signature
  const encodedToken = crypto
    .createHmac('sha256', apiKey)
    .update(timestamp.concat(token))
    .digest('hex')

  const isValid = encodedToken === signature
  
  if (!isValid) {
    console.error('❌ Invalid Mailgun signature')
  }
  
  return isValid
}

/**
 * Extract ticket ID from email subject or reply-to header
 * 
 * Patterns to match:
 * - Subject: "Re: [TKT-20250101-000001] Camera Issue"
 * - Reply-To: "ticket-{uuid}@portal.integratedlowvoltage.com"
 * - In-Reply-To header
 */
function extractTicketId(subject: string, replyTo: string, inReplyTo: string | null, recipient: string | null): string | null {
  // Try to extract from recipient: "ticket-{uuid}@portal.integratedlowvoltage.com"
  // This is the most reliable method when Mailgun routes by recipient
  if (recipient) {
    const recipientMatch = recipient.match(/ticket-([a-f0-9-]+)@/)
    if (recipientMatch) {
      console.log('🎫 Found ticket ID from recipient:', recipientMatch[1])
      return recipientMatch[1]
    }
  }

  // Try to extract from subject: "Re: [TKT-20250101-000001] ..."
  const subjectMatch = subject.match(/\[(TKT-\d{8}-\d{6})\]/)
  if (subjectMatch) {
    console.log('🎫 Found ticket number from subject:', subjectMatch[1])
    return subjectMatch[1]
  }

  // Try to extract from reply-to: "ticket-{uuid}@..."
  if (replyTo) {
    const replyToMatch = replyTo.match(/ticket-([a-f0-9-]+)@/)
    if (replyToMatch) {
      console.log('🎫 Found ticket ID from reply-to:', replyToMatch[1])
      return replyToMatch[1]
    }
  }

  // Try to extract from In-Reply-To header (if present)
  if (inReplyTo) {
    const inReplyToMatch = inReplyTo.match(/ticket-([a-f0-9-]+)@/)
    if (inReplyToMatch) {
      console.log('🎫 Found ticket ID from In-Reply-To:', inReplyToMatch[1])
      return inReplyToMatch[1]
    }
  }

  console.log('❌ Could not extract ticket ID from:', { subject, replyTo, inReplyTo, recipient })
  return null
}

/**
 * Find ticket by ticket number or ID
 */
async function findTicket(supabase: any, ticketIdentifier: string) {
  // Try as UUID first
  const { data: ticketById } = await supabase
    .from('care_log_tickets')
    .select('id, ticket_number, org_id')
    .eq('id', ticketIdentifier)
    .single()

  if (ticketById) {
    return ticketById
  }

  // Try as ticket number
  const { data: ticketByNumber } = await supabase
    .from('care_log_tickets')
    .select('id, ticket_number, org_id')
    .eq('ticket_number', ticketIdentifier)
    .single()

  return ticketByNumber || null
}

/**
 * Parse email reply content
 */
function parseReplyPayload(formData: FormData) {
  const sender = formData.get('sender') as string
  const from = formData.get('From') as string
  const subject = formData.get('subject') as string
  const bodyPlain = formData.get('body-plain') as string
  const bodyHtml = formData.get('body-html') as string
  const replyTo = formData.get('Reply-To') as string || ''
  const inReplyTo = formData.get('In-Reply-To') as string || null
  const recipient = formData.get('recipient') as string || null
  
  // Get attachments
  const attachmentCount = parseInt(formData.get('attachment-count') as string || '0', 10)
  const attachments: Array<{ url: string; name: string; contentType: string; size: number }> = []
  
  for (let i = 0; i < attachmentCount; i++) {
    const attachmentUrl = formData.get(`attachment-${i + 1}`) as string
    const attachmentName = formData.get(`attachment-${i + 1}-name`) as string || `attachment-${i + 1}`
    const contentType = formData.get(`attachment-${i + 1}-content-type`) as string || 'application/octet-stream'
    const size = parseInt(formData.get(`attachment-${i + 1}-size`) as string || '0', 10)
    
    if (attachmentUrl) {
      attachments.push({
        url: attachmentUrl,
        name: attachmentName,
        contentType,
        size,
      })
    }
  }

  // Strip email reply headers/quotes from body
  // Common patterns: "On [date] wrote:", "-----Original Message-----", etc.
  let cleanBody = bodyPlain || ''
  cleanBody = cleanBody
    .replace(/On .+ wrote:.*$/s, '')
    .replace(/-----Original Message-----.*$/s, '')
    .replace(/From:.*$/gm, '')
    .replace(/Sent:.*$/gm, '')
    .replace(/To:.*$/gm, '')
    .replace(/Subject:.*$/gm, '')
    .trim()

  return {
    sender,
    from,
    subject,
    bodyPlain: cleanBody,
    bodyHtml: bodyHtml || '',
    replyTo,
    inReplyTo,
    recipient,
    attachments,
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Email reply webhook received')

    // Get form data (Mailgun sends as multipart/form-data)
    const formData = await request.formData()

    // Verify Mailgun signature
    const token = formData.get('token') as string
    const timestamp = formData.get('timestamp') as string
    const signature = formData.get('signature') as string

    if (!token || !timestamp || !signature) {
      console.error('❌ Missing Mailgun signature fields')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    if (!verifyMailgunSignature(token, timestamp, signature)) {
      console.error('❌ Invalid Mailgun signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('✅ Mailgun signature verified')

    // Parse email reply
    const email = parseReplyPayload(formData)
    console.log('📧 Reply from:', email.sender)
    console.log('📧 Subject:', email.subject)

    // Extract ticket ID
    const ticketIdentifier = extractTicketId(email.subject, email.replyTo, email.inReplyTo, email.recipient)
    
    if (!ticketIdentifier) {
      console.error('❌ Could not extract ticket ID from email')
      return NextResponse.json({ 
        error: 'Could not determine which ticket this reply is for',
        suggestion: 'Reply-to header should contain ticket ID'
      }, { status: 400 })
    }

    console.log('🎫 Found ticket identifier:', ticketIdentifier)

    // Find ticket
    const supabase = await createClient()
    const ticket = await findTicket(supabase, ticketIdentifier)

    if (!ticket) {
      console.error('❌ Ticket not found:', ticketIdentifier)
      return NextResponse.json({ 
        error: 'Ticket not found',
        ticketIdentifier 
      }, { status: 404 })
    }

    console.log('✅ Found ticket:', ticket.ticket_number)

    // Find or create user from email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email.sender.toLowerCase())
      .single()

    if (!profile) {
      console.error('❌ User not found for email:', email.sender)
      return NextResponse.json({ 
        error: 'User not found. Please create an account first.',
        sender: email.sender 
      }, { status: 400 })
    }

    // Add comment to ticket
    const { data: comment, error: commentError } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: ticket.id,
        user_id: profile.id,
        comment: email.bodyPlain,
        is_internal: false,
        is_public: true,
      })
      .select()
      .single()

    if (commentError) {
      console.error('❌ Failed to add comment:', commentError)
      return NextResponse.json({ error: commentError.message }, { status: 500 })
    }

    console.log('✅ Comment added:', comment.id)

    // TODO: Handle attachments
    // 1. Download attachments from Mailgun URLs
    // 2. Upload to Supabase storage
    // 3. Create ticket_attachments records

    // Create event
    await supabase
      .from('ticket_events')
      .insert({
        ticket_id: ticket.id,
        user_id: profile.id,
        event_type: 'comment_added',
        comment: 'Reply via email',
      })

    // Send notifications (if needed)
    // The existing comment notification logic will handle this

    console.log('✅ Email reply processed successfully')
    return NextResponse.json({ 
      success: true,
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      commentId: comment.id
    })

  } catch (error) {
    console.error('❌ Email reply webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

