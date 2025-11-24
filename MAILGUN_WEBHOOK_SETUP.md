# Mailgun Webhook Setup Guide

## Overview

You need to set up **two types of webhooks** in Mailgun:

1. **Inbound Email Routing** - For email ticketing (emails → tickets)
2. **Email Reply Handling** - For email replies (replies → ticket comments)

---

## Prerequisites

✅ **Already Configured:**
- Mailgun domain: `portal.integratedlowvoltage.com`
- SMTP credentials for sending emails
- Environment variables: `MAILGUN_SMTP_PASSWORD`, `MAILGUN_DOMAIN`, `MAILGUN_FROM_EMAIL`

⚠️ **Need to Add:**
- Mailgun API key (for webhook verification)
- Webhook endpoint URLs
- Inbound routing rules

---

## Step 1: Get Mailgun API Key

1. Go to **Mailgun Dashboard** → **Settings** → **API Keys**
2. Copy your **Private API Key** (starts with `key-...`)
3. **Add to Vercel Environment Variables:**

   ```
   Variable Name: MAILGUN_API_KEY
   Variable Value: [Your private API key]
   Environments: Production, Preview, Development
   ```

   ⚠️ **Important:** Use the **Private API Key**, not the Public API Key

---

## Step 2: Configure Inbound Email Routing

### Option A: Route All Emails to Support Address

1. Go to **Mailgun Dashboard** → **Receiving** → **Routes**
2. Click **"Create Route"**
3. Configure:
   - **Priority:** `0` (highest)
   - **Description:** `Support Email to Tickets`
   - **Expression Type:** `Match Recipient`
   - **Recipient:** `support@portal.integratedlowvoltage.com`
   - **Action:** `Forward to` → `https://client.integratedlowvoltage.com/api/webhooks/email/inbound`
   - **Action:** `Stop` (check this box)

4. Click **"Create Route"**

### Option B: Route Replies to Specific Endpoint

1. Create another route:
   - **Priority:** `1`
   - **Description:** `Email Replies to Comments`
   - **Expression Type:** `Match Recipient`
   - **Recipient:** `*+reply@portal.integratedlowvoltage.com` (or use reply-to pattern)
   - **Action:** `Forward to` → `https://client.integratedlowvoltage.com/api/webhooks/email/reply`
   - **Action:** `Stop`

---

## Step 3: Configure DNS Records (If Not Already Done)

For inbound email to work, you need MX records:

1. Go to **Mailgun Dashboard** → **Sending** → **Domain Settings** → `portal.integratedlowvoltage.com`
2. Go to **"Receiving DNS Records"** tab
3. Add these DNS records to your domain (GoDaddy/Cloudflare):

   ```
   Type: MX
   Name: @ (or portal.integratedlowvoltage.com)
   Value: mxa.mailgun.org
   Priority: 10
   TTL: 3600
   ```

   ```
   Type: MX
   Name: @ (or portal.integratedlowvoltage.com)
   Value: mxb.mailgun.org
   Priority: 10
   TTL: 3600
   ```

4. **Verify DNS:** Mailgun will show green checkmarks when records are verified

---

## Step 4: Create Webhook Endpoints in Your App

You'll need to create these API routes:

### 1. Inbound Email Handler (`/api/webhooks/email/inbound`)

**Purpose:** Process incoming emails and create tickets

**Location:** `src/app/api/webhooks/email/inbound/route.ts`

**Key Features:**
- Verify Mailgun signature (security)
- Parse email content
- Extract sender, subject, body, attachments
- Match sender to organization/user
- Create ticket automatically

### 2. Email Reply Handler (`/api/webhooks/email/reply`)

**Purpose:** Process email replies and add as ticket comments

**Location:** `src/app/api/webhooks/email/reply/route.ts`

**Key Features:**
- Verify Mailgun signature (security)
- Extract ticket ID from subject or reply-to header
- Parse reply content
- Add as comment to existing ticket
- Handle attachments

---

## Step 5: Mailgun Webhook Security

Mailgun sends webhooks with a signature for verification. You need to verify this signature to prevent spoofing.

**How Mailgun Signs Webhooks:**
- Uses your **Private API Key** as the signing key
- Sends `signature` and `timestamp` in the request
- You verify using `crypto` to ensure the request is from Mailgun

