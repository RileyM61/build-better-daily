-- Fix: Add sent_count column to weekly_emails if missing
-- This handles the case where weekly_emails table was created before sent_count was added

ALTER TABLE weekly_emails 
ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0 NOT NULL;

COMMENT ON COLUMN weekly_emails.sent_count IS 'Number of subscribers who received this email';

