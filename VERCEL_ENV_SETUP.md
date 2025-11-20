# Vercel Environment Variables Setup

## ✅ **Add This to Vercel:**

Go to: **Vercel Dashboard → integratedlv project → Settings → Environment Variables**

### Add New Variable:

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

**Then:** Click "Save" and "Redeploy" your latest deployment

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


