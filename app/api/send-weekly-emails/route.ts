/**
 * Send Weekly Leadership Emails API
 * 
 * Sends transactional emails to all active subscribers for a published post.
 * Emails are sent individually (not batched) based on subscriber preferences.
 * 
 * DESIGN:
 * - Transactional emails, not newsletter blasts
 * - Each subscriber receives email individually
 * - Timing based on subscriber preferences (future: schedule based on meeting day)
 * - For now: sends immediately to all subscribers
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendWeeklyEmailToSubscriber } from '@/lib/resend'
import { getActiveSubscribers, updateWeeklyEmailSentStatus } from '@/lib/supabase'
import type { Post, WeeklyEmail } from '@/lib/supabase'

// Verify admin access (simple secret check for now)
function verifyAdminSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const adminSecret = process.env.CRON_SECRET
  
  const url = new URL(request.url)
  const querySecret = url.searchParams.get('secret')
  const postId = url.searchParams.get('post_id')

  if (!adminSecret) {
    return true // Allow if no secret configured
  }

  return (authHeader === `Bearer ${adminSecret}` || querySecret === adminSecret) && !!postId
}

export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyAdminSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const url = new URL(request.url)
  const postId = url.searchParams.get('post_id')

  if (!postId) {
    return NextResponse.json(
      { error: 'Missing post_id parameter' },
      { status: 400 }
    )
  }

  try {
    const supabase = createServerClient()

    // Fetch the post
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

    // Verify post is published
    if (!post.published) {
      return NextResponse.json(
        { error: 'Post must be published before sending emails' },
        { status: 400 }
      )
    }

    // Exclude instructional/onboarding posts from email automation
    // These are infrastructure, not content, and should not be emailed
    if (post.is_read_first) {
      return NextResponse.json(
        { error: 'Read First instructional posts are excluded from email automation' },
        { status: 400 }
      )
    }

    // Verify post has leadership tool
    if (!post.leadership_tool) {
      return NextResponse.json(
        { error: 'Post must have leadership_tool to send emails' },
        { status: 400 }
      )
    }

    // Fetch the weekly email
    const { data: emailData, error: emailError } = await supabase
      .from('weekly_emails')
      .select('*')
      .eq('post_id', postId)
      .single()

    if (emailError || !emailData) {
      return NextResponse.json(
        { error: 'Weekly email not found for this post' },
        { status: 404 }
      )
    }

    const weeklyEmail = emailData as WeeklyEmail

    // Check if already sent
    if (weeklyEmail.sent) {
      return NextResponse.json(
        { 
          error: 'Emails already sent for this post',
          sent_count: weeklyEmail.sent_count || 0
        },
        { status: 400 }
      )
    }

    // Get all active subscribers
    const subscribers = await getActiveSubscribers()

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers found' },
        { status: 400 }
      )
    }

    // Build article URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buildbetterdaily.com'
    const articleUrl = `${baseUrl}/post/${post.slug}`

    // Send emails individually
    console.log(`\n${'='.repeat(60)}`)
    console.log(`SENDING WEEKLY EMAILS FOR: "${post.title}"`)
    console.log(`Subscribers: ${subscribers.length}`)
    console.log('='.repeat(60))

    let successCount = 0
    let failureCount = 0
    const failures: Array<{ email: string; error: string }> = []

    // Resend rate limit: 2 requests per second
    // Use 700ms delay to stay safely under the limit (allows ~1.4 req/sec)
    const RATE_LIMIT_DELAY_MS = 700

    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i]
      
      const result = await sendWeeklyEmailToSubscriber(
        subscriber.email,
        weeklyEmail,
        post,
        articleUrl
      )

      if (result.success) {
        successCount++
        console.log(`✓ [${i + 1}/${subscribers.length}] Sent to ${subscriber.email}`)
      } else {
        failureCount++
        const errorMsg = result.error || 'Unknown error'
        failures.push({
          email: subscriber.email,
          error: errorMsg
        })
        console.log(`✗ [${i + 1}/${subscribers.length}] Failed: ${subscriber.email} - ${errorMsg}`)
      }

      // Rate limiting: wait between sends (except after the last one)
      if (i < subscribers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS))
      }
    }

    // Update sent status
    if (successCount > 0) {
      await updateWeeklyEmailSentStatus(weeklyEmail.id, successCount)
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`EMAIL SENDING COMPLETE`)
    console.log(`✓ Sent: ${successCount}`)
    console.log(`✗ Failed: ${failureCount}`)
    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      total: subscribers.length,
      failures: failures.length > 0 ? failures : undefined,
    })
  } catch (error) {
    console.error('Error sending weekly emails:', error)
    return NextResponse.json(
      {
        error: 'Failed to send emails',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support GET for easy browser testing
export async function GET(request: NextRequest) {
  return POST(request)
}

