-- =====================================================
-- EXTEND TICKETS TABLE
-- =====================================================
-- Make hardware_id nullable and add SLA/satisfaction fields

-- Make hardware_id nullable (currently NOT NULL)
ALTER TABLE care_log_tickets
ALTER COLUMN hardware_id DROP NOT NULL;

-- Add new fields
ALTER TABLE care_log_tickets
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sla_response_due_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sla_resolution_due_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS customer_satisfaction_rating INTEGER CHECK (customer_satisfaction_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS customer_satisfaction_feedback TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_care_log_tickets_department_id ON care_log_tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_care_log_tickets_due_date ON care_log_tickets(due_date);
CREATE INDEX IF NOT EXISTS idx_care_log_tickets_sla_response_due_at ON care_log_tickets(sla_response_due_at);
CREATE INDEX IF NOT EXISTS idx_care_log_tickets_sla_resolution_due_at ON care_log_tickets(sla_resolution_due_at);
CREATE INDEX IF NOT EXISTS idx_care_log_tickets_acknowledged_at ON care_log_tickets(acknowledged_at);

-- Add foreign key constraint for department_id
-- (Already added above with REFERENCES clause)
