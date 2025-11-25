# Supabase Configuration Repair Guide

## Quick Fix

If you've accidentally changed Supabase settings, run this repair script:

1. **Go to Supabase Dashboard** → SQL Editor
2. **Copy and paste** the contents of `supabase/migrations/007_fix_configuration.sql`
3. **Click "Run"**

This will fix:
- ✅ RLS status on all tables (enables/disables correctly)
- ✅ Storage buckets (creates if missing, fixes settings)
- ✅ Storage bucket RLS policies (creates if missing)
- ✅ Missing `closed_summary` column
- ✅ Critical database functions
- ✅ Performance indexes

## What Gets Fixed

### 1. RLS Status
- **Disables RLS** on: `profiles`, `org_memberships`, `ticket_comments` (prevents infinite recursion)
- **Enables RLS** on: All other tables (security enforcement)

### 2. Storage Buckets
- Creates/updates: `user-avatars`, `ticket-attachments`, `hardware-photos`
- Sets correct public/private status
- Configures file size limits and MIME types

### 3. Storage Policies
- Creates RLS policies for all buckets
- Ensures proper access control

### 4. Database Schema
- Adds `closed_summary` column if missing
- Creates necessary indexes

### 5. Functions & Triggers
- Ensures `handle_new_user()` function exists
- Creates trigger for automatic profile creation

## Verification

After running the script, verify:

1. **Storage Buckets**: Go to Storage → Should see 3 buckets
2. **RLS Status**: Go to Authentication → Policies → Check table RLS status
3. **Test Upload**: Try uploading an avatar in Settings
4. **Test Ticket**: Create a ticket and verify it works

## Common Issues Fixed

### Issue: "RLS policy violation" errors
**Fix**: Script ensures RLS is disabled on join tables (`profiles`, `org_memberships`)

### Issue: "Bucket not found" errors
**Fix**: Script creates all required buckets with correct settings

### Issue: "Avatar upload fails"
**Fix**: Script creates `user-avatars` bucket and policies

### Issue: "Ticket attachments fail"
**Fix**: Script creates `ticket-attachments` bucket and policies

### Issue: "closed_summary column missing"
**Fix**: Script adds the column if it doesn't exist

## Need More Help?

If issues persist after running the repair script:
1. Check Supabase Dashboard → Logs for specific errors
2. Verify environment variables in Vercel are set correctly
3. Check that your Supabase project is active (not paused)

