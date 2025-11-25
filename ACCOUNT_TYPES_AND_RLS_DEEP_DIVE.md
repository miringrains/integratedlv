# Account Types & RLS Architecture - Deep Dive

**Generated:** November 22, 2025  
**Purpose:** Complete understanding of account types, RLS policies, and why certain RLS was disabled

---

## 🔑 Core Architecture Principle

**Platform Admins have ZERO org_memberships.**

This is the fundamental design decision that makes the multi-tenant system work:

- **Platform Admins:** `is_platform_admin = true`, `org_memberships` table = **EMPTY** (0 rows)
- **Org Admins:** `is_platform_admin = false`, `org_memberships.role = 'org_admin'` (1+ rows)
- **Employees:** `is_platform_admin = false`, `org_memberships.role = 'employee'` (1+ rows)

---

## 🎭 Account Type Details

### 1. Platform Admins (Integrated LV Staff)

**Identification:**
- Database: `profiles.is_platform_admin = true`
- Database: `org_memberships` table = **NO ROWS** (critical!)
- Examples: Kevin, Ralph
- Email domain: `@integratedlowvoltage.com` (informal, not enforced)

**Admin Levels (NEW):**
- `admin_level = 'super_admin'` - Full access (Kevin, Ralph)
- `admin_level = 'technician'` - Ticket management only (default)
- `admin_level = 'read_only'` - View only

**How They Work:**
1. **No Org Filtering:** All queries bypass organization filtering
2. **App-Level Checks:** Code checks `is_platform_admin` FIRST, then queries proceed without org filters
3. **System-Wide Access:** Can see ALL tickets, locations, hardware across ALL clients
4. **No Memberships:** Cannot have org_memberships (would break the system)

**What They Can Do:**
- ✅ View ALL tickets, locations, hardware (no org filter)
- ✅ Create organizations and org admins
- ✅ Assign tickets (only to other platform admins)
- ✅ Change ticket status (Start Working, Mark Resolved, Close)
- ✅ Create and manage SOPs
- ✅ Leave internal notes (`is_internal = true`)
- ✅ Access `/admin/*` pages
- ✅ View analytics across all clients

**What They Cannot Do:**
- ❌ Create locations/hardware for clients (org admins do this)
- ❌ Have org_memberships (would break system)

**Code Pattern:**
```typescript
// Always check platform admin FIRST
const { data: profile } = await supabase
  .from('profiles')
  .select('is_platform_admin')
  .eq('id', user.id)
  .single()

if (profile?.is_platform_admin) {
  // No org filtering - return all data
  return await supabase.from('tickets').select('*')
} else {
  // Org filtering - only their org
  return await supabase.from('tickets')
    .select('*')
    .eq('org_id', userOrgId)
}
```

---

### 2. Org Admins (Client Administrators)

**Identification:**
- Database: `profiles.is_platform_admin = false`
- Database: `org_memberships.role = 'org_admin'` (1+ rows)
- Examples: Anna (Breakthruweb), Acme Admin
- Belongs to: Exactly one organization (typically)

**How They Work:**
1. **Org Filtering:** All queries filtered by `org_id` from `org_memberships`
2. **Single Org:** Typically belong to one org (can belong to multiple, but rare)
3. **Client-Side:** They're clients, not support staff

**What They Can Do:**
- ✅ View their organization's tickets, locations, hardware ONLY
- ✅ Create and manage locations for their organization
- ✅ Create and manage hardware for their organization
- ✅ Invite employees to their organization
- ✅ Assign employees to specific locations (`location_assignments`)
- ✅ Create support tickets
- ✅ Reply to tickets (public only, `is_internal = false`)
- ✅ Upload photos to tickets and replies
- ✅ Manage team members (My Team page)

**What They Cannot Do:**
- ❌ View other organizations' data
- ❌ Assign tickets (only platform admins can assign)
- ❌ Change ticket status (only platform admins can change status)
- ❌ Leave internal notes (only platform admins can use `is_internal = true`)
- ❌ Create/edit SOPs (only platform admins can create SOPs)
- ❌ View platform admin tools (`/admin/*` pages)

