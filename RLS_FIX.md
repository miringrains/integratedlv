# RLS Infinite Recursion Fix

## Problem
The original RLS policy for `org_memberships` caused infinite recursion:

```sql
-- BAD: Causes infinite recursion
CREATE POLICY "Users can view memberships in their orgs" ON org_memberships
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );
```

This policy references `org_memberships` within its own condition, causing Postgres to infinitely recurse.

## Solution
Use `EXISTS` with aliased table to break the recursion:

```sql
-- GOOD: No recursion
CREATE POLICY "Users can view org memberships" ON org_memberships
  FOR SELECT USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM org_memberships om_check
      WHERE om_check.user_id = auth.uid()
      AND om_check.org_id = org_memberships.org_id
    )
  );
```

## Applied Fix
The fixed policies have been applied to the database. All pages should now load correctly.

## Test
After this fix:
- ✅ /locations loads without errors
- ✅ /hardware loads without errors
- ✅ /home dashboard loads correctly
- ✅ All RLS policies enforce security without recursion

