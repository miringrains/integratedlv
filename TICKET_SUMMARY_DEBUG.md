# Ticket Summary Debugging Guide

## Quick Checks

### 1. Check if Summary Was Generated

**In Vercel Logs** (or your server logs):
- Look for: `🔄 Triggering summary generation for ticket [ID]...`
- Look for: `✅ Successfully saved summary to database for ticket [ID]`
- Look for: `❌ Failed to generate summary` (if there's an error)

**In Database**:
```sql
SELECT id, ticket_number, status, closed_summary 
FROM care_log_tickets 
WHERE id = 'YOUR_TICKET_ID';
```

If `closed_summary` is `NULL`, the summary wasn't generated or failed.

### 2. Check OpenAI API Key

**Environment Variable**:
- Make sure `OPENAI_API_KEY` is set in Vercel
- Check: Vercel Dashboard → Settings → Environment Variables

**In Logs**:
- Look for: `⚠️ OPENAI_API_KEY not configured - ticket summaries will not be generated`
- Look for: `✅ Successfully used OpenAI model: gpt-4o` (or another model)

### 3. Check Ticket Status

The summary only generates when a ticket is **closed**:
```sql
SELECT status FROM care_log_tickets WHERE id = 'YOUR_TICKET_ID';
```

Must be `closed` for summary generation to trigger.

### 4. Manual Summary Generation (For Testing)

If you're a Platform Admin, you can manually trigger summary generation:

```bash
# Replace YOUR_TICKET_ID with actual ticket ID
curl -X POST https://your-domain.com/api/tickets/YOUR_TICKET_ID/summary \
  -H "Cookie: your-auth-cookie"
```

Or use the browser console:
```javascript
fetch('/api/tickets/YOUR_TICKET_ID/summary', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

## Common Issues

### Issue 1: Summary Generation Never Started

**Symptoms**: No logs about summary generation
**Cause**: Ticket status update didn't trigger summary generation
**Fix**: Check that ticket was actually closed via the status API route

### Issue 2: Summary Generation Failed Silently

**Symptoms**: Logs show generation started but no success message
**Cause**: OpenAI API error, missing API key, or model unavailable
**Fix**: 
- Check logs for specific error messages
- Verify `OPENAI_API_KEY` is set
- Check OpenAI account has API access

### Issue 3: Summary Generated But Not Displayed

**Symptoms**: Database has `closed_summary` but UI doesn't show it
**Cause**: Page cache or query issue
**Fix**:
- Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+R)
- Check that ticket status is `closed`
- Verify `closed_summary` is not null in database

### Issue 4: "Model not available" Warnings

**Symptoms**: Logs show `⚠️ Model gpt-5.1 not available, trying next model...`
**Status**: **This is normal!** The code will automatically use the next available model (usually `gpt-4o`)
**Action**: No action needed - summaries will still work

## Debugging Steps

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Your Project → Functions
   - Look for the `/api/tickets/[id]/status` function logs
   - Check for summary generation logs

2. **Check Database**:
   ```sql
   -- Check if summary exists
   SELECT id, ticket_number, status, closed_summary 
   FROM care_log_tickets 
   WHERE status = 'closed' 
   ORDER BY closed_at DESC 
   LIMIT 5;
   ```

3. **Test Manual Generation**:
   - Use the manual endpoint (if Platform Admin)
   - Check response for errors

4. **Verify Environment Variables**:
   - `OPENAI_API_KEY` must be set
   - Check Vercel environment variables are deployed

5. **Check Page Refresh**:
   - The summary appears immediately after generation
   - Try hard refresh if you don't see it

## Expected Log Flow

When a ticket is closed, you should see:

```
🔄 Triggering summary generation for ticket [ID]...
📝 Starting summary generation for ticket [ID]...
📋 Ticket [ID] status: closed, has summary: false
📝 Fetching comments for ticket [ID]...
📝 Found X comments for ticket [ID]
👤 Fetching profiles for Y users...
📝 Using Z public comments for summary generation
🤖 Calling OpenAI API to generate summary for ticket [ID]...
✅ Successfully used OpenAI model: gpt-4o
✅ OpenAI generated summary (XXX characters) for ticket [ID]
💾 Saving summary to database for ticket [ID]...
✅ Successfully saved summary to database for ticket [ID]
✅ Summary generated successfully for ticket [ID]
```

If any step fails, you'll see an error message explaining why.

## Still Not Working?

1. Check Vercel deployment logs for errors
2. Verify `OPENAI_API_KEY` is correct and has credits
3. Check that ticket actually closed (status = 'closed')
4. Try manual summary generation endpoint
5. Check database directly for `closed_summary` field

