-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ORGANIZATIONS (Multi-tenant root)
-- =====================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USER PROFILES
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_platform_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ORGANIZATION MEMBERSHIPS (User Roles)
-- =====================================================
CREATE TABLE org_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('platform_admin', 'org_admin', 'employee')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- =====================================================
-- LOCATIONS (Store/Site locations)
-- =====================================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',
  manager_name TEXT,
  manager_phone TEXT,
  manager_email TEXT,
  store_hours TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LOCATION ASSIGNMENTS (Employee access restrictions)
-- =====================================================
CREATE TABLE location_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, location_id)
);

-- =====================================================
-- HARDWARE INVENTORY
-- =====================================================
CREATE TABLE hardware (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  hardware_type TEXT NOT NULL,
  manufacturer TEXT,
  model_number TEXT,
  serial_number TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'decommissioned', 'maintenance')),
  installation_date DATE,
  last_maintenance_date DATE,
  warranty_expiration DATE,
  vendor_url TEXT,
  main_image_url TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STANDARD OPERATING PROCEDURES (SOPs)
-- =====================================================
CREATE TABLE sops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  hardware_type TEXT,
  created_by UUID REFERENCES profiles(id),
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- HARDWARE_SOPS (Many-to-many relationship)
-- =====================================================
CREATE TABLE hardware_sops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hardware_id UUID REFERENCES hardware(id) ON DELETE CASCADE NOT NULL,
  sop_id UUID REFERENCES sops(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hardware_id, sop_id)
);

-- =====================================================
-- CARE LOG TICKETS
-- =====================================================
CREATE TABLE care_log_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  hardware_id UUID REFERENCES hardware(id) ON DELETE CASCADE NOT NULL,
  ticket_number TEXT UNIQUE NOT NULL,
  
  -- Submitter information
  submitted_by UUID REFERENCES profiles(id) NOT NULL,
  
  -- Ticket content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled')),
  
  -- SOP Acknowledgment
  sop_acknowledged BOOLEAN DEFAULT FALSE,
  sop_acknowledged_at TIMESTAMPTZ,
  acknowledged_sop_ids JSONB DEFAULT '[]'::jsonb,
  
  -- Assignment
  assigned_to UUID REFERENCES profiles(id),
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TICKET EVENTS (Audit trail)
-- =====================================================
CREATE TABLE ticket_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES care_log_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'status_changed', 'assigned', 'comment_added', 
    'attachment_added', 'priority_changed', 'updated'
  )),
  old_value TEXT,
  new_value TEXT,
  comment TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TICKET ATTACHMENTS
-- =====================================================
CREATE TABLE ticket_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES care_log_tickets(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TICKET TIMING ANALYTICS (Auto-calculated)
-- =====================================================
CREATE TABLE ticket_timing_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES care_log_tickets(id) ON DELETE CASCADE NOT NULL UNIQUE,
  time_to_first_response_ms BIGINT,
  time_to_resolve_ms BIGINT,
  time_open_total_ms BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_org_memberships_user_id ON org_memberships(user_id);
CREATE INDEX idx_org_memberships_org_id ON org_memberships(org_id);
CREATE INDEX idx_locations_org_id ON locations(org_id);
CREATE INDEX idx_location_assignments_user_id ON location_assignments(user_id);
CREATE INDEX idx_location_assignments_location_id ON location_assignments(location_id);
CREATE INDEX idx_hardware_org_id ON hardware(org_id);
CREATE INDEX idx_hardware_location_id ON hardware(location_id);
CREATE INDEX idx_hardware_status ON hardware(status);
CREATE INDEX idx_sops_org_id ON sops(org_id);
CREATE INDEX idx_care_log_tickets_org_id ON care_log_tickets(org_id);
CREATE INDEX idx_care_log_tickets_location_id ON care_log_tickets(location_id);
CREATE INDEX idx_care_log_tickets_hardware_id ON care_log_tickets(hardware_id);
CREATE INDEX idx_care_log_tickets_status ON care_log_tickets(status);
CREATE INDEX idx_care_log_tickets_submitted_by ON care_log_tickets(submitted_by);
CREATE INDEX idx_care_log_tickets_created_at ON care_log_tickets(created_at);
CREATE INDEX idx_ticket_events_ticket_id ON ticket_events(ticket_id);
CREATE INDEX idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('ticket-attachments', 'ticket-attachments', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]),
  ('hardware-photos', 'hardware-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_log_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_timing_analytics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - PROFILES
-- =====================================================
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view profiles in their orgs" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT user_id FROM org_memberships 
      WHERE org_id IN (
        SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- RLS POLICIES - ORGANIZATIONS
-- =====================================================
CREATE POLICY "Platform admins can view all organizations" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true
    )
  );

CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Platform admins can insert organizations" ON organizations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true
    )
  );

CREATE POLICY "Org admins can update their organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND role IN ('platform_admin', 'org_admin')
    )
  );

-- =====================================================
-- RLS POLICIES - ORG_MEMBERSHIPS
-- =====================================================
CREATE POLICY "Users can view memberships in their orgs" ON org_memberships
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Org admins can manage memberships" ON org_memberships
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND role IN ('platform_admin', 'org_admin')
    )
  );

-- =====================================================
-- RLS POLICIES - LOCATIONS
-- =====================================================
CREATE POLICY "Users can view locations in their orgs" ON locations
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Org admins can manage locations" ON locations
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND role IN ('platform_admin', 'org_admin')
    )
  );

-- =====================================================
-- RLS POLICIES - LOCATION_ASSIGNMENTS
-- =====================================================
CREATE POLICY "Users can view location assignments in their orgs" ON location_assignments
  FOR SELECT USING (
    location_id IN (
      SELECT id FROM locations 
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Org admins can manage location assignments" ON location_assignments
  FOR ALL USING (
    location_id IN (
      SELECT id FROM locations 
      WHERE org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = auth.uid() AND role IN ('platform_admin', 'org_admin')
      )
    )
  );

-- =====================================================
-- RLS POLICIES - HARDWARE
-- =====================================================
CREATE POLICY "Users can view hardware in their orgs" ON hardware
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Employees can view hardware at their assigned locations" ON hardware
  FOR SELECT USING (
    location_id IN (SELECT location_id FROM location_assignments WHERE user_id = auth.uid())
    OR org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND role IN ('platform_admin', 'org_admin')
    )
  );

CREATE POLICY "Org admins can manage hardware" ON hardware
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND role IN ('platform_admin', 'org_admin')
    )
  );

-- =====================================================
-- RLS POLICIES - SOPS
-- =====================================================
CREATE POLICY "Users can view SOPs in their orgs" ON sops
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Org admins can manage SOPs" ON sops
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND role IN ('platform_admin', 'org_admin')
    )
  );

-- =====================================================
-- RLS POLICIES - HARDWARE_SOPS
-- =====================================================
CREATE POLICY "Users can view hardware SOPs" ON hardware_sops
  FOR SELECT USING (
    hardware_id IN (
      SELECT id FROM hardware 
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Org admins can manage hardware SOPs" ON hardware_sops
  FOR ALL USING (
    hardware_id IN (
      SELECT id FROM hardware 
      WHERE org_id IN (
        SELECT org_id FROM org_memberships 
        WHERE user_id = auth.uid() AND role IN ('platform_admin', 'org_admin')
      )
    )
  );

-- =====================================================
-- RLS POLICIES - CARE_LOG_TICKETS
-- =====================================================
CREATE POLICY "Users can view tickets in their orgs" ON care_log_tickets
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Employees can view tickets for their assigned locations" ON care_log_tickets
  FOR SELECT USING (
    location_id IN (SELECT location_id FROM location_assignments WHERE user_id = auth.uid())
    OR org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND role IN ('platform_admin', 'org_admin')
    )
  );

CREATE POLICY "Users can create tickets for their assigned locations" ON care_log_tickets
  FOR INSERT WITH CHECK (
    location_id IN (SELECT location_id FROM location_assignments WHERE user_id = auth.uid())
    OR org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND role IN ('platform_admin', 'org_admin')
    )
  );

CREATE POLICY "Org admins can update tickets" ON care_log_tickets
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid() AND role IN ('platform_admin', 'org_admin')
    )
  );