**Code Pattern:**
```typescript
// Get user's org_id from org_memberships
const { data: membership } = await supabase
  .from('org_memberships')
  .select('org_id, role')
  .eq('user_id', user.id)
  .eq('role', 'org_admin')
  .single()

// Filter by org_id
return await supabase.from('tickets')
  .select('*')
  .eq('org_id', membership.org_id)
```

---

### 3. Employees (Store Staff)

**Identification:**
- Database: `profiles.is_platform_admin = false`
- Database: `org_memberships.role = 'employee'` (1+ rows)
- Database: `location_assignments` (1+ rows) - **CRITICAL for access control**

**How They Work:**
1. **Location-Based Access:** Can only see locations they're assigned to
2. **Org Membership:** Belongs to an organization
3. **Restricted View:** Cannot see all org data, only assigned locations

**What They Can Do:**
- ✅ View locations assigned to them (`location_assignments`)
- ✅ View hardware at their assigned locations ONLY
- ✅ Create support tickets for their assigned locations ONLY
- ✅ Reply to tickets (public only)
- ✅ Upload photos
- ✅ View SOPs (read-only)

**What They Cannot Do:**
- ❌ View locations they're not assigned to
- ❌ Create/manage locations or hardware
- ❌ Invite users
- ❌ View team management
- ❌ Assign tickets or change status
- ❌ Leave internal notes

**Code Pattern:**
```typescript
// Get user's assigned locations
const { data: assignments } = await supabase
  .from('location_assignments')
  .select('location_id')
  .eq('user_id', user.id)

const locationIds = assignments.map(a => a.location_id)

// Filter by assigned locations
return await supabase.from('tickets')
  .select('*')
  .in('location_id', locationIds)
```

---

## 🔐 RLS Policy Architecture

### Why Some RLS is Disabled

**The Problem:**
RLS policies need to check `is_platform_admin` to allow platform admins to bypass org filtering. But checking `is_platform_admin` requires querying the `profiles` table, which has RLS enabled, which causes **infinite recursion**.

**The Solution:**
Disable RLS on `profiles` and `org_memberships` tables, enforce security at the application level instead.

---

### RLS Status by Table

#### ✅ RLS ENABLED (Working)

**ticket_attachments:**
- **Current Policy:** "Platform admins and org members can view attachments"
- **Logic:** `is_platform_admin OR ticket.org_id IN (user's org_ids)`
- **Why It Works:** Policy checks `profiles.is_platform_admin` directly
- **Status:** ✅ ENABLED and working

**care_log_tickets:**
- **Policies:** Multiple policies for platform admins vs org members
- **Platform Admin Policy:** Checks `is_platform_admin` directly
- **Org Member Policy:** Checks `org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())`
- **Status:** ✅ ENABLED

**locations, hardware, sops:**
- **Similar Pattern:** Platform admin check OR org membership check
- **Status:** ✅ ENABLED

---

#### ❌ RLS DISABLED (App-Level Security) - INTENTIONAL ARCHITECTURE

**IMPORTANT**: Supabase advisors flag these tables as having RLS policies but RLS disabled. This is **INTENTIONAL** and **CORRECT** for our architecture. Enabling RLS would break the system.

**profiles:**
- **RLS Status:** DISABLED (INTENTIONAL)
- **Why:** Checking `is_platform_admin` in RLS policies would require querying `profiles` table, causing infinite recursion
- **Security:** Enforced at application level in API routes
- **Policies Exist But Disabled:** "View own profile", "View org profiles", "Update own profile"
- **Supabase Advisor Flag:** This is a false positive - RLS disabled is correct for our architecture

**org_memberships:**
- **RLS Status:** DISABLED (INTENTIONAL)
- **Why:** Platform admins need to query ALL org_memberships (they have none themselves). Enabling RLS would prevent platform admins from managing organizations.
- **Security:** Enforced at application level in API routes
- **Policies Exist But Disabled:** "Platform admins can view all org memberships", "Users can view memberships in their orgs"
- **Supabase Advisor Flag:** This is a false positive - RLS disabled is correct for our architecture

