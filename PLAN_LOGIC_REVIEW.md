# Plan Logic Review - Platform Improvements Round 1

## 🔍 Logical Analysis

### ❌ **ISSUE 1: Permission Levels for Client Organizations**

**Plan Says:**
- Add `permission_level` to `org_memberships`: `owner`, `admin`, `technician`
- **Owner:** Full control, can add/delete fields, manage tickets, submit knowledge base
- **Admin:** Same as owner except cannot delete fields, can manage tickets, submit knowledge base  
- **Technician:** View-only client details, can manage tickets, respond to clients, submit knowledge base

**Logical Problem:**
- **Orgs = Clients** (e.g., Breakthruweb, Acme Inc.)
- **Technicians = Service Providers** (Platform Admins who work on tickets)
- Having "Technician" as a client role is **conceptually wrong** - technicians are Integrated LV staff, not client employees

**Current Architecture:**
- Platform Admins have `admin_level`: `super_admin`, `technician`, `read_only` ✅ (This makes sense)
- Org memberships have `role`: `org_admin`, `employee` ✅ (This makes sense)

**What Actually Makes Sense:**
If clients need sub-roles within their organization, it should be:
- **Owner** (or keep `org_admin`) - Full control, can delete
- **Manager** (or `sub_admin`) - Can manage but can't delete critical things
- **Employee** (already exists) - Limited access

**Recommendation:** 
- ❌ Remove "Technician" from client permission levels
- ✅ Consider: `owner` (full control) vs `manager` (can't delete) vs `employee` (existing)
- ✅ OR: Keep current `org_admin` and `employee`, but add a `can_delete` flag to org_memberships

---

### ✅ **ISSUE 2: Email Reply Handler**

**Plan Says:**
- Create email webhook to handle replies
- Parse email replies and add as comments to existing tickets

**Logic Check:** ✅ **MAKES SENSE**
- Clients can reply via email
- Replies should become ticket comments, not new tickets
- Requires Mailgun webhook setup

---

### ✅ **ISSUE 3: Email Ticketing (Support Email)**

**Plan Says:**
- Create email webhook to accept tickets via support email
- Parse incoming emails, extract ticket info, create tickets automatically

**Logic Check:** ✅ **MAKES SENSE**
- Clients can email support@integratedlowvoltage.com
- System creates tickets automatically
- Requires Mailgun inbound routing

---

### ✅ **ISSUE 4: Auto-Close Tickets After 48 Hours**

**Plan Says:**
- Check for tickets with `status = 'resolved'` and `resolved_at < NOW() - INTERVAL '48 hours'`
- Update status to `closed`

**Logic Check:** ✅ **MAKES SENSE**
- Prevents tickets from staying "resolved" indefinitely
- Auto-closes after 48 hours of resolution
- Requires cron job or scheduled function

---

### ✅ **ISSUE 5: Device Issue Reporting/Flagging**

**Plan Says:**
- Add `issue_count` and `repeated_issues` flag to `hardware` table
- Track issues per device, flag devices with repeated issues

**Logic Check:** ✅ **MAKES SENSE**
- Helps identify problematic hardware
- Can flag devices that need replacement
- Currently "Report Issue" just creates tickets - this adds tracking

---

### ⚠️ **ISSUE 6: Timezone Handling**

**Plan Says:**
- Store timezone per user in `profiles` table
- Use timezone when displaying dates/times
- Respect location timezone for ticket timestamps

**Logic Check:** ⚠️ **PARTIALLY MAKES SENSE**
- ✅ Locations already have `timezone` field
- ✅ User timezone makes sense for display
- ⚠️ **Question:** Should ticket timestamps use:
  - User's timezone? (what they see)
  - Location's timezone? (where the issue occurred)
  - Server timezone? (UTC, stored in DB)
  
**Recommendation:**
- Store UTC in database (already done)
- Display in user's preferred timezone
- Optionally show location timezone for context

---

### ✅ **ISSUE 7: 2FA Investigation**

**Plan Says:**
- Research Supabase Auth 2FA support
- Document implementation options

**Logic Check:** ✅ **MAKES SENSE**
- Security enhancement
- Research task only (no implementation yet)

---

## 📋 Revised Permission Levels Recommendation

### Option A: Keep Current + Add Delete Permission
```sql
-- Add to org_memberships
can_delete BOOLEAN DEFAULT FALSE
```
- `org_admin` with `can_delete = true` → Full control
- `org_admin` with `can_delete = false` → Can manage but can't delete
- `employee` → Limited access (no change)

### Option B: Add Sub-Role
```sql
-- Change role enum
role TEXT CHECK (role IN ('platform_admin', 'org_admin', 'org_manager', 'employee'))
```
- `org_admin` → Owner (full control, can delete)
- `org_manager` → Manager (can manage, can't delete)
- `employee` → Employee (limited access)

### Option C: Keep Current (Simplest)
- Current `org_admin` and `employee` roles work fine
- If clients need sub-admins, they can just have multiple `org_admin` users
- No code changes needed

---

## 🎯 Final Recommendations

1. **Permission Levels:** ❌ Remove "Technician" from client roles - it's confusing. Use Option A, B, or C above.

2. **Email Features:** ✅ Keep as-is - both make logical sense

3. **Auto-Close:** ✅ Keep - makes sense

4. **Device Issue Reporting:** ✅ Keep - makes sense

5. **Timezone:** ✅ Keep but clarify: Display in user timezone, store in UTC

6. **2FA:** ✅ Keep as research task

---

## Summary

**Main Issue:** The "Technician" role for client organizations doesn't make logical sense. Technicians are service providers (Platform Admins), not client employees.

**Everything else in the plan is logically sound.**

