# Vercel Environment Variables Setup

## ✅ **Add These to Vercel:**

Go to: **Vercel Dashboard → integratedlv project → Settings → Environment Variables**

### 1. Mapbox API Key

**Variable Name:**
```
NEXT_PUBLIC_MAPBOX_API_KEY
```

**Variable Value:**
```
pk.eyJ1IjoiYnJlYWt0aHJ1d2ViIiwiYSI6ImNsbnEyaTd0aTByNzgybHFqMnphNmpxNzcifQ.-PiLdobqik7pjHH_cfbDcg
```

**Environments:** Check all three boxes
- ✅ Production
- ✅ Preview
- ✅ Development

### 2. Mailgun Configuration (Email Notifications)

**Variable Name:**
```
MAILGUN_API_KEY
```

**Variable Value:**
```
[Use the Mailgun API key provided separately - do not commit to git]
```

**Variable Name:**
```
MAILGUN_DOMAIN
```

**Variable Value:**
```
portal.integratedlowvoltage.com
```

**Variable Name:**
```
MAILGUN_FROM_EMAIL
```

**Variable Value:**
```
support@portal.integratedlowvoltage.com
```

**Variable Name:**
```
NEXT_PUBLIC_APP_URL
```

**Variable Value:**
```
https://integratedlv.vercel.app
```

**Environments:** Check all three boxes for each
- ✅ Production
- ✅ Preview
- ✅ Development

**Then:** Click "Save" and "Redeploy" your latest deployment

## Testing Emails

After adding the variables, test by:
1. Adding a comment to a ticket
2. Check server logs in Vercel for "Email sent:" message
3. Check your email inbox (including spam folder)
4. If no email, check Mailgun dashboard for delivery logs

---

## 📍 **Where Maps Appear:**

### 1. **Location Detail Page** (`/locations/[id]`)
- Shows map when location has latitude & longitude
- Displays orange pin at location
- 300px height map with navigation controls

### 2. **Ticket Detail Page** (`/tickets/[id]`)
- Small map in right sidebar (200px)
- Shows where the ticket's location is
- Quick visual context

---

## ⚠️ **Maps Won't Show Until:**

1. ✅ Mapbox API key added to Vercel ← **Do this**
2. ⚠️ Locations need lat/long coordinates

### How to Add Coordinates:

**Option A: Manually (Quick Test)**
Run in Supabase SQL Editor:
```sql
-- Add coordinates to your test location (Las Vegas)
UPDATE locations 
SET 
  latitude = 36.1699,
  longitude = -115.1398
WHERE name = 'Test Location - Las Vegas Store #1';
```

**Option B: Via Location Form (Future)**
- Add geocoding when user enters address
- Auto-populate lat/long on save

---

## 🎴 **Tickets Layout:**

Currently shows as **list view** - working on converting to **card grid** for better browsing.

**Card Grid Benefits:**
- See 6-9 tickets at once (instead of 4-5)
- More visual (photos visible)
- Better for scanning

---

## ✅ **After Adding Mapbox Key:**

1. Save the environment variable in Vercel
2. Redeploy your app
3. Add coordinates to your location (SQL above)
4. Visit location detail page → Map should appear!

**The map component is built and ready - just needs the API key + coordinates!** 🗺️





