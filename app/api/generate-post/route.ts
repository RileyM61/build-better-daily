/**
 * Weekly Leadership Article Generation API
 * 
 * This endpoint generates ONE high-quality leadership article per week,
 * along with its email companion. It is triggered by Vercel Cron every Monday.
 * 
 * DESIGN NOTES:
 * - Weekly cadence is intentional (see lib/claude.ts for rationale)
 * - Each article includes a Leadership Tool Section for meeting use
 * - Email companion is generated to help readers apply the insight
 * - Anti-patterns are validated and will cause generation to fail
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateBlogPost, generateWeeklyEmail } from '@/lib/claude'
import { createPost, createWeeklyEmail, getRecentPostTitles } from '@/lib/supabase'

// Verify the cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // Also check for secret in URL query param for easy browser testing
  const url = new URL(request.url)
  const querySecret = url.searchParams.get('secret')

  // If no secret is configured, allow access (for initial setup)
  if (!cronSecret) {
    return true
  }

  // Check authorization header OR query parameter
  return authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Get recent post titles to avoid duplicate topics
    // Using larger window for weekly system (52 = ~1 year of weekly posts)
    const recentTitles = await getRecentPostTitles(52)
    
    console.log('='.repeat(60))
    console.log('WEEKLY LEADERSHIP ARTICLE GENERATION')
    console.log('='.repeat(60))
    console.log(`Avoiding ${recentTitles.length} existing topics`)

    // STEP 1: Generate the leadership article
    console.log('\n[1/3] Generating leadership article...')
    const generatedPost = await generateBlogPost(recentTitles)
    
    console.log(`✓ Article generated: "${generatedPost.title}"`)
    console.log(`  Pillar: ${generatedPost.pillar}`)
    console.log(`  Archetype: ${generatedPost.archetype}`)

    // STEP 2: Save article to database
    console.log('\n[2/3] Saving article to database...')
    const savedPost = await createPost({
      title: generatedPost.title,
      slug: generatedPost.slug,
      content: generatedPost.content,
      excerpt: generatedPost.excerpt,
      pillar: generatedPost.pillar,
      archetype: generatedPost.archetype,
      leadership_tool: generatedPost.leadershipTool,
      books: generatedPost.books,
      published: true,
    })

    if (!savedPost) {
      throw new Error('Failed to save post to database')
    }

    console.log(`✓ Post saved with ID: ${savedPost.id}`)

    // STEP 3: Generate and save email companion
    console.log('\n[3/3] Generating email companion...')
    const generatedEmail = await generateWeeklyEmail(generatedPost)
    
    console.log(`✓ Email generated: "${generatedEmail.subject}"`)

    // Save email to database
    const savedEmail = await createWeeklyEmail({
      post_id: savedPost.id,
      subject: generatedEmail.subject,
      preheader: generatedEmail.preheader,
      body: generatedEmail.body,
      leadership_prompt: generatedEmail.leadershipPrompt,
      watch_for: generatedEmail.watchFor,
      execution_nudge: generatedEmail.executionNudge,
      sent: false,
    })

    if (!savedEmail) {
      console.warn('Warning: Email companion was not saved to database')
    } else {
      console.log(`✓ Email saved with ID: ${savedEmail.id}`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('GENERATION COMPLETE')
    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      post: {
        id: savedPost.id,
        title: savedPost.title,
        slug: savedPost.slug,
        pillar: savedPost.pillar,
        archetype: savedPost.archetype,
      },
      email: savedEmail ? {
        id: savedEmail.id,
        subject: savedEmail.subject,
      } : null,
    })
  } catch (error) {
    console.error('=' .repeat(60))
    console.error('GENERATION FAILED')
    console.error('='.repeat(60))
    console.error('Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate weekly leadership content',
        details: error instanceof Error ? error.message : 'Unknown error',
        // Include stack trace for debugging (remove in production if needed)
        stack: error instanceof Error ? error.stack : undefined,
        env_check: {
          has_anthropic_key: !!process.env.ANTHROPIC_API_KEY,
          has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
