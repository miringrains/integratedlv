-- =====================================================
-- EXTEND ORGANIZATIONS TABLE
-- =====================================================
-- Add business address, hours, SLA settings, and account manager fields

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_city TEXT,
ADD COLUMN IF NOT EXISTS business_state TEXT,
ADD COLUMN IF NOT EXISTS business_zip TEXT,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS account_service_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sla_response_time_normal INTEGER DEFAULT 1440, -- 24 hours in minutes
ADD COLUMN IF NOT EXISTS sla_response_time_high INTEGER DEFAULT 240, -- 4 hours in minutes
ADD COLUMN IF NOT EXISTS sla_response_time_urgent INTEGER DEFAULT 60, -- 1 hour in minutes
ADD COLUMN IF NOT EXISTS sla_resolution_time_normal INTEGER DEFAULT 2880, -- 48 hours in minutes
ADD COLUMN IF NOT EXISTS sla_resolution_time_high INTEGER DEFAULT 480, -- 8 hours in minutes
ADD COLUMN IF NOT EXISTS sla_resolution_time_urgent INTEGER DEFAULT 120; -- 2 hours in minutes

-- Add index for account service manager lookups
CREATE INDEX IF NOT EXISTS idx_organizations_account_service_manager_id 
ON organizations(account_service_manager_id);

-- Add comment for business_hours JSONB structure
COMMENT ON COLUMN organizations.business_hours IS 'JSON object with day keys (monday, tuesday, etc.) and time values (e.g., "9am-5pm")';
