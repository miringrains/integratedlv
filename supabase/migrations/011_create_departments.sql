-- =====================================================
-- DEPARTMENTS TABLE
-- =====================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_departments_org_id ON departments(org_id);
CREATE INDEX idx_departments_manager_id ON departments(manager_id);

-- Updated timestamp trigger
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES FOR DEPARTMENTS
-- =====================================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Platform admins can see all departments
CREATE POLICY "Platform admins can view all departments"
  ON departments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  );

-- Org admins and employees can view their org's departments
CREATE POLICY "Org members can view their org's departments"
  ON departments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = departments.org_id
    )
  );

-- Platform admins can insert departments for any org
CREATE POLICY "Platform admins can insert departments"
  ON departments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  );

-- Org admins can insert departments for their org
CREATE POLICY "Org admins can insert departments"
  ON departments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = departments.org_id
      AND org_memberships.role = 'org_admin'
    )
  );

-- Platform admins can update all departments
CREATE POLICY "Platform admins can update all departments"
  ON departments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  );

-- Org admins can update their org's departments
CREATE POLICY "Org admins can update their org's departments"
  ON departments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = departments.org_id
      AND org_memberships.role = 'org_admin'
    )
  );

-- Platform admins can delete all departments
CREATE POLICY "Platform admins can delete all departments"
  ON departments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  );

-- Org admins can delete their org's departments
CREATE POLICY "Org admins can delete their org's departments"
  ON departments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = departments.org_id
      AND org_memberships.role = 'org_admin'
    )
  );