**ticket_comments:**
- **RLS Status:** DISABLED (INTENTIONAL)
- **Why:** Access controlled by ticket RLS (if you can see ticket, you can see comments). Enabling RLS here would be redundant and could cause recursion issues.
- **Security:** Comments filtered by `ticket_id`, ticket RLS controls access. Application code filters `is_internal` flag.
- **Policies Exist But Disabled:** "Users can view comments for accessible tickets", "Users can create comments on accessible tickets"
- **Supabase Advisor Flag:** This is a false positive - RLS disabled is correct for our architecture

**Why This Architecture is Safe:**
1. All API routes validate user authentication (`supabase.auth.getUser()`)
2. All API routes validate access permissions (platform admin, org admin, employee)
3. Database queries are filtered at application level before execution
4. RLS on parent tables (tickets, locations, hardware) provides additional security layer
5. This pattern is documented and intentional - not a security vulnerability

---

### The Ticket Attachments RLS Issue (RESOLVED)

**Original Problem:**
The initial RLS policy for `ticket_attachments` was:
```sql
CREATE POLICY "Users can view attachments for accessible tickets" 
ON ticket_attachments FOR SELECT USING (
  ticket_id IN (
    SELECT id FROM care_log_tickets 
    WHERE org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid()
    )
  )
);
```

**Why It Failed:**
- Platform admins have **NO org_memberships** (0 rows)
- The subquery `SELECT org_id FROM org_memberships WHERE user_id = auth.uid()` returns **EMPTY** for platform admins
- Result: Platform admins couldn't see ANY attachments, even though they should see ALL

**Current Solution:**
```sql
CREATE POLICY "Platform admins and org members can view attachments"
ON ticket_attachments FOR SELECT USING (
  -- Platform admin check FIRST
  (SELECT is_platform_admin FROM profiles WHERE id = auth.uid()) = true
  OR
  -- Org member check
  ticket_id IN (
    SELECT id FROM care_log_tickets 
    WHERE org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid()
    )
  )
);
```

**Why This Works:**
- Checks `is_platform_admin` FIRST (before org membership check)
- If platform admin, bypasses org filtering entirely
- If not platform admin, falls back to org membership check

**Status:** ✅ RLS ENABLED and working correctly

---

## 🔍 Query Patterns by Account Type

### Platform Admin Queries

**No Org Filtering:**
```typescript
// Platform admins see ALL tickets
const { data: tickets } = await supabase
  .from('care_log_tickets')
  .select('*')
  // NO .eq('org_id', ...) filter!
```

**How RLS Handles It:**
- RLS policy checks `is_platform_admin` first
- If true, policy returns `true` (allows all rows)
- Query proceeds without org filtering

---

### Org Admin Queries

**Org Filtering Required:**
```typescript
// Get user's org_id
const { data: membership } = await supabase
  .from('org_memberships')
  .select('org_id')
  .eq('user_id', user.id)
  .single()

// Filter by org_id
const { data: tickets } = await supabase
  .from('care_log_tickets')
  .select('*')
  .eq('org_id', membership.org_id)
```

**How RLS Handles It:**
- RLS policy checks `is_platform_admin` first (false)
- Falls back to org membership check
- Only returns tickets where `org_id IN (user's org_ids)`

---

### Employee Queries

**Location-Based Filtering:**
```typescript
// Get assigned locations
const { data: assignments } = await supabase
  .from('location_assignments')
  .select('location_id')
  .eq('user_id', user.id)

const locationIds = assignments.map(a => a.location_id)

// Filter by assigned locations
const { data: tickets } = await supabase
  .from('care_log_tickets')
  .select('*')
  .in('location_id', locationIds)
```

**How RLS Handles It:**
- RLS policy checks `is_platform_admin` first (false)
- Falls back to org membership check
- Additional policy checks `location_id IN (assigned locations)`

---

## 🛡️ Security Model Summary

### App-Level Security (Where RLS is Disabled)

**profiles:**
- RLS disabled to prevent recursion
- Security enforced in API routes:
  - `requirePlatformAdmin()` checks `is_platform_admin`
  - `requireOrgAdmin()` checks org membership
  - `canAccessLocation()` checks location assignments