**Example Verification:**
```typescript
import crypto from 'crypto'

function verifyMailgunSignature(
  token: string,
  timestamp: string,
  signature: string
): boolean {
  const apiKey = process.env.MAILGUN_API_KEY
  if (!apiKey) return false

  const encodedToken = crypto
    .createHmac('sha256', apiKey)
    .update(timestamp.concat(token))
    .digest('hex')

  return encodedToken === signature
}
```

---

## Step 6: Email Reply-To Headers

To enable email replies, you need to set proper `Reply-To` headers in your outgoing emails.

**Current Email Template:**
- Uses `replyTo` parameter in `sendEmail()` function
- Should be: `ticket-{ticketId}@portal.integratedlowvoltage.com` or similar pattern

**Update Email Templates:**
```typescript
// In ticketCreated, ticketCommentAdded, etc.
replyTo: `ticket-${ticketId}@portal.integratedlowvoltage.com`
```

**Then configure Mailgun route to catch:**
- Pattern: `ticket-*@portal.integratedlowvoltage.com`
- Forward to: `/api/webhooks/email/reply`

---

## Step 7: Environment Variables Summary

Add these to **Vercel** → **Environment Variables**:

```bash
# Existing (already set)
MAILGUN_SMTP_PASSWORD=[SMTP password]
MAILGUN_DOMAIN=portal.integratedlowvoltage.com
MAILGUN_FROM_EMAIL=support@portal.integratedlowvoltage.com

# New (need to add)
MAILGUN_API_KEY=[Private API key from Mailgun dashboard]
```

---

## Step 8: Testing

### Test Inbound Email:

1. Send email to: `support@portal.integratedlowvoltage.com`
2. Subject: `Test Ticket - Camera Issue`
3. Body: `Camera is not working at Store #1`
4. Check Vercel logs for webhook receipt
5. Check database for new ticket

### Test Email Reply:

1. Reply to a ticket notification email
2. Check Vercel logs for webhook receipt
3. Check ticket comments for new reply

---

## Mailgun Dashboard Checklist

- [ ] Private API Key copied and added to Vercel env vars
- [ ] MX records added to DNS (for receiving emails)
- [ ] Route created for `support@portal.integratedlowvoltage.com` → `/api/webhooks/email/inbound`
- [ ] Route created for replies → `/api/webhooks/email/reply`
- [ ] DNS records verified (green checkmarks in Mailgun)
- [ ] Test email sent and received

---

## Security Best Practices

1. **Always verify Mailgun signatures** - Don't trust unverified webhooks
2. **Check timestamp** - Reject requests older than 15 minutes (prevent replay attacks)
3. **Rate limiting** - Consider adding rate limits to webhook endpoints
4. **HTTPS only** - Mailgun will only send to HTTPS endpoints (Vercel provides this)
5. **Logging** - Log all webhook attempts for debugging

---

## Troubleshooting

### Emails Not Being Received

1. **Check DNS:** Verify MX records are correct and verified in Mailgun
2. **Check Routes:** Verify routes are active and pointing to correct URLs
3. **Check Logs:** Mailgun dashboard → Logs → Check for delivery failures
4. **Check Vercel Logs:** Look for webhook requests in function logs

### Webhooks Not Working

1. **Check URL:** Ensure webhook URL is publicly accessible (HTTPS)
2. **Check Signature:** Verify signature verification is working
3. **Check Logs:** Vercel function logs will show webhook payloads
4. **Test Manually:** Use Mailgun's "Test" button in route settings

### Replies Creating New Tickets

1. **Check Reply-To:** Ensure reply-to headers are set correctly
2. **Check Route Priority:** Reply route should have higher priority than inbound route
3. **Check Parsing:** Verify ticket ID extraction from subject/reply-to

---

## Next Steps

After webhook setup is complete:

1. ✅ Create `/api/webhooks/email/inbound/route.ts` endpoint
2. ✅ Create `/api/webhooks/email/reply/route.ts` endpoint
3. ✅ Add signature verification
4. ✅ Test with real emails
5. ✅ Update email templates with proper reply-to headers

---

## Reference Links

- **Mailgun Routes Documentation:** https://documentation.mailgun.com/en/latest/user_manual.html#routes
- **Mailgun Webhooks:** https://documentation.mailgun.com/en/latest/user_manual.html#webhooks
- **Mailgun API:** https://documentation.mailgun.com/en/latest/api_reference.html

