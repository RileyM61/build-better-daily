-- Migration: Insert Read This First Instructional Post
-- Date: 2024
-- Description: Creates the permanent instructional post that explains how to use Build Better Daily
--
-- DESIGN CONTEXT:
-- This post is user-instruction infrastructure, not a blog article.
-- It is pinned at the top, visually distinguished, and excluded from:
-- - Normal publishing cadence
-- - Email automation
-- - Article generation logic
--
-- Purpose: Install usage pattern for new readers, not sell or market.

INSERT INTO posts (
  title,
  slug,
  excerpt,
  content,
  books,
  published,
  is_read_first,
  created_at
) VALUES (
  'Read This First: How to Use Build Better Daily',
  'read-this-first-how-to-use-build-better-daily',
  'This is not just a blog. It is a weekly leadership tool designed to move ideas from your head into the leadership room. Here is how to use it.',
  '# Read This First: How to Use Build Better Daily

## The Core Problem

Ideas die in the owner''s head.

You know the conversation you need to have. The one about the superintendent who''s burning jobs, the partner who isn''t pulling weight, or the business model that stopped working two years ago. Every week you don''t have it costs you real money.

Most construction owners have clarity about what needs to change. What they lack is a way to move that clarity into the leadership room where decisions get made and ownership gets assigned.

This blog exists to bridge that gap.

## Clear Reframe

This is more than a blog. It is a weekly leadership tool meant to drive conversation and action.

Each article is designed to be brought into your leadership meeting, not just read in isolation. The goal is clarity → conversation → action. Not inspiration. Not motivation. Action.

If you are looking for daily tips, motivational content, or easy answers, this is not that. This is for owners who are ready to have the hard conversations that actually change outcomes.

## How to Use Build Better Daily

**Step 1: Read the article individually.**

Take 5-10 minutes to read the weekly article. Do this before your leadership meeting. The article will name a tension, explain why it persists, and show how it fails in real operator conditions.

**Step 2: Bring the "Bring This to Your Leadership Meeting" section into the room.**

Every article includes a clearly labeled section with:
- **The Question** (forces alignment)
- **The Prompt** (forces clarity and discussion)
- **The Action** (forces ownership within 7 days)

Print this section. Bring it to your meeting. Put it on the table.

**Step 3: Pick one question, one prompt, one action.**

Do not try to address everything. Pick the one question that matters most right now. Use the prompt to start the discussion. Assign the action to a specific person with a specific deadline.

**Step 4: Assign clear ownership.**

The action must have:
- A name attached
- A deadline (within 7 days)
- A clear definition of "done"

If you cannot assign ownership, the conversation is not finished.

## What to Expect / What Not to Expect

**Expect:**
- Discomfort. Real conversations are uncomfortable.
- Clarity before agreement. You may not agree, but you will know what you disagree about.
- Resistance. Your team will push back. That is normal and useful information.

**Do not expect:**
- Motivation. This is not cheerleading.
- Easy answers. If it were easy, you would have already done it.
- Consensus without effort. Alignment requires work.

## Permission to Engage

You do not need to agree with everything you read here.

You do need to decide what to do with the material.

If an article does not apply to your situation, ignore it. If it does apply, bring it into the room. The goal is not agreement—it is clarity and action.

This is a tool. Use it or don''t. But if you use it, use it as designed: to move ideas from your head into the leadership room where they can become decisions.',
  '[]'::jsonb,
  true,
  true,
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

