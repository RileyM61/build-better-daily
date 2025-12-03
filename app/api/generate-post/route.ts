import { NextRequest, NextResponse } from 'next/server'
import { generateBlogPost } from '@/lib/claude'
import { createPost, getRecentPostTitles } from '@/lib/supabase'

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
    const recentTitles = await getRecentPostTitles(30)
    
    console.log('Generating new blog post...')
    console.log(`Avoiding ${recentTitles.length} existing topics`)

    // Generate the blog post using Claude
    const generatedPost = await generateBlogPost(recentTitles)
    
    console.log(`Generated post: "${generatedPost.title}"`)

    // Save to database
    const savedPost = await createPost({
      title: generatedPost.title,
      slug: generatedPost.slug,
      content: generatedPost.content,
      excerpt: generatedPost.excerpt,
      books: generatedPost.books,
      published: true,
    })

    if (!savedPost) {
      throw new Error('Failed to save post to database')
    }

    console.log(`Post saved with ID: ${savedPost.id}`)

    return NextResponse.json({
      success: true,
      post: {
        id: savedPost.id,
        title: savedPost.title,
        slug: savedPost.slug,
      },
    })
  } catch (error) {
    console.error('Error generating post:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate post',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        env_check: {
          has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
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

