-- =====================================================
-- CONTACTS TABLE
-- =====================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_contacts_org_id ON contacts(org_id);
CREATE INDEX idx_contacts_location_id ON contacts(location_id);

-- Updated timestamp trigger
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES FOR CONTACTS
-- =====================================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Platform admins can see all contacts
CREATE POLICY "Platform admins can view all contacts"
  ON contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  );

-- Org admins can view their org's contacts
CREATE POLICY "Org admins can view their org's contacts"
  ON contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = contacts.org_id
      AND org_memberships.role IN ('org_admin', 'platform_admin')
    )
  );

-- Platform admins can insert contacts for any org
CREATE POLICY "Platform admins can insert contacts"
  ON contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  );

-- Org admins can insert contacts for their org
CREATE POLICY "Org admins can insert contacts for their org"
  ON contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = contacts.org_id
      AND org_memberships.role IN ('org_admin', 'platform_admin')
    )
  );

-- Platform admins can update all contacts
CREATE POLICY "Platform admins can update all contacts"
  ON contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  );

-- Org admins can update their org's contacts
CREATE POLICY "Org admins can update their org's contacts"
  ON contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = contacts.org_id
      AND org_memberships.role IN ('org_admin', 'platform_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = contacts.org_id
      AND org_memberships.role IN ('org_admin', 'platform_admin')
    )
  );

-- Platform admins can delete all contacts
CREATE POLICY "Platform admins can delete all contacts"
  ON contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  );

-- Org admins can delete their org's contacts
CREATE POLICY "Org admins can delete their org's contacts"
  ON contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = contacts.org_id
      AND org_memberships.role IN ('org_admin', 'platform_admin')
    )
  );

