import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * Verify Mailgun webhook signature
 * 
 * Mailgun uses HMAC-SHA256(timestamp + token, signingKey)
 * The signing key can be:
 * 1. MAILGUN_WEBHOOK_SIGNING_KEY (preferred - from Settings → API Security)
 * 2. MAILGUN_API_KEY (fallback - Private API key)
 */
function verifyMailgunSignature(
  token: string,
  timestamp: string,
  signature: string
): boolean {
  // Try webhook signing key first, then fall back to API key
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY || process.env.MAILGUN_API_KEY
  
  if (!signingKey) {
    console.error('❌ Mailgun signing key not configured')
    console.error('   Set either MAILGUN_WEBHOOK_SIGNING_KEY or MAILGUN_API_KEY')
    console.error('   Get webhook signing key from: Mailgun Dashboard → Settings → API Security')
    return false
  }

  // Check timestamp (prevent replay attacks)
  const requestTime = parseInt(timestamp, 10)
  if (isNaN(requestTime)) {
    console.error('❌ Invalid timestamp format:', timestamp)
    return false
  }

  const currentTime = Math.floor(Date.now() / 1000)
  const timeDiff = Math.abs(currentTime - requestTime)
  
  if (timeDiff > 900) { // 15 minutes
    console.error('❌ Webhook timestamp too old:', timeDiff, 'seconds')
    return false
  }

  // Verify signature
  // Mailgun signature: HMAC-SHA256(timestamp + token, signingKey)
  const encodedToken = crypto
    .createHmac('sha256', signingKey)
    .update(timestamp.concat(token))
    .digest('hex')

  const isValid = encodedToken === signature
  
  if (!isValid) {
    console.error('❌ Invalid Mailgun signature', {
      expected: encodedToken.substring(0, 20) + '...',
      received: signature.substring(0, 20) + '...',
      timestamp,
      timeDiff,
    })
    console.error('💡 Troubleshooting:')
    console.error('   1. Check Mailgun Dashboard → Settings → API Security for webhook signing key')
    console.error('   2. Ensure MAILGUN_WEBHOOK_SIGNING_KEY or MAILGUN_API_KEY is set correctly')
    console.error('   3. Verify the key matches the one in Mailgun dashboard')
  } else {
    console.log('✅ Signature verified successfully')
  }
  
  return isValid
}

/**
 * Parse email content from Mailgun webhook payload
 */
function parseEmailPayload(formData: FormData) {
  const sender = formData.get('sender') as string
  const from = formData.get('From') as string
  const subject = formData.get('subject') as string
  const bodyPlain = formData.get('body-plain') as string
  const bodyHtml = formData.get('body-html') as string
  const recipient = formData.get('recipient') as string
  
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

  return {
    sender,
    from,
    subject,
    bodyPlain: bodyPlain || '',
    bodyHtml: bodyHtml || '',
    recipient,
    attachments,
  }
}

/**
 * Find or create user from email address
 */
async function findUserByEmail(supabase: any, email: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, org_memberships(org_id, role)')
    .eq('email', email.toLowerCase())
    .single()

  return profile
}

/**
 * Extract organization from email or create ticket for unknown sender
 */
async function determineOrgForTicket(supabase: any, senderEmail: string) {
  // Try to find user
  const user = await findUserByEmail(supabase, senderEmail)
  
  if (user && user.org_memberships && user.org_memberships.length > 0) {
    return {
      orgId: user.org_memberships[0].org_id,
      submittedBy: user.id,
    }
  }

  // If user not found, we need to determine org another way
  // Option 1: Use a default org (not recommended)
  // Option 2: Create ticket in "Unassigned" org
  // Option 3: Require user to exist first
  
  // For now, return null - ticket creation will fail gracefully
  return null
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Inbound email webhook received')

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

    // Parse email content
    const email = parseEmailPayload(formData)
    console.log('📧 Email from:', email.sender)
    console.log('📧 Subject:', email.subject)
    console.log('📧 Attachments:', email.attachments.length)

    // Determine organization and submitter
    const supabase = await createClient()
    const orgInfo = await determineOrgForTicket(supabase, email.sender)

    if (!orgInfo) {
      console.error('❌ Could not determine organization for sender:', email.sender)
      // Could send a bounce email or create ticket in a "pending" state
      return NextResponse.json({ 
        error: 'Sender not found in system. Please create an account first.',
        sender: email.sender 
      }, { status: 400 })
    }

    // TODO: Determine location and hardware from email content
    // For now, we'll need default values or require them in email format
    
    // Create ticket
    // Note: This is a simplified version - you'll need to:
    // 1. Parse location/hardware from email (or use defaults)
    // 2. Handle attachments (download from Mailgun URLs and upload to Supabase)
    // 3. Set priority based on subject/body keywords
    
    console.log('✅ Email processed successfully')
    return NextResponse.json({ 
      success: true,
      message: 'Email received and will be processed'
    })

  } catch (error) {
    console.error('❌ Inbound email webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

