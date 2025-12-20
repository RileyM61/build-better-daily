-- Migration: Subscriber Delivery Preferences
-- Date: 2024
-- Description: Adds delivery timing preferences for weekly leadership emails
--
-- DESIGN CONTEXT:
-- Subscribers choose when they want to receive weekly emails based on:
-- - Their leadership meeting day (Monday, Tuesday, etc.)
-- - Their preferred delivery window (morning of meeting day, or before meeting day)
--
-- This enables transactional, individually-timed emails rather than batch newsletter sends.

-- ============================================================================
-- STEP 1: Add delivery preference columns to subscribers table
-- ============================================================================

-- Day of the week when subscriber has their leadership meeting
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS leadership_meeting_day TEXT;

-- When to deliver the email relative to meeting day
-- 'morning' = 8 AM on the meeting day
-- 'before' = 6 PM the day before the meeting day
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS delivery_window TEXT;

-- Unsubscribe tracking
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN subscribers.leadership_meeting_day IS 'Day of week for leadership meeting (Monday, Tuesday, etc.)';
COMMENT ON COLUMN subscribers.delivery_window IS 'Delivery timing: morning (8 AM on meeting day) or before (6 PM day before)';
COMMENT ON COLUMN subscribers.unsubscribed IS 'Whether subscriber has unsubscribed from emails';
COMMENT ON COLUMN subscribers.unsubscribed_at IS 'Timestamp when subscriber unsubscribed';

-- ============================================================================
-- STEP 2: Add sent_count to weekly_emails for tracking
-- ============================================================================

ALTER TABLE weekly_emails 
ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0 NOT NULL;

COMMENT ON COLUMN weekly_emails.sent_count IS 'Number of subscribers who received this email';

