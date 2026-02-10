-- =====================================================
-- Migration 018: Fix Platform Admin RLS Policies
-- =====================================================
-- ROOT CAUSE: Platform admins have is_platform_admin=true on profiles
-- but NO rows in org_memberships. Many RLS policies only check
-- org_memberships, which returns empty for platform admins.
--
-- This migration adds platform admin bypass policies to ALL tables
-- that are missing them, using the optimized (select auth.uid()) pattern.
--
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================

-- Helper: Reusable check for platform admin status
-- Using (select ...) wrapper prevents re-evaluation per row
-- This is the Supabase-recommended performance pattern

-- =====================================================
-- 1. TICKET_EVENTS - Platform admins can't view or create events
-- This causes: empty ticket timelines, silent event logging failures
-- =====================================================

-- Fix SELECT: Platform admins can view all ticket events
DROP POLICY IF EXISTS "Platform admins can view all ticket events" ON ticket_events;
CREATE POLICY "Platform admins can view all ticket events"
  ON ticket_events FOR SELECT
  USING (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- Fix INSERT: Platform admins can create ticket events
DROP POLICY IF EXISTS "Platform admins can create ticket events" ON ticket_events;
CREATE POLICY "Platform admins can create ticket events"
  ON ticket_events FOR INSERT
  WITH CHECK (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- =====================================================
-- 2. SOPS - Platform admins can't view or manage SOPs
-- This causes: empty SOP Library page
-- =====================================================

-- Fix SELECT: Platform admins can view all SOPs
DROP POLICY IF EXISTS "Platform admins can view all SOPs" ON sops;
CREATE POLICY "Platform admins can view all SOPs"
  ON sops FOR SELECT
  USING (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- Fix ALL: Platform admins can manage all SOPs
DROP POLICY IF EXISTS "Platform admins can manage all SOPs" ON sops;
CREATE POLICY "Platform admins can manage all SOPs"
  ON sops FOR ALL
  USING (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  )
  WITH CHECK (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- =====================================================
-- 3. HARDWARE_SOPS - Platform admins can't see/manage links
-- =====================================================

-- Fix SELECT: Platform admins can view all hardware SOP links
DROP POLICY IF EXISTS "Platform admins can view all hardware SOP links" ON hardware_sops;
CREATE POLICY "Platform admins can view all hardware SOP links"
  ON hardware_sops FOR SELECT
  USING (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- Fix ALL: Platform admins can manage all hardware SOP links
DROP POLICY IF EXISTS "Platform admins can manage all hardware SOP links" ON hardware_sops;
CREATE POLICY "Platform admins can manage all hardware SOP links"
  ON hardware_sops FOR ALL
  USING (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  )
  WITH CHECK (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- =====================================================
-- 4. LOCATION_ASSIGNMENTS - Platform admins can't see/manage
-- This causes: invisible employee location assignments
-- =====================================================

-- Fix SELECT: Platform admins can view all location assignments
DROP POLICY IF EXISTS "Platform admins can view all location assignments" ON location_assignments;
CREATE POLICY "Platform admins can view all location assignments"
  ON location_assignments FOR SELECT
  USING (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- Fix ALL: Platform admins can manage all location assignments
DROP POLICY IF EXISTS "Platform admins can manage all location assignments" ON location_assignments;
CREATE POLICY "Platform admins can manage all location assignments"
  ON location_assignments FOR ALL
  USING (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  )
  WITH CHECK (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- =====================================================
-- 5. CARE_LOG_TICKETS - Platform admins can't INSERT or DELETE
-- INSERT: Ticket creation fails for platform admins
-- DELETE: No DELETE policy exists at all
-- =====================================================

-- Fix INSERT: Platform admins can create tickets
DROP POLICY IF EXISTS "Platform admins can create tickets" ON care_log_tickets;
CREATE POLICY "Platform admins can create tickets"
  ON care_log_tickets FOR INSERT
  WITH CHECK (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- Fix DELETE: Platform admins can delete tickets
DROP POLICY IF EXISTS "Platform admins can delete tickets" ON care_log_tickets;
CREATE POLICY "Platform admins can delete tickets"
  ON care_log_tickets FOR DELETE
  USING (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- =====================================================
-- 6. TICKET_ATTACHMENTS - Platform admins can't INSERT
-- This causes: attachment DB records fail after file upload succeeds
-- =====================================================

-- Fix INSERT: Platform admins can create attachment records
DROP POLICY IF EXISTS "Platform admins can create ticket attachments" ON ticket_attachments;
CREATE POLICY "Platform admins can create ticket attachments"
  ON ticket_attachments FOR INSERT
  WITH CHECK (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- Also add DELETE for platform admins (cleanup)
DROP POLICY IF EXISTS "Platform admins can delete ticket attachments" ON ticket_attachments;
CREATE POLICY "Platform admins can delete ticket attachments"
  ON ticket_attachments FOR DELETE
  USING (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- =====================================================
-- 7. ORGANIZATIONS - Platform admins can't UPDATE
-- Currently mitigated by service role in API, but should be fixed
-- =====================================================

-- Fix UPDATE: Platform admins can update any organization
DROP POLICY IF EXISTS "Platform admins can update all organizations" ON organizations;
CREATE POLICY "Platform admins can update all organizations"
  ON organizations FOR UPDATE
  USING (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  )
  WITH CHECK (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- Fix DELETE: Platform admins can delete organizations
DROP POLICY IF EXISTS "Platform admins can delete organizations" ON organizations;
CREATE POLICY "Platform admins can delete organizations"
  ON organizations FOR DELETE
  USING (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- =====================================================
-- 8. TICKET_TIMING_ANALYTICS - Verify platform admin access
-- The original FOR ALL USING (true) policy should still exist,
-- but add explicit platform admin policy for safety
-- =====================================================

DROP POLICY IF EXISTS "Platform admins can view all timing analytics" ON ticket_timing_analytics;
CREATE POLICY "Platform admins can view all timing analytics"
  ON ticket_timing_analytics FOR SELECT
  USING (
    (SELECT is_platform_admin FROM profiles WHERE id = (select auth.uid())) = true
  );

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 018 complete: Platform admin RLS policies fixed';
  RAISE NOTICE '   - ticket_events: SELECT + INSERT policies added';
  RAISE NOTICE '   - sops: SELECT + ALL policies added';
  RAISE NOTICE '   - hardware_sops: SELECT + ALL policies added';
  RAISE NOTICE '   - location_assignments: SELECT + ALL policies added';
  RAISE NOTICE '   - care_log_tickets: INSERT + DELETE policies added';
  RAISE NOTICE '   - ticket_attachments: INSERT + DELETE policies added';
  RAISE NOTICE '   - organizations: UPDATE + DELETE policies added';
  RAISE NOTICE '   - ticket_timing_analytics: SELECT policy added';
END $$;
