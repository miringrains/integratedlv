-- Fix infinite recursion in org_memberships RLS policies
-- The previous policies referenced org_memberships itself, causing infinite loops

-- Drop all problematic policies on org_memberships
DROP POLICY IF EXISTS "Org admins can manage their org memberships" ON org_memberships;
DROP POLICY IF EXISTS "Platform admins full access to org_memberships" ON org_memberships;
DROP POLICY IF EXISTS "Users can view their org memberships" ON org_memberships;

-- Create correct non-recursive policies

-- 1. Users can see their OWN membership rows (direct check, no subquery)
CREATE POLICY "Users can view own memberships"
ON org_memberships FOR SELECT
USING (user_id = auth.uid());

-- 2. Platform admins have full access (checks profiles, not org_memberships)
CREATE POLICY "Platform admins full access"
ON org_memberships FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_platform_admin = true
  )
);

-- 3. Org admins can manage memberships in orgs where they are admin
-- We need to use a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION is_org_admin_for(check_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_memberships
    WHERE user_id = auth.uid()
    AND org_id = check_org_id
    AND role = 'org_admin'
  );
$$;

-- 4. Org admins can view all members in their org
CREATE POLICY "Org admins can view org members"
ON org_memberships FOR SELECT
USING (is_org_admin_for(org_id));

-- 5. Org admins can insert/update/delete members in their org
CREATE POLICY "Org admins can manage org members"
ON org_memberships FOR ALL
USING (is_org_admin_for(org_id))
WITH CHECK (is_org_admin_for(org_id));
