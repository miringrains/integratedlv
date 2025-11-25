-- Migration: Add Missing Foreign Key Indexes
-- Improves query performance for joins and lookups on foreign key columns
-- Note: Using regular CREATE INDEX (not CONCURRENTLY) because migrations run in transactions
-- These indexes are small and will create quickly, minimal locking impact

-- =====================================================
-- CARE_LOG_TICKETS INDEXES
-- =====================================================

-- Index for assigned_to foreign key (used in ticket assignment queries)
CREATE INDEX IF NOT EXISTS idx_care_log_tickets_assigned_to 
  ON care_log_tickets(assigned_to);

-- =====================================================
-- INVITATIONS INDEXES
-- =====================================================

-- Index for created_by foreign key (used in invitation management queries)
CREATE INDEX IF NOT EXISTS idx_invitations_created_by 
  ON invitations(created_by);

-- Index for org_id foreign key (used in org filtering queries)
CREATE INDEX IF NOT EXISTS idx_invitations_org_id 
  ON invitations(org_id);

-- =====================================================
-- SOPS INDEXES
-- =====================================================

-- Index for created_by foreign key (used in SOP queries)
CREATE INDEX IF NOT EXISTS idx_sops_created_by 
  ON sops(created_by);

-- =====================================================
-- TICKET_ATTACHMENTS INDEXES
-- =====================================================

-- Index for uploaded_by foreign key (used in attachment queries)
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_uploaded_by 
  ON ticket_attachments(uploaded_by);

-- =====================================================
-- TICKET_COMMENTS INDEXES
-- =====================================================

-- Index for user_id foreign key (used frequently in comment queries)
CREATE INDEX IF NOT EXISTS idx_ticket_comments_user_id 
  ON ticket_comments(user_id);

-- =====================================================
-- TICKET_EVENTS INDEXES
-- =====================================================

-- Index for user_id foreign key (used frequently in event queries)
CREATE INDEX IF NOT EXISTS idx_ticket_events_user_id 
  ON ticket_events(user_id);

