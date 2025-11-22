# Domain Configuration

## Production Domain

**Primary Domain:** `client.integratedlowvoltage.com`

### Vercel Configuration

1. **In Vercel Dashboard:**
   - Go to Project Settings → Domains
   - Add domain: `client.integratedlowvoltage.com`
   - Follow DNS setup instructions

2. **DNS Records (GoDaddy/Cloudflare):**
   ```
   Type: CNAME
   Name: client
   Value: cname.vercel-dns.com
   ```

3. **Environment Variables to Update:**
   - `NEXT_PUBLIC_APP_URL` = `https://client.integratedlowvoltage.com`
   - Update in Production environment
   - Redeploy after updating

### Email Configuration

**Mailgun Settings:**
- Emails will reference: `https://client.integratedlowvoltage.com`
- Logo URLs will use production domain
- Ticket links will use production domain

### No Code Changes Needed

The app uses `process.env.NEXT_PUBLIC_APP_URL` for all links, so updating the environment variable is sufficient. No code changes required for the domain switch.

