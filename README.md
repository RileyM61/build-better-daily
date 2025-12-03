# WIP Wisdom Blog

An automated blog about construction business management, powered by AI. New posts are generated daily using Claude API and stored in Supabase.

## Features

- **Automated Content Generation**: Claude AI writes daily blog posts about construction business topics
- **Smart Topic Selection**: AI avoids duplicate topics by tracking previously covered subjects
- **Book Recommendations**: Each post includes 3 relevant Amazon affiliate book recommendations
- **Mobile-First Design**: Dark, minimal design inspired by wip-insights.com
- **SEO Optimized**: Proper meta tags, semantic HTML, and fast loading

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude API (Anthropic)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel
- **Scheduler**: Vercel Cron Jobs

## Setup

### 1. Clone and Install

```bash
git clone <your-repo>
cd wip-blog
npm install
```

### 2. Configure Environment Variables

Copy `env.example` to `.env.local` and fill in your values:

```bash
cp env.example .env.local
```

Required variables:
- `ANTHROPIC_API_KEY` - Your Claude API key from [console.anthropic.com](https://console.anthropic.com)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (found in project settings)
- `AMAZON_AFFILIATE_TAG` - Your Amazon Associates tag (e.g., `yourtag-20`)
- `CRON_SECRET` - A random string to secure the cron endpoint

### 3. Database Setup

The Supabase table is already created. If you need to recreate it:

```sql
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

CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published_date ON posts(published, created_at DESC);
```

### 4. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables in Vercel project settings
4. Deploy!

### Cron Configuration

The blog generates one post daily at 8 AM UTC. This is configured in `vercel.json`.

**For testing (every 5 minutes)**:
```json
{
  "crons": [
    {
      "path": "/api/generate-post",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**For production (daily at 8 AM UTC)**:
```json
{
  "crons": [
    {
      "path": "/api/generate-post",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### Manual Post Generation

You can manually trigger post generation:

```bash
curl -X POST https://your-domain.vercel.app/api/generate-post \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Project Structure

```
├── app/
│   ├── api/generate-post/   # Cron endpoint for AI content generation
│   ├── post/[slug]/         # Individual blog post page
│   ├── page.tsx             # Homepage with blog listing
│   └── layout.tsx           # Root layout with metadata
├── components/
│   ├── Header.tsx           # Site header with navigation
│   ├── Footer.tsx           # Site footer
│   ├── PostCard.tsx         # Blog post preview card
│   └── BookRecommendation.tsx # Amazon affiliate book section
├── lib/
│   ├── supabase.ts          # Supabase client and helpers
│   └── claude.ts            # Claude API integration
└── vercel.json              # Cron job configuration
```

## License

MIT

