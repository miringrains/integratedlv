# Mailgun Email Reply Setup - REQUIRED

## ⚠️ **Issue: Email Replies Failing with 550 Error**

When users reply to ticket notification emails, they receive:
```
550 5.0.1 Recipient rejected
```

This happens because Mailgun doesn't recognize the reply-to address `ticket-{uuid}@portal.integratedlowvoltage.com`.

---

## 🔧 **Solution: Configure Mailgun Route for Email Replies**

You need to create a **catch-all route** in Mailgun that forwards all emails to `ticket-*@portal.integratedlowvoltage.com` to your webhook endpoint.

---

## 📋 **Step-by-Step Setup**

### Step 1: Access Mailgun Dashboard

1. Go to https://app.mailgun.com
2. Select your domain: `portal.integratedlowvoltage.com`
3. Navigate to **Receiving** → **Routes**

### Step 2: Create Email Reply Route

**Option A: Wildcard Pattern (Recommended)**

1. Click **"Create Route"** button
2. Configure the route:

   **Priority:** `1` (lower than support@ route, which should be 0)
   
   **Description:** `Email Replies to Ticket Comments`
   
   **Expression Type:** `Match Recipient`
   
   **Recipient Pattern:** `ticket-*@portal.integratedlowvoltage.com`
   
   **Actions:**
   - ✅ **Forward to:** `https://client.integratedlowvoltage.com/api/webhooks/email/reply`
   - ✅ **Stop** (check this box to prevent further processing)

3. Click **"Create Route"**

