/**
 * Generate Weekly Email API
 * 
 * Generates a weekly email companion for an existing post.
 * Used when a post was created manually and doesn't have an email yet.
 * 
 * Note: This endpoint is called from the admin dashboard which requires authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateWeeklyEmail } from '@/lib/claude'
import { createWeeklyEmail } from '@/lib/supabase'
import type { Post, LeadershipTool } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  // Note: This endpoint is called from the admin dashboard which requires authentication

  try {
    const { post_id } = await request.json()

    if (!post_id) {
      return NextResponse.json(
        { error: 'Missing post_id' },
        { status: 400 }
      )
    }

    // Fetch the post
    const supabase = createServerClient()
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', post_id)
      .single()

    if (postError || !postData) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const post = postData as Post

    // Check if post already has an email
    const { data: existingEmail } = await supabase
      .from('weekly_emails')
      .select('id')
      .eq('post_id', post_id)
      .maybeSingle()

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Post already has a weekly email' },
        { status: 400 }
      )
    }

    // Verify post has required fields for email generation
    if (!post.leadership_tool) {
      return NextResponse.json(
        { error: 'Post must have a leadership_tool to generate email' },
        { status: 400 }
      )
    }

    if (!post.pillar || !post.archetype) {
      return NextResponse.json(
        { error: 'Post must have both pillar and archetype to generate email' },
        { status: 400 }
      )
    }

    // Convert Post to GeneratedPost format for generateWeeklyEmail
    const generatedPost = {
      title: post.title,
      pillar: post.pillar,
      archetype: post.archetype,
      leadershipTool: post.leadership_tool as LeadershipTool,
      excerpt: post.excerpt,
      content: post.content,
      slug: post.slug,
      books: post.books || [],
    }

    // Generate the email
    console.log(`Generating weekly email for post: "${post.title}"`)
    const generatedEmail = await generateWeeklyEmail(generatedPost)

    // Save email to database
    const savedEmail = await createWeeklyEmail({
      post_id: post.id,
      subject: generatedEmail.subject,
      preheader: generatedEmail.preheader,
      body: generatedEmail.body,
      leadership_prompt: generatedEmail.leadershipPrompt,
      watch_for: generatedEmail.watchFor,
      execution_nudge: generatedEmail.executionNudge,
      sent: false,
    })

    if (!savedEmail) {
      throw new Error('Failed to save email to database')
    }

    console.log(`✓ Email generated and saved for post: "${post.title}"`)

    return NextResponse.json({
      success: true,
      email: {
        id: savedEmail.id,
        subject: savedEmail.subject,
      },
    })
  } catch (error) {
    console.error('Error generating email:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

