-- =====================================================
-- CONTRACTS TABLE
-- =====================================================
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  contract_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  contract_value NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_contracts_org_id ON contracts(org_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_contract_number ON contracts(contract_number);

-- Updated timestamp trigger
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate contract numbers
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := 'CNT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('contract_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for contract numbers
CREATE SEQUENCE IF NOT EXISTS contract_number_seq START 1;

-- Trigger to auto-generate contract numbers
CREATE TRIGGER generate_contract_number_trigger
  BEFORE INSERT ON contracts
  FOR EACH ROW
  WHEN (NEW.contract_number IS NULL OR NEW.contract_number = '')
  EXECUTE FUNCTION generate_contract_number();

-- =====================================================
-- RLS POLICIES FOR CONTRACTS
-- =====================================================
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Platform admins can see all contracts
CREATE POLICY "Platform admins can view all contracts"
  ON contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  );

-- Org admins and employees can view their org's contracts
CREATE POLICY "Org members can view their org's contracts"
  ON contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = contracts.org_id
    )
  );

-- Platform admins can insert contracts for any org
CREATE POLICY "Platform admins can insert contracts"
  ON contracts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  );

-- Org admins can insert contracts for their org
CREATE POLICY "Org admins can insert contracts"
  ON contracts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = contracts.org_id
      AND org_memberships.role = 'org_admin'
    )
  );

-- Platform admins can update all contracts
CREATE POLICY "Platform admins can update all contracts"
  ON contracts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  );

-- Org admins can update their org's contracts
CREATE POLICY "Org admins can update their org's contracts"
  ON contracts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = contracts.org_id
      AND org_memberships.role = 'org_admin'
    )
  );

-- Platform admins can delete all contracts
CREATE POLICY "Platform admins can delete all contracts"
  ON contracts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_platform_admin = true
    )
  );

-- Org admins can delete their org's contracts
CREATE POLICY "Org admins can delete their org's contracts"
  ON contracts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = contracts.org_id
      AND org_memberships.role = 'org_admin'
    )
  );
