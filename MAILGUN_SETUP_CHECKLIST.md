# Mailgun Webhook Setup Checklist

## ✅ Step 1: API Key Added
- [x] Added `MAILGUN_API_KEY` to Vercel environment variables

## 📋 Step 2: Configure Mailgun Routes

### Route 1: Inbound Support Emails

1. Go to **Mailgun Dashboard** → **Receiving** → **Routes**
2. Click **"Create Route"**
3. Fill in:
   ```
   Priority: 0
   Description: Support Email to Tickets
   Expression Type: Match Recipient
   Recipient: support@portal.integratedlowvoltage.com
   ```
4. Under **Actions**, click **"Add Action"** → Select **"Forward"**
5. Enter URL: `https://client.integratedlowvoltage.com/api/webhooks/email/inbound`
6. Check **"Stop"** checkbox (stops processing other routes)
7. Click **"Create Route"**

### Route 2: Email Replies

1. Click **"Create Route"** again
2. Fill in:
   ```
   Priority: 1
   Description: Email Replies to Comments
   Expression Type: Match Recipient
   Recipient: ticket-*@portal.integratedlowvoltage.com
   ```
   (Use wildcard pattern to catch all ticket reply addresses)
3. Under **Actions**, click **"Add Action"** → Select **"Forward"**
4. Enter URL: `https://client.integratedlowvoltage.com/api/webhooks/email/reply`
5. Check **"Stop"** checkbox
6. Click **"Create Route"**

---

## 📋 Step 3: DNS MX Records (For Receiving Emails)

1. Go to **Mailgun Dashboard** → **Sending** → **Domain Settings** → `portal.integratedlowvoltage.com`
2. Click **"Receiving DNS Records"** tab
3. You'll see required MX records:
   ```
   Type: MX
   Name: @
   Value: mxa.mailgun.org
   Priority: 10
   ```
   ```
   Type: MX
   Name: @
   Value: mxb.mailgun.org
   Priority: 10
   ```
4. Add these to your DNS provider (GoDaddy/Cloudflare/etc.)
5. Wait for DNS propagation (5-30 minutes)
6. Check Mailgun dashboard - should show ✅ green checkmarks when verified

---

## 🧪 Step 4: Test Webhooks

### Test 1: Email Reply (Easier to test first)

1. Create a ticket in the portal (or use existing ticket)
2. Check the email notification you received
3. Reply to that email (reply-to should be `ticket-{uuid}@portal.integratedlowvoltage.com`)
4. Check Vercel logs:
   - Go to Vercel Dashboard → Your Project → Deployments → Latest → Functions
   - Look for `/api/webhooks/email/reply` function logs
   - Should see: `✅ Mailgun signature verified` and `✅ Comment added`
5. Check the ticket in portal - your reply should appear as a comment

### Test 2: Inbound Email (Requires DNS setup)

1. Send email to: `support@portal.integratedlowvoltage.com`
2. Subject: `Test Ticket - Camera Issue`
3. Body: `Camera is not working at Store #1`
4. Check Vercel logs for `/api/webhooks/email/inbound`
5. Check database for new ticket (or check error if user not found)

---

## 🔍 Troubleshooting

### Webhook Not Receiving Requests

1. **Check Route Status:** Mailgun Dashboard → Routes → Ensure routes are **Active**
2. **Check URL:** Make sure URL is `https://client.integratedlowvoltage.com/api/webhooks/email/...`
3. **Check HTTPS:** Mailgun requires HTTPS (Vercel provides this automatically)
4. **Check Logs:** Mailgun Dashboard → Logs → Look for delivery failures

### Signature Verification Failing

1. **Check API Key:** Ensure `MAILGUN_API_KEY` is set correctly in Vercel
2. **Check Environment:** Make sure it's set for Production environment
3. **Redeploy:** After adding env var, redeploy the app

### Email Replies Not Working

1. **Check Reply-To Header:** Verify emails have `replyTo: ticket-{id}@portal.integratedlowvoltage.com`
2. **Check Route Pattern:** Ensure route matches `ticket-*@portal.integratedlowvoltage.com`
3. **Check Ticket ID Extraction:** Look at logs to see if ticket ID is being extracted correctly

---

## 📝 Next Steps After Setup

Once webhooks are working:

1. ✅ Complete inbound email handler (parse location/hardware, handle attachments)
2. ✅ Complete reply handler (handle attachments from replies)
3. ✅ Add error handling for edge cases
4. ✅ Add bounce email handling for unknown senders

---

## 🎯 Quick Test Commands

After setup, you can test webhook endpoints manually (for debugging):

```bash
# Test webhook endpoint is accessible
curl https://client.integratedlowvoltage.com/api/webhooks/email/reply
# Should return 401 (missing signature) - this is expected
```

If you get 401, the endpoint is working and just needs proper Mailgun signature.

