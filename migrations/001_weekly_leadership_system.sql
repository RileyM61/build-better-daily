-- Migration: Weekly Leadership System
-- Date: 2024
-- Description: Adds editorial metadata and email companion support
--
-- DESIGN CONTEXT:
-- This migration supports the transition from daily blog posts to weekly
-- leadership articles. Each article now includes:
-- - A content pillar (strategic category)
-- - An article archetype (structural approach)
-- - A leadership tool section (meeting-ready components)
-- - An email companion (for subscriber distribution)

-- ============================================================================
-- STEP 1: Add editorial columns to posts table
-- ============================================================================

-- Content pillar - which strategic lens the article uses
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS pillar TEXT;

-- Article archetype - the structural approach used
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS archetype TEXT;

-- Leadership tool - JSON containing question, prompt, and action
-- This is the "Bring This to Your Leadership Meeting" section
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS leadership_tool JSONB;

-- Add comments for documentation
COMMENT ON COLUMN posts.pillar IS 'Editorial pillar: Think Like an Investor, Financial Clarity, Operational Discipline, Leadership Reality, or Building Value';
COMMENT ON COLUMN posts.archetype IS 'Article archetype: Misconception Kill Shot, Operator Reality Check, Decision Framework, Failure-Earned Insight, Quiet Discipline, or Value vs Life Tension';
COMMENT ON COLUMN posts.leadership_tool IS 'JSON with {question, prompt, action} for leadership meeting use';

-- ============================================================================
-- STEP 2: Create weekly_emails table
-- ============================================================================

CREATE TABLE IF NOT EXISTS weekly_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  preheader TEXT,
  body TEXT NOT NULL,
  leadership_prompt TEXT NOT NULL,
  watch_for TEXT NOT NULL,
  execution_nudge TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  sent BOOLEAN DEFAULT false NOT NULL,
  sent_at TIMESTAMPTZ
);

-- Index for looking up email by post
CREATE INDEX IF NOT EXISTS idx_weekly_emails_post_id ON weekly_emails(post_id);

-- Index for finding unsent emails
CREATE INDEX IF NOT EXISTS idx_weekly_emails_unsent ON weekly_emails(sent, created_at DESC) WHERE sent = false;

-- Add comments for documentation
COMMENT ON TABLE weekly_emails IS 'Email companions for weekly leadership articles - focused on meeting utility, not newsletter recaps';
COMMENT ON COLUMN weekly_emails.leadership_prompt IS 'One sharpened leadership prompt to bring to the meeting';
COMMENT ON COLUMN weekly_emails.watch_for IS 'One specific resistance pattern to anticipate';
COMMENT ON COLUMN weekly_emails.execution_nudge IS 'One concrete way to actually implement the insight';

-- ============================================================================
-- STEP 3: Add constraint to ensure valid pillars (optional, for data integrity)
-- ============================================================================

-- Note: Uncomment if you want database-level validation
-- ALTER TABLE posts ADD CONSTRAINT valid_pillar CHECK (
--   pillar IS NULL OR pillar IN (
--     'Think Like an Investor (Operator Edition)',
--     'Financial Clarity Without Accounting Theater',
--     'Operational Discipline That Reduces Chaos',
--     'Leadership Reality in Small Companies',
--     'Building Value Without Burning Your Life Down'
--   )
-- );

-- ALTER TABLE posts ADD CONSTRAINT valid_archetype CHECK (
--   archetype IS NULL OR archetype IN (
--     'Misconception Kill Shot',
--     'Operator Reality Check',
--     'Decision Framework',
--     'Failure-Earned Insight',
--     'Quiet Discipline Piece',
--     'Value vs Life Tension Piece'
--   )
-- );

