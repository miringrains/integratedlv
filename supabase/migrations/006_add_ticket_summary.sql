-- Migration: Add closed_summary field to care_log_tickets table
-- Stores AI-generated summary when ticket is closed
-- Generated asynchronously, so field is nullable

ALTER TABLE care_log_tickets 
ADD COLUMN closed_summary TEXT;

-- Create partial index for quick retrieval of tickets with summaries
-- Only indexes rows where summary exists (more efficient)
CREATE INDEX IF NOT EXISTS idx_care_log_tickets_closed_summary 
ON care_log_tickets(closed_summary) 
WHERE closed_summary IS NOT NULL;

