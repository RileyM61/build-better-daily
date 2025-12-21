import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getWeeklyEmailByPostId } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, postId } = await request.json()

    if (!email || !postId) {
      return NextResponse.json(
        { error: 'Email and postId are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if email is a subscriber
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('id, email, unsubscribed')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (subError || !subscriber || subscriber.unsubscribed) {
      return NextResponse.json(
        { error: 'Email not found in subscribers list. Please subscribe first.' },
        { status: 404 }
      )
    }

    // Get the post
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (postError || !postData) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const post = postData as Post

    // Get the weekly email
    const weeklyEmail = await getWeeklyEmailByPostId(postId)

    if (!weeklyEmail) {
      return NextResponse.json(
        { error: 'No email content available for this article' },
        { status: 404 }
      )
    }

    // Build article URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buildbetterdaily.com'
    const articleUrl = `${baseUrl}/post/${post.slug}`

    return NextResponse.json({
      success: true,
      email: {
        subject: weeklyEmail.subject,
        body: weeklyEmail.body,
        leadership_prompt: weeklyEmail.leadership_prompt,
        watch_for: weeklyEmail.watch_for,
        execution_nudge: weeklyEmail.execution_nudge,
        leadership_tool: post.leadership_tool,
        article_url: articleUrl,
      },
    })
  } catch (error) {
    console.error('Error getting email content:', error)
    return NextResponse.json(
      {
        error: 'Failed to get email content',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

