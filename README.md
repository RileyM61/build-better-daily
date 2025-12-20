# Build Better Daily — Weekly Leadership System

A weekly leadership tool generator for construction company owners. Each Monday, the system generates one high-quality leadership article designed to drive clarity, conversation, and action in leadership meetings.

## System Philosophy

**This is NOT a content feed. This is a leadership tool.**

- **Weekly cadence**: One article per week, designed for depth over volume
- **Meeting-ready**: Every article includes a "Bring This to Your Leadership Meeting" section
- **Intentionally constrained**: Claude follows a strict editorial playbook
- **Email companion**: Each article comes with a meeting-focused email nudge

## Editorial Constraints

### Content Pillars (exactly one per article)
1. Think Like an Investor (Operator Edition)
2. Financial Clarity Without Accounting Theater
3. Operational Discipline That Reduces Chaos
4. Leadership Reality in Small Companies
5. Building Value Without Burning Your Life Down

### Article Archetypes (exactly one per article)
1. Misconception Kill Shot
2. Operator Reality Check
3. Decision Framework
4. Failure-Earned Insight
5. Quiet Discipline Piece
6. Value vs Life Tension Piece

### Anti-Patterns (Claude will fail if these appear)
- Listicles ("5 tips", "7 ways")
- Motivational language
- Hustle/grind framing
- Generic best practices
- Marketing CTAs

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude API (Anthropic)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel
- **Scheduler**: Vercel Cron Jobs (Weekly)

## Setup

### 1. Clone and Install

```bash
git clone <your-repo>
cd build-better-daily
npm install
```

### 2. Configure Environment Variables

Copy `env.example` to `.env.local` and fill in your values:

```bash
cp env.example .env.local
```

Required variables:
- `ANTHROPIC_API_KEY` - Your Claude API key
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `CRON_SECRET` - A random string to secure the cron endpoint

### 3. Database Setup

Run the migrations in your Supabase SQL editor:

```sql
-- First, create the base posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  books JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published BOOLEAN DEFAULT false NOT NULL
);

-- Then run the weekly leadership system migration
-- See: migrations/001_weekly_leadership_system.sql
```

### 4. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Cron Configuration

The system generates one article per week on Monday at 8 AM UTC.

```json
{
  "crons": [
    {
      "path": "/api/generate-post",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

### Manual Generation

You can manually trigger generation for testing:

```bash
curl -X POST https://your-domain.vercel.app/api/generate-post \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Project Structure

```
├── app/
│   ├── api/generate-post/   # Weekly generation endpoint
│   ├── post/[slug]/         # Individual article page
│   ├── page.tsx             # Homepage
│   └── layout.tsx           # Root layout
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PostCard.tsx
│   └── BookRecommendation.tsx
├── lib/
│   ├── supabase.ts          # Database client and types
│   └── claude.ts            # Editorial playbook + generation
├── migrations/
│   └── 001_weekly_leadership_system.sql
└── vercel.json              # Weekly cron configuration
```

## Non-Goals

This system intentionally does NOT optimize for:
- SEO rankings
- Traffic growth
- Engagement metrics
- Content volume

It optimizes for: **depth, usefulness, and trust.**

## License

MIT
