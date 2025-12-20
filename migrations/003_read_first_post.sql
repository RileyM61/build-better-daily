-- Migration: Read First Instructional Post
-- Date: 2024
-- Description: Adds is_read_first field to mark instructional/onboarding posts
--
-- DESIGN CONTEXT:
-- This migration supports a permanent "Read This First" instructional post that:
-- - Appears pinned at the top of the blog index
-- - Is visually distinguished as infrastructure, not content
-- - Is excluded from normal publishing cadence and email automation
-- - Functions as user-instruction infrastructure, not a blog article

-- ============================================================================
-- Add is_read_first field to posts table
-- ============================================================================

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_read_first BOOLEAN DEFAULT false NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN posts.is_read_first IS 'Marks instructional/onboarding post that should be pinned at top and excluded from normal publishing cadence';

-- Create index for efficient querying of pinned posts
CREATE INDEX IF NOT EXISTS idx_posts_read_first ON posts(is_read_first, created_at DESC) WHERE is_read_first = true;

