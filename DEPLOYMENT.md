# Deployment Guide - Integrated LV Client Portal

## ✅ Code Successfully Pushed to GitHub

Repository: https://github.com/miringrains/integratedlv.git
Branch: `main`

---

## 🚀 Deploy to Vercel

### Step 1: Import Project to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub account and find `miringrains/integratedlv`
4. Click "Import"

### Step 2: Configure Project Settings

**Framework Preset:** Next.js (should auto-detect)
**Root Directory:** `./` (leave as default)
**Build Command:** `npm run build` (auto-detected)
**Output Directory:** `.next` (auto-detected)

### Step 3: Add Environment Variables

In Vercel dashboard, add these environment variables:

#### Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://tzlkmyqemdpmmrmwesuy.supabase.co
```

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bGtteXFlbWRwbW1ybXdlc3V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODgwMzksImV4cCI6MjA3OTE2NDAzOX0.F3pZE-yMjECKN9u2XeqGcKjXA_iqYOeGJ9hkI3PCd_k
```

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bGtteXFlbWRwbW1ybXdlc3V5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU4ODAzOSwiZXhwIjoyMDc5MTY0MDM5fQ.3xxi9TlI3s4hTIAMOE5sbikAb0TrZTDezytXXqT4zIs
```

**Important:** 
- Make sure all three environment variables are added
- They should be available for Production, Preview, and Development environments
- The `NEXT_PUBLIC_*` variables will be exposed to the browser (this is expected for Supabase client)

### Step 4: Deploy

Click "Deploy" and wait for the build to complete (~2-3 minutes)

---

## 📋 Post-Deployment Checklist

### 1. Verify Database Setup

✅ Database schema should already be applied via Supabase MCP
✅ All tables created with RLS policies
✅ Triggers and functions active

**If database is empty, run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents from `supabase/migrations/001_initial_schema.sql`
3. Execute the SQL

### 2. Create Storage Buckets (If Not Already Done)

In Supabase Dashboard → Storage:

**Bucket 1: user-avatars**
- Name: `user-avatars`
- Public: ✅ Yes
- File size limit: 5 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

**Bucket 2: ticket-attachments**
- Name: `ticket-attachments`
- Public: ❌ No
- File size limit: 10 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp, application/pdf`

**Bucket 3: hardware-photos**
- Name: `hardware-photos`
- Public: ❌ No
- File size limit: 10 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

### 3. Set First Platform Admin

After your first user signs up, set them as platform admin:

```sql
UPDATE profiles 
SET is_platform_admin = true 
WHERE email = 'your-admin-email@company.com';
```

Run this in Supabase Dashboard → SQL Editor

### 4. Configure Supabase Auth Settings (Optional)

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://your-vercel-app.vercel.app`
- **Redirect URLs:** Add your Vercel domain

---

## 🔗 Your Deployment URLs

After deployment, Vercel will provide:

- **Production URL:** `https://integratedlv.vercel.app` (or custom domain)
- **Preview URLs:** Automatic for each branch/PR
- **Domain Settings:** Configure in Vercel → Project Settings → Domains

---

## 🔐 Security Notes

### Environment Variables
- ✅ `NEXT_PUBLIC_*` variables are exposed to browser (this is expected)
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` is server-only (never exposed to browser)
- ✅ All API routes use server-side Supabase client

### Database Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Multi-tenant isolation enforced
- ✅ Role-based access control implemented
- ✅ Employee location restrictions active

---

## 📊 What's Deployed

### ✅ Fully Functional Features
- Multi-tenant authentication (login/signup)
- Dashboard with stats
- Locations management (CRUD)
- Hardware inventory (CRUD)
- Responsive UI with ILV branding
- Mobile-friendly navigation

### 🚧 Not Yet Implemented (Future Development)
- SOPs module
- Care log ticket system
- SOP acknowledgment workflow
- Photo uploads
- Admin user management
- Analytics dashboard

---

## 🐛 Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Ensure all three variables are added
- Verify Supabase URL format is correct

### Can't Login After Signup
- Check Supabase Auth is configured
- Verify email confirmation settings in Supabase
- Check Site URL in Supabase Auth settings

### Database Errors
- Verify all tables exist in Supabase
- Check RLS policies are enabled
- Run the migration SQL if tables are missing

### 404 on Routes
- Ensure build completed successfully
- Check Next.js version compatibility
- Verify file structure matches repository

---

## 📞 Support

- GitHub Repository: https://github.com/miringrains/integratedlv
- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs

---

## 🎉 You're Done!

Your Integrated LV Client Portal should now be live and accessible at your Vercel URL.

**First Steps After Deployment:**
1. Visit your Vercel URL
2. Click "Sign up" and create your account
3. Set yourself as platform admin (SQL query above)
4. Start adding locations and hardware!

