-- Migration: Fix Function Search Path Security
-- Adds SET search_path = '' to all SECURITY DEFINER functions to prevent search_path manipulation attacks
-- All functions now use fully qualified names (schema.table) for security

-- =====================================================
-- FUNCTION: handle_new_user
-- =====================================================

-- OLD DEFINITION (for reference):
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, email, created_at, updated_at)
--   VALUES (NEW.id, NEW.email, NOW(), NOW());
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: update_updated_at_column
-- =====================================================

-- OLD DEFINITION (for reference):
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: generate_ticket_number
-- =====================================================

-- OLD DEFINITION (for reference):
-- CREATE OR REPLACE FUNCTION generate_ticket_number()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.ticket_number = 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('ticket_number_seq')::TEXT, 6, '0');
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.ticket_number = 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('ticket_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: update_ticket_timing
-- =====================================================

-- OLD DEFINITION (for reference):
-- CREATE OR REPLACE FUNCTION update_ticket_timing()
-- RETURNS TRIGGER AS $$
-- DECLARE
--   time_to_first_resp BIGINT;
--   time_to_res BIGINT;
--   time_total BIGINT;
-- BEGIN
--   IF NEW.first_response_at IS NOT NULL AND OLD.first_response_at IS NULL THEN
--     time_to_first_resp := EXTRACT(EPOCH FROM (NEW.first_response_at - NEW.created_at)) * 1000;
--   END IF;
--   IF NEW.resolved_at IS NOT NULL AND OLD.resolved_at IS NULL THEN
--     time_to_res := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.created_at)) * 1000;
--   END IF;
--   IF NEW.closed_at IS NOT NULL AND OLD.closed_at IS NULL THEN
--     time_total := EXTRACT(EPOCH FROM (NEW.closed_at - NEW.created_at)) * 1000;
--   END IF;
--   INSERT INTO ticket_timing_analytics (...)
--   VALUES (...)
--   ON CONFLICT (ticket_id) DO UPDATE SET ...;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_ticket_timing()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
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
  INSERT INTO public.ticket_timing_analytics (
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
    time_to_first_response_ms = COALESCE(EXCLUDED.time_to_first_response_ms, public.ticket_timing_analytics.time_to_first_response_ms),
    time_to_resolve_ms = COALESCE(EXCLUDED.time_to_resolve_ms, public.ticket_timing_analytics.time_to_resolve_ms),
    time_open_total_ms = COALESCE(EXCLUDED.time_open_total_ms, public.ticket_timing_analytics.time_open_total_ms),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: create_user_with_password
-- =====================================================

-- OLD DEFINITION (for reference):
-- CREATE OR REPLACE FUNCTION public.create_user_with_password(user_email text, user_password text, user_metadata jsonb DEFAULT '{}'::jsonb)
-- RETURNS uuid
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $function$
-- DECLARE
--   new_user_id UUID;
-- BEGIN
--   new_user_id := gen_random_uuid();
--   INSERT INTO auth.users (...) VALUES (...);
--   RETURN new_user_id;
-- END;
-- $function$;

CREATE OR REPLACE FUNCTION public.create_user_with_password(
  user_email text, 
  user_password text, 
  user_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Generate UUID for new user
  new_user_id := gen_random_uuid();
  
  -- Insert into auth.users (fully qualified)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    user_metadata,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
  
  RETURN new_user_id;
END;
$$;

-- =====================================================
-- FUNCTION: auto_promote_admin
-- =====================================================

-- OLD DEFINITION (for reference):
-- CREATE OR REPLACE FUNCTION public.auto_promote_admin()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $function$
-- BEGIN
--   IF NEW.email = 'kevin@breakthruweb.com' THEN
--     NEW.is_platform_admin = true;
--   END IF;
--   RETURN NEW;
-- END;
-- $function$;

CREATE OR REPLACE FUNCTION public.auto_promote_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Auto-promote kevin@breakthruweb.com to platform admin
  IF NEW.email = 'kevin@breakthruweb.com' THEN
    NEW.is_platform_admin = true;
  END IF;
  RETURN NEW;
END;
$$;

