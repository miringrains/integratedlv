-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
-- Stores user notifications for in-app alerts
-- Supports multiple notification types and read/unread tracking

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification content
  type TEXT NOT NULL CHECK (type IN (
    'ticket_assigned',
    'ticket_comment',
    'ticket_status_changed',
    'ticket_created',
    'ticket_priority_changed'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entity
  ticket_id UUID REFERENCES care_log_tickets(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Read/unread tracking
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_ticket_id ON notifications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING ((select auth.uid()) = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Only system can insert notifications (via service role or triggers)
-- Platform admins can insert notifications for any user
CREATE POLICY "Platform admins can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.is_platform_admin = true
    )
  );

-- Function to create notification (for use in triggers/API)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_ticket_id UUID DEFAULT NULL,
  p_related_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    ticket_id,
    related_user_id,
    metadata,
    is_read,
    created_at
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_ticket_id,
    p_related_user_id,
    p_metadata,
    FALSE,
    NOW()
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL OR array_length(p_notification_ids, 1) IS NULL THEN
    -- Mark all notifications as read for this user
    UPDATE public.notifications
    SET is_read = TRUE,
        read_at = NOW()
    WHERE user_id = p_user_id
      AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  ELSE
    -- Mark specific notifications as read
    UPDATE public.notifications
    SET is_read = TRUE,
        read_at = NOW()
    WHERE user_id = p_user_id
      AND id = ANY(p_notification_ids)
      AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  END IF;
  
  RETURN updated_count;
END;
$$;