-- =====================================================
-- RLS POLICIES - TICKET_EVENTS
-- =====================================================
CREATE POLICY "Users can view ticket events for accessible tickets" ON ticket_events
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM care_log_tickets 
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create ticket events" ON ticket_events
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM care_log_tickets 
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

-- =====================================================
-- RLS POLICIES - TICKET_ATTACHMENTS
-- =====================================================
CREATE POLICY "Users can view attachments for accessible tickets" ON ticket_attachments
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM care_log_tickets 
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can upload attachments" ON ticket_attachments
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM care_log_tickets 
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

-- =====================================================
-- RLS POLICIES - TICKET_TIMING_ANALYTICS
-- =====================================================
CREATE POLICY "Users can view timing analytics for accessible tickets" ON ticket_timing_analytics
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM care_log_tickets 
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "System can manage timing analytics" ON ticket_timing_analytics
  FOR ALL USING (true);

-- =====================================================
-- STORAGE RLS POLICIES
-- =====================================================

-- User Avatars (public bucket)
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Ticket Attachments (private bucket)
CREATE POLICY "Users can upload ticket attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ticket-attachments' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view ticket attachments in their orgs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'ticket-attachments' AND
    auth.uid() IS NOT NULL
  );

-- Hardware Photos (private bucket)
CREATE POLICY "Org admins can upload hardware photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'hardware-photos' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view hardware photos in their orgs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'hardware-photos' AND
    auth.uid() IS NOT NULL
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hardware_updated_at BEFORE UPDATE ON hardware
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sops_updated_at BEFORE UPDATE ON sops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_log_tickets_updated_at BEFORE UPDATE ON care_log_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number = 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('ticket_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq;

-- Trigger to generate ticket number
CREATE TRIGGER generate_ticket_number_trigger
  BEFORE INSERT ON care_log_tickets
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- Function to calculate timing analytics
CREATE OR REPLACE FUNCTION update_ticket_timing()
RETURNS TRIGGER AS $$
DECLARE
  time_to_first_resp BIGINT;
  time_to_res BIGINT;
  time_total BIGINT;
BEGIN
  -- Calculate time to first response
  IF NEW.first_response_at IS NOT NULL AND OLD.first_response_at IS NULL THEN
    time_to_first_resp := EXTRACT(EPOCH FROM (NEW.first_response_at - NEW.created_at)) * 1000;
  END IF;

  -- Calculate time to resolve
  IF NEW.resolved_at IS NOT NULL AND OLD.resolved_at IS NULL THEN
    time_to_res := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.created_at)) * 1000;
  END IF;

  -- Calculate total time open
  IF NEW.closed_at IS NOT NULL AND OLD.closed_at IS NULL THEN
    time_total := EXTRACT(EPOCH FROM (NEW.closed_at - NEW.created_at)) * 1000;
  END IF;

  -- Insert or update timing analytics
  INSERT INTO ticket_timing_analytics (
    ticket_id, 
    time_to_first_response_ms, 
    time_to_resolve_ms, 
    time_open_total_ms
  )
  VALUES (
    NEW.id,
    time_to_first_resp,
    time_to_res,
    time_total
  )
  ON CONFLICT (ticket_id) DO UPDATE SET
    time_to_first_response_ms = COALESCE(EXCLUDED.time_to_first_response_ms, ticket_timing_analytics.time_to_first_response_ms),
    time_to_resolve_ms = COALESCE(EXCLUDED.time_to_resolve_ms, ticket_timing_analytics.time_to_resolve_ms),
    time_open_total_ms = COALESCE(EXCLUDED.time_open_total_ms, ticket_timing_analytics.time_open_total_ms),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for timing analytics
CREATE TRIGGER update_ticket_timing_trigger
  AFTER UPDATE ON care_log_tickets
  FOR EACH ROW 
  WHEN (
    NEW.first_response_at IS DISTINCT FROM OLD.first_response_at OR
    NEW.resolved_at IS DISTINCT FROM OLD.resolved_at OR
    NEW.closed_at IS DISTINCT FROM OLD.closed_at
  )
  EXECUTE FUNCTION update_ticket_timing();

