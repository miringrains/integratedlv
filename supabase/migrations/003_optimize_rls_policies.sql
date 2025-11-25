-- Migration: Optimize RLS Policies for Performance
-- Replaces auth.uid() with (select auth.uid()) to prevent re-evaluation for each row
-- This is a performance optimization - behavior is IDENTICAL, only performance improves
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- =====================================================
-- ORGANIZATIONS POLICIES
-- =====================================================

-- Platform admins can view all organizations
DROP POLICY IF EXISTS "Platform admins can view all organizations" ON organizations;
CREATE POLICY "Platform admins can view all organizations" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid()) AND profiles.is_platform_admin = true
    )
  );

-- Users can view their organizations
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = (select auth.uid())
    )
  );

-- Platform admins and users can insert organizations
DROP POLICY IF EXISTS "Platform admins and users can insert organizations" ON organizations;
CREATE POLICY "Platform admins and users can insert organizations" ON organizations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid()) AND profiles.is_platform_admin = true
    ) OR (select auth.uid()) IS NOT NULL
  );

-- Org admins can update their organization
DROP POLICY IF EXISTS "Org admins can update their organization" ON organizations;
CREATE POLICY "Org admins can update their organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = (select auth.uid()) 
        AND role = ANY (ARRAY['platform_admin'::text, 'org_admin'::text])
    )
  );

-- =====================================================
-- LOCATIONS POLICIES
-- =====================================================

-- Users can view locations in their orgs or platform admins see all
DROP POLICY IF EXISTS "Users can view locations in their orgs or platform admins see a" ON locations;
CREATE POLICY "Users can view locations in their orgs or platform admins see all" ON locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid()) AND profiles.is_platform_admin = true
    ) OR (
      org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid())
      )
    )
  );

-- Platform admins and org admins can insert locations
DROP POLICY IF EXISTS "Platform admins and org admins can insert locations" ON locations;
CREATE POLICY "Platform admins and org admins can insert locations" ON locations
  FOR INSERT WITH CHECK (
    (
      (SELECT profiles.is_platform_admin FROM profiles WHERE profiles.id = (select auth.uid())) = true
    ) OR (
      org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid()) 
          AND role = ANY (ARRAY['org_admin'::text, 'platform_admin'::text])
      )
    )
  );

-- Org admins and platform admins can manage locations
DROP POLICY IF EXISTS "Org admins and platform admins can manage locations" ON locations;
CREATE POLICY "Org admins and platform admins can manage locations" ON locations
  FOR ALL USING (
    (
      (SELECT profiles.is_platform_admin FROM profiles WHERE profiles.id = (select auth.uid())) = true
    ) OR (
      org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid()) 
          AND role = ANY (ARRAY['org_admin'::text, 'platform_admin'::text])
      )
    )
  )
  WITH CHECK (
    (
      (SELECT profiles.is_platform_admin FROM profiles WHERE profiles.id = (select auth.uid())) = true
    ) OR (
      org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid()) 
          AND role = ANY (ARRAY['org_admin'::text, 'platform_admin'::text])
      )
    )
  );

-- =====================================================
-- LOCATION_ASSIGNMENTS POLICIES
-- =====================================================

-- Users can view location assignments in their orgs
DROP POLICY IF EXISTS "Users can view location assignments in their orgs" ON location_assignments;
CREATE POLICY "Users can view location assignments in their orgs" ON location_assignments
  FOR SELECT USING (
    location_id IN (
      SELECT id FROM locations 
      WHERE org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid())
      )
    )
  );

-- Org admins can manage location assignments
DROP POLICY IF EXISTS "Org admins can manage location assignments" ON location_assignments;
CREATE POLICY "Org admins can manage location assignments" ON location_assignments
  FOR ALL USING (
    location_id IN (
      SELECT id FROM locations 
      WHERE org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid()) 
          AND role = ANY (ARRAY['platform_admin'::text, 'org_admin'::text])
      )
    )
  );

-- =====================================================
-- HARDWARE POLICIES
-- =====================================================

-- Users can view hardware in their orgs or platform admins see all
DROP POLICY IF EXISTS "Users can view hardware in their orgs or platform admins see al" ON hardware;
CREATE POLICY "Users can view hardware in their orgs or platform admins see all" ON hardware
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid()) AND profiles.is_platform_admin = true
    ) OR (
      org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid())
      )
    )
  );

-- Org admins and platform admins can manage hardware
DROP POLICY IF EXISTS "Org admins and platform admins can manage hardware" ON hardware;
CREATE POLICY "Org admins and platform admins can manage hardware" ON hardware
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid()) AND profiles.is_platform_admin = true
    ) OR (
      org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid()) 
          AND role = ANY (ARRAY['org_admin'::text, 'platform_admin'::text])
      )
    )
  );

-- =====================================================
-- SOPS POLICIES
-- =====================================================

-- Users can view SOPs in their orgs
DROP POLICY IF EXISTS "Users can view SOPs in their orgs" ON sops;
CREATE POLICY "Users can view SOPs in their orgs" ON sops
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = (select auth.uid())
    )
  );

