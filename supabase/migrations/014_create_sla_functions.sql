-- =====================================================
-- SLA CALCULATION FUNCTIONS
-- =====================================================

-- Function to calculate SLA due dates based on priority and org SLA settings
CREATE OR REPLACE FUNCTION calculate_ticket_sla_dates()
RETURNS TRIGGER AS $$
DECLARE
  org_sla_response_normal INTEGER;
  org_sla_response_high INTEGER;
  org_sla_response_urgent INTEGER;
  org_sla_resolution_normal INTEGER;
  org_sla_resolution_high INTEGER;
  org_sla_resolution_urgent INTEGER;
BEGIN
  -- Get org SLA settings (use defaults if not set)
  SELECT 
    COALESCE(sla_response_time_normal, 1440),
    COALESCE(sla_response_time_high, 240),
    COALESCE(sla_response_time_urgent, 60),
    COALESCE(sla_resolution_time_normal, 2880),
    COALESCE(sla_resolution_time_high, 480),
    COALESCE(sla_resolution_time_urgent, 120)
  INTO 
    org_sla_response_normal,
    org_sla_response_high,
    org_sla_response_urgent,
    org_sla_resolution_normal,
    org_sla_resolution_high,
    org_sla_resolution_urgent
  FROM organizations WHERE id = NEW.org_id;

  -- Calculate response due date based on priority
  IF NEW.priority = 'urgent' THEN
    NEW.sla_response_due_at := NEW.created_at + (org_sla_response_urgent || ' minutes')::INTERVAL;
    NEW.sla_resolution_due_at := NEW.created_at + (org_sla_resolution_urgent || ' minutes')::INTERVAL;
  ELSIF NEW.priority = 'high' THEN
    NEW.sla_response_due_at := NEW.created_at + (org_sla_response_high || ' minutes')::INTERVAL;
    NEW.sla_resolution_due_at := NEW.created_at + (org_sla_resolution_high || ' minutes')::INTERVAL;
  ELSIF NEW.priority = 'low' THEN
    -- Use normal SLA for low priority
    NEW.sla_response_due_at := NEW.created_at + (org_sla_response_normal || ' minutes')::INTERVAL;
    NEW.sla_resolution_due_at := NEW.created_at + (org_sla_resolution_normal || ' minutes')::INTERVAL;
  ELSE
    -- Default to normal priority
    NEW.sla_response_due_at := NEW.created_at + (org_sla_response_normal || ' minutes')::INTERVAL;
    NEW.sla_resolution_due_at := NEW.created_at + (org_sla_resolution_normal || ' minutes')::INTERVAL;
  END IF;

  -- Set due_date to response due (for "due today" calculations)
  NEW.due_date := NEW.sla_response_due_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate SLA dates on INSERT
CREATE TRIGGER calculate_sla_dates_insert_trigger
  BEFORE INSERT ON care_log_tickets
  FOR EACH ROW
  WHEN (NEW.priority IS NOT NULL AND NEW.org_id IS NOT NULL)
  EXECUTE FUNCTION calculate_ticket_sla_dates();

-- Trigger to recalculate SLA dates on UPDATE (if priority or org_id changes)
CREATE TRIGGER calculate_sla_dates_update_trigger
  BEFORE UPDATE ON care_log_tickets
  FOR EACH ROW
  WHEN (
    (NEW.priority IS DISTINCT FROM OLD.priority OR NEW.org_id IS DISTINCT FROM OLD.org_id)
    AND NEW.priority IS NOT NULL 
    AND NEW.org_id IS NOT NULL
  )
  EXECUTE FUNCTION calculate_ticket_sla_dates();
