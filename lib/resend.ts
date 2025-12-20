/**
 * Resend Email Client for Weekly Leadership Emails
 * 
 * DESIGN DECISIONS:
 * - Transactional emails, not newsletter blasts
 * - Plain HTML, no images, minimal styling
 * - Each email sent individually based on subscriber preferences
 * - Email is a standalone leadership tool (article link is secondary)
 */

import { Resend } from 'resend'
import type { WeeklyEmail, Post } from './supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

// From address - update this to your verified domain
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const FROM_NAME = 'Build Better Daily'

/**
 * Build HTML email template following the leadership email structure
 */
export function buildLeadershipEmailHTML(
  weeklyEmail: WeeklyEmail,
  post: Post,
  articleUrl: string
): string {
  // Extract leadership tool from post (required field)
  const leadershipTool = post.leadership_tool
  if (!leadershipTool) {
    throw new Error('Post must have leadership_tool to send email')
  }
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${weeklyEmail.subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <!-- Orientation Line -->
  <p style="font-size: 14px; color: #666; margin-bottom: 16px; font-style: italic;">
    This is your weekly leadership prompt — designed to be brought into the room, not just read.
  </p>
  
  <!-- Opening Frame (1 paragraph) -->
  <p style="font-size: 16px; margin-bottom: 24px;">
    ${weeklyEmail.body}
  </p>
  
  <!-- Core Leadership Tool -->
  <div style="background-color: #f9f9f9; border-left: 3px solid #d4af37; padding: 20px; margin: 24px 0;">
    <h3 style="margin-top: 0; color: #333; font-size: 18px;">Bring This to Your Leadership Meeting</h3>
    
    <p style="margin: 16px 0;">
      <strong style="color: #333;">The Question:</strong><br>
      <span style="color: #555;">${leadershipTool.question}</span>
    </p>
    
    <p style="margin: 16px 0;">
      <strong style="color: #333;">The Prompt:</strong><br>
      <span style="color: #555;">${leadershipTool.prompt}</span>
    </p>
    
    <p style="margin: 16px 0;">
      <strong style="color: #333;">The Action:</strong><br>
      <span style="color: #555;">${leadershipTool.action}</span>
    </p>
  </div>
  
  <!-- Friction Warning -->
  <p style="font-size: 16px; margin: 24px 0;">
    <strong style="color: #333;">What will derail this conversation:</strong><br>
    <span style="color: #555;">${weeklyEmail.watch_for}</span>
  </p>
  
  <!-- Execution Nudge -->
  <p style="font-size: 16px; margin: 24px 0;">
    <strong style="color: #333;">If it stalls:</strong><br>
    <span style="color: #555;">${weeklyEmail.execution_nudge}</span>
  </p>
  
  <!-- Article Link (bottom) -->
  <p style="font-size: 14px; color: #666; margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
    <a href="${articleUrl}" style="color: #666; text-decoration: none;">Read the full article →</a>
  </p>
  
  <!-- Signature -->
  <p style="font-size: 16px; margin-top: 32px; color: #333;">
    Martin<br>
    <span style="color: #666;">— Build Better Daily</span>
  </p>
  
</body>
</html>
  `.trim()
}

/**
 * Send weekly leadership email to a single subscriber
 */
export async function sendWeeklyEmailToSubscriber(
  subscriberEmail: string,
  weeklyEmail: WeeklyEmail,
  post: Post,
  articleUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = buildLeadershipEmailHTML(weeklyEmail, post, articleUrl)
    
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: subscriberEmail,
      subject: weeklyEmail.subject,
      html,
    })

    if (error) {
      // Resend error can be an object with message, name, etc.
      const errorMessage = typeof error === 'object' && error !== null
        ? (error as { message?: string; name?: string }).message || JSON.stringify(error)
        : String(error)
      console.error(`Failed to send email to ${subscriberEmail}:`, errorMessage)
      return { success: false, error: errorMessage }
    }

    console.log(`✓ Email sent to ${subscriberEmail} (ID: ${data?.id})`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Error sending email to ${subscriberEmail}:`, message)
    return { success: false, error: message }
  }
}