-- Org admins can manage SOPs
DROP POLICY IF EXISTS "Org admins can manage SOPs" ON sops;
CREATE POLICY "Org admins can manage SOPs" ON sops
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = (select auth.uid()) 
        AND role = ANY (ARRAY['platform_admin'::text, 'org_admin'::text])
    )
  );

-- =====================================================
-- HARDWARE_SOPS POLICIES
-- =====================================================

-- Users can view hardware SOPs
DROP POLICY IF EXISTS "Users can view hardware SOPs" ON hardware_sops;
CREATE POLICY "Users can view hardware SOPs" ON hardware_sops
  FOR SELECT USING (
    hardware_id IN (
      SELECT id FROM hardware 
      WHERE org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid())
      )
    )
  );

-- Org admins can manage hardware SOPs
DROP POLICY IF EXISTS "Org admins can manage hardware SOPs" ON hardware_sops;
CREATE POLICY "Org admins can manage hardware SOPs" ON hardware_sops
  FOR ALL USING (
    hardware_id IN (
      SELECT id FROM hardware 
      WHERE org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid()) 
          AND role = ANY (ARRAY['platform_admin'::text, 'org_admin'::text])
      )
    )
  );

-- =====================================================
-- INVITATIONS POLICIES
-- =====================================================

-- Platform admins can manage all invitations
DROP POLICY IF EXISTS "Platform admins can manage all invitations" ON invitations;
CREATE POLICY "Platform admins can manage all invitations" ON invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid()) AND profiles.is_platform_admin = true
    )
  );

-- Org admins can manage invitations for their org
DROP POLICY IF EXISTS "Org admins can manage invitations for their org" ON invitations;
CREATE POLICY "Org admins can manage invitations for their org" ON invitations
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = (select auth.uid()) 
        AND role = 'org_admin'::text
    )
  );

-- =====================================================
-- CARE_LOG_TICKETS POLICIES
-- =====================================================

-- Users can view tickets in their orgs or platform admins see all
DROP POLICY IF EXISTS "Users can view tickets in their orgs or platform admins see all" ON care_log_tickets;
CREATE POLICY "Users can view tickets in their orgs or platform admins see all" ON care_log_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid()) AND profiles.is_platform_admin = true
    ) OR (
      org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid())
      )
    )
  );

-- Users can create tickets for their org
DROP POLICY IF EXISTS "Users can create tickets for their org" ON care_log_tickets;
CREATE POLICY "Users can create tickets for their org" ON care_log_tickets
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = (select auth.uid())
    )
  );

-- Platform admins and org admins can update tickets
DROP POLICY IF EXISTS "Platform admins and org admins can update tickets" ON care_log_tickets;
CREATE POLICY "Platform admins and org admins can update tickets" ON care_log_tickets
  FOR UPDATE USING (
    (
      (SELECT profiles.is_platform_admin FROM profiles WHERE profiles.id = (select auth.uid())) = true
    ) OR (
      org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid()) 
          AND role = ANY (ARRAY['org_admin'::text, 'platform_admin'::text])
      )
    )
  )
  WITH CHECK (
    (
      (SELECT profiles.is_platform_admin FROM profiles WHERE profiles.id = (select auth.uid())) = true
    ) OR (
      org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid()) 
          AND role = ANY (ARRAY['org_admin'::text, 'platform_admin'::text])
      )
    )
  );

-- =====================================================
-- TICKET_EVENTS POLICIES
-- =====================================================

-- Users can view ticket events for accessible tickets
DROP POLICY IF EXISTS "Users can view ticket events for accessible tickets" ON ticket_events;
CREATE POLICY "Users can view ticket events for accessible tickets" ON ticket_events
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM care_log_tickets 
      WHERE org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid())
      )
    )
  );

-- Users can create ticket events
DROP POLICY IF EXISTS "Users can create ticket events" ON ticket_events;
CREATE POLICY "Users can create ticket events" ON ticket_events
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM care_log_tickets 
      WHERE org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid())
      )
    )
  );

-- =====================================================
-- TICKET_ATTACHMENTS POLICIES
-- =====================================================

-- Platform admins and org members can view attachments
DROP POLICY IF EXISTS "Platform admins and org members can view attachments" ON ticket_attachments;
CREATE POLICY "Platform admins and org members can view attachments" ON ticket_attachments
  FOR SELECT USING (
    (
      (SELECT profiles.is_platform_admin FROM profiles WHERE profiles.id = (select auth.uid())) = true
    ) OR (
      ticket_id IN (
        SELECT id FROM care_log_tickets 
        WHERE org_id IN (
          SELECT org_id FROM org_memberships 
          WHERE user_id = (select auth.uid())
        )
      )
    )
  );

-- =====================================================
-- TICKET_TIMING_ANALYTICS POLICIES
-- =====================================================

-- Users can view timing analytics for accessible tickets
DROP POLICY IF EXISTS "Users can view timing analytics for accessible tickets" ON ticket_timing_analytics;
CREATE POLICY "Users can view timing analytics for accessible tickets" ON ticket_timing_analytics
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM care_log_tickets 
      WHERE org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = (select auth.uid())
      )
    )
  );

