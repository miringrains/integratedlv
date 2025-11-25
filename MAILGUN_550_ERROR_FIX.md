# Fixing 550 "Recipient Rejected" Error

## 🚨 **Your Current Issue**

You're getting:
```
550 5.0.1 Recipient rejected
ticket-83bd46af-8535-4239-a1b9-de884b9e9291@portal.integratedlowvoltage.com
```

**Your routes are configured correctly:**
- ✅ Route 0: `support@portal.integratedlowvoltage.com` → inbound webhook
- ✅ Route 1: `ticket-*@portal.integratedlowvoltage.com` → reply webhook

**The problem:** Mailgun is rejecting the email **BEFORE** it reaches route matching. This means the issue is at the **SMTP/MX record level**, not the route level.

---

## 🔍 **Root Cause: MX Records Not Configured**

The 550 error happens when:
1. Someone sends an email to `ticket-xxx@portal.integratedlowvoltage.com`
2. Their email server looks up MX records for `portal.integratedlowvoltage.com`
3. **No MX records found** → Email server rejects the email
4. Mailgun never receives the email → Routes never get a chance to process it

---

## ✅ **Solution: Configure MX Records**

### Step 1: Get MX Record Values from Mailgun

1. Go to **Mailgun Dashboard** → **Sending** → **Domain Settings**
2. Click on `portal.integratedlowvoltage.com`
3. Go to **"Receiving DNS Records"** tab
4. You'll see MX records that need to be added:

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

### Step 2: Add MX Records to Your DNS Provider

**If using GoDaddy:**
1. Log into GoDaddy
2. Go to **DNS Management**
3. Find `portal.integratedlowvoltage.com` domain
4. Click **"Add"** → **"MX"**
5. Add first record:
   - **Name:** `@` (or leave blank)
   - **Value:** `mxa.mailgun.org`
   - **Priority:** `10`
   - **TTL:** `3600`
6. Click **"Add"** → **"MX"** again
7. Add second record:
   - **Name:** `@` (or leave blank)
   - **Value:** `mxb.mailgun.org`
   - **Priority:** `10`
   - **TTL:** `3600`
8. **Save** both records

**If using Cloudflare:**
1. Log into Cloudflare
2. Select `portal.integratedlowvoltage.com`
3. Go to **DNS** → **Records**
4. Click **"Add record"**
5. Add first MX record:
   - **Type:** `MX`
   - **Name:** `@` (or `portal.integratedlowvoltage.com`)
   - **Mail server:** `mxa.mailgun.org`
   - **Priority:** `10`
   - **TTL:** `Auto`
6. Click **"Add record"** again
7. Add second MX record:
   - **Type:** `MX`
   - **Name:** `@` (or `portal.integratedlowvoltage.com`)
   - **Mail server:** `mxb.mailgun.org`
   - **Priority:** `10`
   - **TTL:** `Auto`
8. **Save** both records

### Step 3: Verify MX Records

**Option A: Check in Mailgun Dashboard**
1. Go back to **Mailgun Dashboard** → **Receiving DNS Records**
2. Wait 5-10 minutes
3. MX records should show ✅ green checkmarks
4. If still ❌, wait up to 48 hours for DNS propagation

**Option B: Check via Command Line**
```bash
# Run this command
dig MX portal.integratedlowvoltage.com

# You should see:
# portal.integratedlowvoltage.com. 3600 IN MX 10 mxa.mailgun.org.
# portal.integratedlowvoltage.com. 3600 IN MX 10 mxb.mailgun.org.
```

**Option C: Online DNS Checker**
- Go to https://mxtoolbox.com/SuperTool.aspx
- Enter: `portal.integratedlowvoltage.com`
- Select "MX Lookup"
- Should show `mxa.mailgun.org` and `mxb.mailgun.org`

---

## 🧪 **Test After MX Records Are Configured**

1. **Wait 24-48 hours** for DNS propagation (can be faster, but allow time)
2. **Send a test email** to: `test@portal.integratedlowvoltage.com`
3. **Check Mailgun Dashboard** → **Logs** → **Receiving**
4. You should see the email appear in logs
5. **If email appears:** MX records are working! ✅
6. **If still 550 error:** Wait longer or check DNS configuration

---

## 🔄 **Once MX Records Are Working**

After MX records are configured and verified:

1. **Reply to a ticket email** (the one with `ticket-xxx@portal.integratedlowvoltage.com`)
2. **Email should send successfully** (no 550 error)
3. **Check Vercel logs** for webhook receipt:
   ```
   📧 Email reply webhook received
   ✅ Mailgun signature verified
   🎫 Found ticket identifier: {uuid}
   ✅ Comment added: {commentId}
   ```
4. **Check ticket in portal** - reply should appear as a comment

---

## 📋 **Quick Checklist**

- [ ] MX records added to DNS provider (GoDaddy/Cloudflare)
- [ ] Both MX records configured (`mxa.mailgun.org` and `mxb.mailgun.org`)
- [ ] Priority set to `10` for both
- [ ] Waited 24-48 hours for DNS propagation
- [ ] Verified MX records in Mailgun dashboard (green checkmarks ✅)
- [ ] Test email to `test@portal.integratedlowvoltage.com` appears in Mailgun logs
- [ ] Reply to ticket email works (no 550 error)
- [ ] Reply appears as comment in portal

---

## ⚠️ **Important Notes**

1. **DNS Propagation Takes Time:** Changes can take 24-48 hours to propagate globally
2. **Both MX Records Required:** You need BOTH `mxa.mailgun.org` and `mxb.mailgun.org`
3. **Priority Must Match:** Both should have priority `10`
4. **Routes Are Already Correct:** Your routes are fine - this is purely a DNS/MX issue

---

**Once MX records are configured, email replies will work!** 🎉

