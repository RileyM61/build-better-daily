-- Migration: Enable Row Level Security (RLS)
-- Date: 2024
-- Description: Enables RLS on weekly_emails and linkedin_packs tables for security
--
-- SECURITY CONTEXT:
-- These tables contain admin-only content (email templates and social media drafts).
-- The application uses service role key for all operations, which bypasses RLS.
-- Enabling RLS ensures these tables are protected from public/anonymous access.
--
-- DESIGN DECISION:
-- No policies are created for anon/authenticated roles - these tables are admin-only.
-- Service role operations continue to work as they bypass RLS entirely.

-- ============================================================================
-- STEP 1: Enable RLS on weekly_emails table
-- ============================================================================

ALTER TABLE weekly_emails ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Enable RLS on linkedin_packs table
-- ============================================================================

ALTER TABLE linkedin_packs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- - Service role key (used by createServerClient()) bypasses RLS, so all
--   existing application functionality will continue to work.
-- - No policies are needed since these tables are admin-only and accessed
--   exclusively via service role.
-- - This satisfies Supabase Security Advisor requirements while maintaining
--   application functionality.

