-- Migration: Fix Common Supabase Configuration Issues
-- This script repairs common configuration problems that can occur
-- Run this in Supabase Dashboard → SQL Editor if you've accidentally changed settings

-- =====================================================
-- 1. FIX RLS STATUS (Critical Tables)
-- =====================================================

-- These tables MUST have RLS DISABLED (prevents infinite recursion)
-- See: ACCOUNT_TYPES_AND_RLS_DEEP_DIVE.md for explanation

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments DISABLE ROW LEVEL SECURITY;

-- These tables MUST have RLS ENABLED (security enforcement)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_log_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_timing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ENSURE STORAGE BUCKETS EXIST
-- =====================================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('ticket-attachments', 'ticket-attachments', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]),
  ('hardware-photos', 'hardware-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- 3. ENSURE STORAGE BUCKET RLS POLICIES EXIST
-- =====================================================

-- user-avatars bucket policies (public bucket)
DO $$
BEGIN
  -- Allow public read access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view avatars'
  ) THEN
    CREATE POLICY "Public can view avatars" ON storage.objects
      FOR SELECT USING (bucket_id = 'user-avatars');
  END IF;

  -- Allow authenticated users to upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload avatars'
  ) THEN
    CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'user-avatars' 
        AND auth.role() = 'authenticated'
      );
  END IF;

  -- Users can update their own avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own avatars'
  ) THEN
    CREATE POLICY "Users can update own avatars" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'user-avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- Users can delete their own avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own avatars'
  ) THEN
    CREATE POLICY "Users can delete own avatars" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'user-avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- ticket-attachments bucket policies (private bucket, secured by table RLS)
DO $$
BEGIN
  -- Platform admins and org members can view attachments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Platform admins and org members can view ticket attachments'
  ) THEN
    CREATE POLICY "Platform admins and org members can view ticket attachments" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'ticket-attachments' 
        AND (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_platform_admin = true
          ) OR EXISTS (
            SELECT 1 FROM ticket_attachments ta
            JOIN care_log_tickets t ON t.id = ta.ticket_id
            JOIN org_memberships om ON om.org_id = t.org_id
            WHERE om.user_id = auth.uid() 
            AND ta.file_url LIKE '%' || storage.objects.name
          )
        )
      );
  END IF;

  -- Authenticated users can upload ticket attachments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload ticket attachments'
  ) THEN
    CREATE POLICY "Authenticated users can upload ticket attachments" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'ticket-attachments' 
        AND auth.role() = 'authenticated'
      );
  END IF;

  -- Users can update their own ticket attachments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own ticket attachments'
  ) THEN
    CREATE POLICY "Users can update own ticket attachments" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'ticket-attachments' 
        AND EXISTS (
          SELECT 1 FROM ticket_attachments ta
          WHERE ta.file_url LIKE '%' || storage.objects.name
          AND ta.uploaded_by = auth.uid()
        )
      );
  END IF;

  -- Users can delete their own ticket attachments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own ticket attachments'
  ) THEN
    CREATE POLICY "Users can delete own ticket attachments" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'ticket-attachments' 
        AND EXISTS (
          SELECT 1 FROM ticket_attachments ta
          WHERE ta.file_url LIKE '%' || storage.objects.name
          AND ta.uploaded_by = auth.uid()
        )
      );
  END IF;
END $$;

-- hardware-photos bucket policies (private bucket)
DO $$
BEGIN
  -- Platform admins and org members can view hardware photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Platform admins and org members can view hardware photos'
  ) THEN
    CREATE POLICY "Platform admins and org members can view hardware photos" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'hardware-photos' 
        AND (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_platform_admin = true
          ) OR EXISTS (
            SELECT 1 FROM hardware h
            JOIN org_memberships om ON om.org_id = h.org_id
            WHERE om.user_id = auth.uid() 
            AND (
              h.main_image_url LIKE '%' || storage.objects.name
              OR h.gallery_images::text LIKE '%' || storage.objects.name
            )
          )
        )
      );
  END IF;

  -- Org admins can upload hardware photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Org admins can upload hardware photos'
  ) THEN
    CREATE POLICY "Org admins can upload hardware photos" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'hardware-photos' 
        AND (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_platform_admin = true
          ) OR EXISTS (
            SELECT 1 FROM org_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('org_admin', 'platform_admin')
          )
        )
      );
  END IF;

  -- Org admins can update hardware photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Org admins can update hardware photos'
  ) THEN
    CREATE POLICY "Org admins can update hardware photos" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'hardware-photos' 
        AND (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_platform_admin = true
          ) OR EXISTS (
            SELECT 1 FROM org_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('org_admin', 'platform_admin')
          )
        )
      );
  END IF;

  -- Org admins can delete hardware photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Org admins can delete hardware photos'
  ) THEN
    CREATE POLICY "Org admins can delete hardware photos" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'hardware-photos' 
        AND (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_platform_admin = true
          ) OR EXISTS (
            SELECT 1 FROM org_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('org_admin', 'platform_admin')
          )
        )
      );
  END IF;
END $$;

-- =====================================================
-- 4. ENSURE closed_summary COLUMN EXISTS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'care_log_tickets' 
    AND column_name = 'closed_summary'
  ) THEN
    ALTER TABLE care_log_tickets ADD COLUMN closed_summary TEXT;
    
    -- Create index for quick retrieval
    CREATE INDEX IF NOT EXISTS idx_care_log_tickets_closed_summary 
    ON care_log_tickets(closed_summary) 
    WHERE closed_summary IS NOT NULL;
  END IF;
END $$;

-- =====================================================
-- 5. VERIFY CRITICAL FUNCTIONS EXIST
-- =====================================================

-- Ensure handle_new_user function exists (creates profile on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. VERIFY INDEXES EXIST (Performance)
-- =====================================================

-- Critical indexes for performance
CREATE INDEX IF NOT EXISTS idx_care_log_tickets_org_id ON care_log_tickets(org_id);
CREATE INDEX IF NOT EXISTS idx_care_log_tickets_status ON care_log_tickets(status);
CREATE INDEX IF NOT EXISTS idx_care_log_tickets_submitted_by ON care_log_tickets(submitted_by);
CREATE INDEX IF NOT EXISTS idx_care_log_tickets_assigned_to ON care_log_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket_id ON ticket_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_user_id ON ticket_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_id ON org_memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_id ON org_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_org_id ON locations(org_id);
CREATE INDEX IF NOT EXISTS idx_hardware_org_id ON hardware(org_id);
CREATE INDEX IF NOT EXISTS idx_hardware_location_id ON hardware(location_id);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Configuration repair complete!';
  RAISE NOTICE '   - RLS status fixed on critical tables';
  RAISE NOTICE '   - Storage buckets verified/created';
  RAISE NOTICE '   - Storage bucket policies verified/created';
  RAISE NOTICE '   - closed_summary column verified';
  RAISE NOTICE '   - Critical functions verified';
  RAISE NOTICE '   - Performance indexes verified';
END $$;

