-- Migration: LinkedIn Pack System
-- Date: 2024
-- Description: Adds LinkedIn Pack storage for social content generation
--
-- DESIGN CONTEXT:
-- This migration supports the social content pipeline that generates LinkedIn
-- posts alongside weekly articles. Each pack includes:
-- - Primary LinkedIn post (founder voice, 5-8 paragraphs)
-- - Short version (3-4 paragraphs)
-- - Comment seeding prompts (internal use)
-- - Reply angles for engagement
-- - Article reference (quiet CTA)
-- - Status tracking (draft, edited, posted)
--
-- PHILOSOPHY:
-- The founder's thinking stays human. AI assists with translation, not authorship.
-- Nothing posts automatically. Outputs are drafts for review and intentional posting.

-- ============================================================================
-- STEP 1: Create linkedin_packs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS linkedin_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  primary_post TEXT NOT NULL,
  short_version TEXT NOT NULL,
  comment_starters TEXT[] NOT NULL,
  reply_angles TEXT[] NOT NULL,
  article_link TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'edited', 'posted')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  posted_at TIMESTAMPTZ
);

-- Index for looking up pack by post
CREATE INDEX IF NOT EXISTS idx_linkedin_packs_post_id ON linkedin_packs(post_id);

-- Index for finding packs by status
CREATE INDEX IF NOT EXISTS idx_linkedin_packs_status ON linkedin_packs(status, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE linkedin_packs IS 'LinkedIn Pack storage - structured social content generated alongside weekly articles. Drafts for review, not auto-posting.';
COMMENT ON COLUMN linkedin_packs.primary_post IS 'Primary LinkedIn post (5-8 paragraphs, founder voice, scroll-stopping opener, ends with question)';
COMMENT ON COLUMN linkedin_packs.short_version IS 'Alternate short version (3-4 paragraphs, tighter framing)';
COMMENT ON COLUMN linkedin_packs.comment_starters IS '3 suggested first comments the founder could post (internal prompts)';
COMMENT ON COLUMN linkedin_packs.reply_angles IS '3 example reply angles for when people engage (internal prompts)';
COMMENT ON COLUMN linkedin_packs.article_link IS 'Optional quiet CTA: "I wrote more about this here → [link]"';
COMMENT ON COLUMN linkedin_packs.status IS 'Status: draft (generated), edited (manually modified), posted (marked as posted)';

-- ============================================================================
-- STEP 2: Create trigger to update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_linkedin_packs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER linkedin_packs_updated_at
  BEFORE UPDATE ON linkedin_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_linkedin_packs_updated_at();