**Option B: Catch-All Route (If Wildcard Doesn't Work)**

If Option A doesn't work (550 errors persist), use a catch-all route:

1. Click **"Create Route"** button
2. Configure the route:

   **Priority:** `1`
   
   **Description:** `Catch-All Email Replies`
   
   **Expression Type:** `Catch All` (or use regex: `match_recipient(".*@portal.integratedlowvoltage.com")`)
   
   **Actions:**
   - ✅ **Forward to:** `https://client.integratedlowvoltage.com/api/webhooks/email/reply`
   - ✅ **Stop** (check this box)

3. **Important:** The webhook will need to filter out non-ticket emails (it already does this by checking the recipient pattern)

### Step 3: Verify Route Configuration

After creating the route, you should see:
- **Priority:** 0
- **Expression:** `match_recipient("ticket-*@portal.integratedlowvoltage.com")`
- **Action:** Forward to webhook URL

---

## 🧪 **Testing Email Replies**

### Diagnostic: Check if Mailgun Can Receive Emails

**Before testing replies, verify Mailgun can receive emails:**

1. **Check MX Records:**
   ```bash
   # Run this command in terminal
   dig MX portal.integratedlowvoltage.com
   ```
   
   You should see:
   ```
   portal.integratedlowvoltage.com. 3600 IN MX 10 mxa.mailgun.org.
   portal.integratedlowvoltage.com. 3600 IN MX 10 mxb.mailgun.org.
   ```

2. **Send Test Email:**
   - Send an email from an external account (Gmail, etc.) to: `test@portal.integratedlowvoltage.com`
   - Check **Mailgun Dashboard** → **Logs** → **Receiving**
   - You should see the email appear in logs
   - If you see "550" or "rejected", MX records aren't configured correctly

3. **Check Mailgun Domain Status:**
   - Go to **Mailgun Dashboard** → **Sending** → **Domain Settings**
   - Look for "Receiving DNS Records" section
   - All records should show ✅ green checkmarks
   - If MX records show ❌, they're not configured in your DNS

### Test 1: Reply to Ticket Email

1. Open a ticket notification email (sent from `support@portal.integratedlowvoltage.com`)
2. Click **Reply** in your email client
3. The **Reply-To** header should show: `ticket-{uuid}@portal.integratedlowvoltage.com`
4. Type a reply and send
5. **If you get 550 error:** MX records are not configured (see Diagnostic above)
6. **If email sends successfully:** Check Vercel logs for webhook receipt:
   ```
   📧 Email reply webhook received
   ✅ Mailgun signature verified
   🎫 Found ticket identifier: {uuid}
   ✅ Comment added: {commentId}
   ```
7. Check the ticket in the portal - your reply should appear as a comment

### Test 2: Verify Webhook Endpoint

You can test the webhook directly (for debugging):

```bash
curl -X POST https://client.integratedlowvoltage.com/api/webhooks/email/reply \
  -H "Content-Type: application/json" \
  -d '{
    "test": "This is a test"
  }'
```

Expected response: `401 Unauthorized` (because no Mailgun signature)

---

## 🔍 **Troubleshooting**

### Issue: Still Getting 550 Errors

**The 550 error means Mailgun is rejecting the email BEFORE route matching happens.**

**Possible Causes:**
1. **MX records not configured** - Mailgun can't receive emails for the domain
2. **Domain receiving not enabled** - Mailgun domain needs to be set up for receiving
3. **Wildcard pattern not supported** - Some Mailgun configurations don't support `*` wildcards

**Solutions:**

#### Solution 1: Verify MX Records (MOST COMMON ISSUE)

1. Go to **Mailgun Dashboard** → **Sending** → **Domain Settings** → `portal.integratedlowvoltage.com`
2. Click **"Receiving DNS Records"** tab
3. Verify these MX records exist in your DNS (GoDaddy/Cloudflare):

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

4. **Wait 24-48 hours** for DNS propagation
5. Check Mailgun dashboard - MX records should show green checkmarks ✅

#### Solution 2: Use Catch-All Route Instead

If wildcard pattern doesn't work, try a catch-all route:

1. **Delete** the current `ticket-*` route
2. **Create new route** with:
   - **Priority:** `1`
   - **Expression Type:** `Catch All` (or `match_recipient(".*@portal.integratedlowvoltage.com")`)
   - **Action:** Forward to webhook
   - **Stop:** ✅ checked

3. **Update webhook** to filter only `ticket-*` addresses (add check in webhook code)

#### Solution 3: Verify Domain Receiving Status

1. Go to **Mailgun Dashboard** → **Sending** → **Domain Settings**
2. Check if domain shows "Receiving" status as **Active**
3. If not, you may need to verify domain ownership first

#### Solution 4: Test Route Pattern

Try testing with a specific address first:

1. Create a test route: `match_recipient("ticket-test@portal.integratedlowvoltage.com")`
2. Send a test email to that address
3. If it works, the pattern syntax might be the issue

**Recommended Fix Order:**
1. ✅ Check MX records (most likely issue)
2. ✅ Verify domain receiving is enabled
3. ✅ Try catch-all route if wildcard doesn't work
4. ✅ Check Mailgun logs to see if email is being received at all

### Issue: Webhook Not Receiving Replies

**Check:**
1. Vercel logs for webhook requests
2. Mailgun Dashboard → Logs → see if emails are being forwarded
3. Verify webhook URL is correct: `https://client.integratedlowvoltage.com/api/webhooks/email/reply`

### Issue: Replies Not Appearing in Tickets

**Check:**
1. Webhook logs for errors
2. Database for new `ticket_comments` records
3. Verify user email matches a profile in the database

---

## 📧 **How It Works**

1. **User replies to ticket email**
   - Email client uses `Reply-To: ticket-{uuid}@portal.integratedlowvoltage.com`

2. **Mailgun receives the reply**
   - Route matches pattern `ticket-*@portal.integratedlowvoltage.com`
   - Forwards to webhook endpoint

3. **Webhook processes the reply**
   - Verifies Mailgun signature (security)
   - Extracts ticket ID from email address
   - Finds ticket in database
   - Creates comment from email body
   - Handles attachments (if any)

4. **Comment appears in portal**
   - User sees their email reply as a ticket comment
   - Other users are notified (if configured)

---

## ✅ **Checklist**

- [ ] Mailgun route created for `ticket-*@portal.integratedlowvoltage.com`
- [ ] Route forwards to: `https://client.integratedlowvoltage.com/api/webhooks/email/reply`
- [ ] Route has "Stop" action enabled
- [ ] Route priority is 0 (highest)
- [ ] MX records configured (for receiving emails)
- [ ] Test reply sent and verified in portal
- [ ] Webhook logs show successful processing

---

## 🔐 **Security Notes**

- Webhook verifies Mailgun signature to prevent spoofing
- Only emails from Mailgun are processed
- Ticket ID is extracted from email address (secure UUID)
- User must exist in database to add comments

---

**Last Updated:** January 2025  
**Status:** Required for email reply functionality