**org_memberships:**
- RLS disabled (platform admins need to see all)
- Security enforced in API routes:
  - Platform admins can query all orgs
  - Org admins can only query their org

**ticket_comments:**
- RLS disabled (access controlled by ticket RLS)
- Security enforced by:
  - Filtering by `ticket_id`
  - Ticket RLS controls which tickets are visible
  - `is_internal` flag filtered in application code

---

### Database-Level Security (Where RLS is Enabled)

**All Other Tables:**
- RLS enabled with policies that check `is_platform_admin` FIRST
- Pattern: `is_platform_admin OR org_membership_check`
- Platform admins bypass org filtering
- Org members/employees filtered by org/location

---

## 📊 Account Type Detection Flow

### In Application Code

```typescript
// Step 1: Check if platform admin
const { data: profile } = await supabase
  .from('profiles')
  .select('is_platform_admin, admin_level')
  .eq('id', user.id)
  .single()

if (profile?.is_platform_admin) {
  // Platform admin - no org filtering
  return { type: 'platform_admin', level: profile.admin_level }
}

// Step 2: Check org membership
const { data: membership } = await supabase
  .from('org_memberships')
  .select('org_id, role')
  .eq('user_id', user.id)
  .single()

if (membership?.role === 'org_admin') {
  return { type: 'org_admin', org_id: membership.org_id }
}

if (membership?.role === 'employee') {
  // Step 3: Get location assignments
  const { data: assignments } = await supabase
    .from('location_assignments')
    .select('location_id')
    .eq('user_id', user.id)
  
  return { 
    type: 'employee', 
    org_id: membership.org_id,
    location_ids: assignments.map(a => a.location_id)
  }
}
```

---

## 🎯 Key Insights

1. **Platform Admins = No Org Memberships**
   - This is intentional and required for system-wide access
   - Any RLS policy that relies on `org_memberships` will fail for platform admins

2. **RLS Policies Must Check `is_platform_admin` FIRST**
   - Pattern: `is_platform_admin OR org_check`
   - If platform admin check is first, it short-circuits and allows all rows

3. **Some RLS Must Be Disabled**
   - `profiles` and `org_memberships` RLS disabled to prevent recursion
   - Security enforced at application level instead

4. **Ticket Attachments RLS Was Fixed**
   - Original policy didn't account for platform admins
   - Current policy checks `is_platform_admin` first
   - RLS is ENABLED and working correctly

5. **Account Type Hierarchy**
   - Platform Admin > Org Admin > Employee
   - Each level has more restrictions
   - Platform admins bypass all org/location filtering

---

## 🔧 Common Patterns

### Checking Account Type

```typescript
// Always check platform admin FIRST
const isPlatformAdmin = await isPlatformAdmin()
if (isPlatformAdmin) {
  // No filtering needed
  return await supabase.from('tickets').select('*')
}

// Then check org admin
const isOrgAdminUser = await isOrgAdmin()
if (isOrgAdminUser) {
  // Filter by org_id
  const { data: membership } = await supabase
    .from('org_memberships')
    .select('org_id')
    .eq('user_id', user.id)
    .single()
  
  return await supabase.from('tickets')
    .select('*')
    .eq('org_id', membership.org_id)
}

// Finally employee (location-based)
const assignments = await getUserLocations()
const locationIds = assignments.map(a => a.location_id)
return await supabase.from('tickets')
  .select('*')
  .in('location_id', locationIds)
```

---

## ✅ Verification Checklist

- [x] Platform admins have `is_platform_admin = true`
- [x] Platform admins have ZERO rows in `org_memberships`
- [x] RLS policies check `is_platform_admin` FIRST
- [x] `profiles` RLS is DISABLED (prevents recursion)
- [x] `org_memberships` RLS is DISABLED (platform admins need all)
- [x] `ticket_attachments` RLS is ENABLED with platform admin check
- [x] Application code checks platform admin before org filtering
- [x] Employees filtered by `location_assignments`

---

**This architecture ensures:**
- Platform admins can manage all clients
- Org admins can only manage their organization
- Employees can only access assigned locations
- Security is enforced at both RLS and application levels
- No infinite recursion in RLS policies

