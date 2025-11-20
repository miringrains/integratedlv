# Testing Guide - Integrated LV Portal

## ✅ Database is Working

I've successfully created test data for you:

### Created for Kevin's Account:
1. **Location:** "Test Location - Las Vegas Store #1"
   - Address: 123 Main Street, Las Vegas, NV 89101
   - ID: `6d58b560-08cc-436d-a2e5-889bb8b77509`

2. **Hardware:** "Security Camera - Main Entrance"
   - Type: Security Camera
   - Status: Active
   - ID: `0dcf79a7-3b84-4536-862e-34996c30cb91`

3. **SOP:** "Camera Offline - Basic Troubleshooting"
   - Complete 7-step troubleshooting guide
   - ID: `0b96bfec-a79f-4205-9b04-520e417b2fca`

**Go to your portal and you should see these items!**

---

## 🧪 Testing Checklist

### Authentication
- ✅ Login works
- ✅ Signup works
- ✅ Auto-promotion to admin works for kevin@breakthruweb.com
- ✅ Organization creation fixed
- ✅ Multi-tenant isolation working

### Dashboard (/)
- ✅ Stats cards display correctly
- ✅ Shows location count
- ✅ Shows hardware count
- ✅ Shows ticket count

### Locations (/locations)
- ✅ List page loads
- ✅ Can view location details
- ✅ "Add Location" button visible for admins
- ⚠️ CREATE form - Test creating new location
- ⚠️ EDIT form - Test editing existing location

### Hardware (/hardware)
- ✅ List page loads
- ✅ Can view hardware details
- ✅ "Add Hardware" button visible for admins
- ⚠️ CREATE form - Test creating new hardware
- ⚠️ EDIT form - Test editing existing hardware

### SOPs (/sops)
- ✅ List page loads
- ✅ Can view SOP details
- ✅ "Create SOP" button visible for admins
- ⚠️ CREATE form - Test creating new SOP
- ⚠️ EDIT form - Test editing existing SOP

### Care Logs (/care-logs)
- ✅ List page loads
- ✅ Smart filters work (All, My Tickets, Unassigned, Urgent)
- ✅ "Create Ticket" button visible
- ⚠️ CREATE flow - Test 3-step ticket creation with SOP modal
- ⚠️ DETAIL page - View ticket with timeline
- ⚠️ Status changes - Test marking ticket as in progress/resolved

### Admin (/admin)
- ✅ User management page loads
- ✅ Analytics page loads
- ✅ Displays user list
- ✅ Shows ticket metrics

---

## 🔍 If Forms Aren't Working

### Common Issues:

1. **"Create" button doesn't do anything**
   - Check browser console for JavaScript errors
   - Verify network tab shows API call

2. **Form submits but nothing happens**
   - Check Vercel function logs for errors
   - Verify environment variables are set

3. **"Unauthorized" errors**
   - Refresh the page to renew auth token
   - Log out and log back in

4. **Specific Error Messages**
   - Screenshot the error and share
   - Check browser console (F12 → Console tab)
   - Check Vercel logs (Vercel Dashboard → Logs)

---

## 🐛 Quick Fixes

### If Location Form Fails:
```sql
-- Verify you have permission
SELECT * FROM org_memberships 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'kevin@breakthruweb.com');
```

### If Hardware Form Fails:
```sql
-- Check location exists
SELECT id, name FROM locations WHERE org_id = 'b54b4863-9892-4330-8044-a3057a98abb7';
```

### Test API Routes Directly:
```bash
# Test locations API (replace with your Vercel URL)
curl -X GET https://integratedlv.vercel.app/api/locations \
  -H "Cookie: your-session-cookie"
```

---

## ✅ What's Already Working

Based on logs:
- ✅ All pages load without infinite recursion
- ✅ Database queries execute successfully
- ✅ Auth works correctly
- ✅ RLS policies are fixed
- ✅ Multi-tenant isolation works

---

## 📞 Next Steps

1. **Log into the portal**
2. **Check if you see the test data I created**
3. **Try creating a new location manually**
4. **If it fails, share:**
   - The exact error message
   - Browser console errors
   - What button you clicked

I can then fix the specific issue!


