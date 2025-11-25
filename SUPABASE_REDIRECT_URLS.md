# Supabase Auth Redirect URLs Configuration

## Overview

Supabase Auth requires redirect URLs to be explicitly allowed for security. This document lists all redirect URLs that need to be added to your Supabase project.

## Where to Add Redirect URLs

1. Go to your **Supabase Dashboard**
2. Navigate to: **Authentication → URL Configuration**
3. Add the URLs listed below to the **Redirect URLs** section

## Required Redirect URLs

### Production URLs

Add these exact URLs for your production environment:

```
https://client.integratedlowvoltage.com/reset-password
https://client.integratedlowvoltage.com/invite/**
https://client.integratedlowvoltage.com/**
```

**Note:** The `/**` wildcard pattern allows all paths under the domain, which is useful for:
- Password reset redirects (`/reset-password`)
- Invitation links (`/invite/{token}`)
- OAuth callbacks (if you add OAuth providers later)
- Email confirmation links

### Vercel Preview URLs (Wildcard Pattern)

For Vercel preview deployments, use this wildcard pattern:

```
https://*-*.vercel.app/**
```

This pattern matches all Vercel preview URLs automatically, such as:
- `https://integratedlv-git-main-kevin-kuznetsovs-projects.vercel.app/**`
- `https://integratedlv-git-feature-branch-kevin-kuznetsovs-projects.vercel.app/**`

**Alternative:** If you want to be more specific, you can use:
```
https://*-kevin-kuznetsovs-projects.vercel.app/**
```

### Local Development

For local development, add:

```
http://localhost:3000/**
```

This allows all localhost paths for development.

## Complete List (Copy-Paste Ready)

Copy and paste these into Supabase Dashboard → Authentication → URL Configuration:

```
https://client.integratedlowvoltage.com/**
https://*-*.vercel.app/**
http://localhost:3000/**
```

## What Each URL Is Used For

### `/reset-password`
- **Used by:** Password reset flow (`src/app/(auth)/forgot-password/page.tsx`)
- **When:** User clicks "Forgot Password" and receives email with reset link
- **Redirect:** User is redirected here after clicking the email link

### `/invite/**`
- **Used by:** Invitation system (`src/app/api/invitations/route.ts`)
- **When:** Admin invites a new user via email
- **Redirect:** New user clicks invitation link and is redirected here

### `/**` (Wildcard)
- **Used by:** General auth flows, OAuth (if added), email confirmations
- **When:** Any authentication redirect that needs to return to your app
- **Redirect:** Catch-all for all auth-related redirects

## Testing Redirect URLs

After adding the URLs, test them:

1. **Password Reset:**
   - Go to `/forgot-password`
   - Enter an email address
   - Check email for reset link
   - Click link - should redirect to `/reset-password`

2. **Invitations:**
   - Create an invitation via admin panel
   - Click invitation link from email
   - Should redirect to `/invite/{token}`

## Troubleshooting

### Error: "Redirect URL not allowed"

If you see this error:
1. Check that the exact URL is in your Supabase redirect URL list
2. Ensure there are no trailing slashes (unless using wildcards)
3. Verify the protocol (`https://` vs `http://`)
4. Check for typos in the domain

### Wildcard Patterns

Supabase supports these wildcard patterns:
- `*` - Matches any sequence of non-separator characters
- `**` - Matches any sequence of characters (including separators)
- `?` - Matches any single character

**Example:**
- `http://localhost:3000/*` - Matches `/foo` but NOT `/foo/bar`
- `http://localhost:3000/**` - Matches `/foo` AND `/foo/bar`

For Vercel preview URLs, use `**` to match all paths.

## Security Notes

- ✅ **DO** use wildcards for preview/local URLs
- ✅ **DO** use exact URLs for production when possible
- ❌ **DON'T** use overly broad wildcards like `https://**` (security risk)
- ❌ **DON'T** expose your service role key in redirect URLs

## Additional Resources

- [Supabase Redirect URLs Documentation](https://supabase.com/docs/guides/auth/redirect-urls)
- [Vercel Preview URLs](https://vercel.com/docs/concepts/projects/environment-variables#system-environment-variables)

