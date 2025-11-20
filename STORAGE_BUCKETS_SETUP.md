# Storage Buckets Setup - REQUIRED

## ⚠️ **Avatar Uploads Failing Because Buckets Don't Exist**

The storage buckets need to be created manually in Supabase Dashboard.

---

## 🪣 **Create These Buckets:**

Go to: **Supabase Dashboard → Storage → Create Bucket**

### 1. user-avatars (Required for Settings Page)

**Settings:**
- **Name:** `user-avatars`
- **Public:** ✅ Yes (checked)
- **File size limit:** 5 MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

**Click "Create bucket"**

---

### 2. ticket-attachments (Required for Tickets)

**Settings:**
- **Name:** `ticket-attachments`
- **Public:** ❌ No (unchecked)
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `application/pdf`

**Click "Create bucket"**

---

### 3. hardware-photos (Optional for Hardware)

**Settings:**
- **Name:** `hardware-photos`
- **Public:** ❌ No (unchecked)
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

**Click "Create bucket"**

---

## ✅ **After Creating Buckets:**

1. Refresh your portal
2. Go to Settings
3. Upload avatar → Should work now!
4. Avatar will:
   - Auto-compress to ~400x400px
   - Reduce file size to max 500KB
   - Store in Supabase Storage
   - Display immediately

---

## 🔐 **RLS Policies (Already Applied):**

I've already created the policies:
- Anyone can view avatars (public bucket)
- Authenticated users can upload
- Users can update/delete their own

Once buckets exist, uploads will work immediately!

---

**Priority:** Create `user-avatars` bucket NOW so avatar uploads work! 🪣

