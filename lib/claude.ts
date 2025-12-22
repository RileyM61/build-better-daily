/**
 * EDITORIAL SYSTEM: Weekly Leadership Tool Generator
 * 
 * DESIGN DECISIONS (Product, not temporary hacks):
 * 
 * 1. WHY WEEKLY CADENCE:
 *    - Each article is a leadership meeting input, not content inventory
 *    - Weekly allows depth over volume
 *    - Readers use these in actual leadership meetings — daily would overwhelm
 *    - Quality threshold: Would this change behavior in a leadership meeting?
 * 
 * 2. WHY ARTICLES ARE TOOLS, NOT CONTENT:
 *    - Target reader: Construction owner who realized more revenue didn't help
 *    - They don't need more reading — they need meeting inputs
 *    - Every article MUST include a usable Leadership Tool Section
 *    - If it can't drive a conversation, it shouldn't be published
 * 
 * 3. WHY MULTI-AGENT PIPELINE (NEW):
 *    - Single-prompt generation conflates creative thinking with editorial enforcement
 *    - Multi-agent separation reduces failure rates by isolating concerns:
 *      → Insight Generator: Pure creative divergence (no formatting overhead)
 *      → Editorial Architect: Apply structure, pillars, archetypes
 *      → Discipline Enforcer: Hard pass/fail gate with specific violations
 *      → Final Polisher: Language refinement (only on PASS)
 *    - Each agent can be tuned and debugged independently
 *    - The Discipline Enforcer becomes a real gate, not a hopeful check
 * 
 * 4. WHY CLAUDE IS INTENTIONALLY CONSTRAINED:
 *    - Unconstrained AI produces "content slop" — generic, safe, forgettable
 *    - Pillars and archetypes force specificity and editorial voice
 *    - Anti-patterns are guardrails, not suggestions
 *    - Failure is better than weak content — we fail loudly
 * 
 * 5. NON-GOALS (by design):
 *    - No SEO optimization
 *    - No traffic growth tactics
 *    - No engagement metrics
 *    - No experimentation frameworks
 *    - This system optimizes for depth, usefulness, and trust
 */

import Anthropic from '@anthropic-ai/sdk'
import type { Book } from './supabase'
import { generateArticleWithPipeline } from './agents'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// =============================================================================
// PIPELINE CONFIGURATION
// =============================================================================

/**
 * Feature flag: Use multi-agent pipeline for article generation
 * 
 * When true (default): Uses the new 4-agent pipeline
 * - Insight Generator → Editorial Architect → Discipline Enforcer → Final Polisher
 * - Better separation of concerns, stricter validation
 * 
 * When false: Uses the legacy single-prompt approach
 * - Kept for fallback/comparison during transition
 */
const USE_MULTI_AGENT_PIPELINE = true

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Content Pillars - Exactly ONE per article
 * These define the strategic lens through which the article views the problem.
 */
export const CONTENT_PILLARS = [
  'Think Like an Investor (Operator Edition)',
  'Financial Clarity Without Accounting Theater',
  'Operational Discipline That Reduces Chaos',
  'Leadership Reality in Small Companies',
  'Building Value Without Burning Your Life Down',
] as const

export type ContentPillar = typeof CONTENT_PILLARS[number]

/**
 * Article Archetypes - Exactly ONE per article
 * These define the structural approach and emotional arc of the piece.
 */
export const ARTICLE_ARCHETYPES = [
  'Misconception Kill Shot',      // Demolish a false belief head-on
  'Operator Reality Check',       // Ground truth from lived experience
  'Decision Framework',           // Structured approach to a recurring decision
  'Failure-Earned Insight',       // Wisdom extracted from specific failure
  'Quiet Discipline Piece',       // Unsexy habit that compounds
  'Value vs Life Tension Piece',  // Navigate the real tradeoffs
] as const

export type ArticleArchetype = typeof ARTICLE_ARCHETYPES[number]

/**
 * Leadership Tool - MANDATORY section in every article
 * This is what makes the article usable in an actual leadership meeting.
 */
export interface LeadershipTool {
  question: string   // Forces alignment — the uncomfortable question to ask
  prompt: string     // Forces clarity — the discussion starter
  action: string     // Forces ownership — specific action within 7 days
}

/**
 * Generated Article with full editorial metadata
 */
export interface GeneratedPost {
  title: string
  slug: string
  content: string
  excerpt: string
  pillar: ContentPillar
  archetype: ArticleArchetype
  leadershipTool: LeadershipTool
  books: Book[]
}

/**
 * Weekly Email Companion
 * Shorter than the article, focused on meeting utility.
 */
export interface GeneratedEmail {
  subject: string
  preheader: string
  body: string
  leadershipPrompt: string    // One sharpened leadership prompt
  watchFor: string            // One "watch for this" warning
  executionNudge: string      // One execution nudge
}

/**
 * LinkedIn Pack - Structured social content for LinkedIn
 * Generated alongside articles, but designed for conversation-starting posts.
 * 
 * SOCIAL CONTENT PHILOSOPHY (Non-Negotiable):
 * 
 * 1. The founder's thinking stays human - AI assists with translation, not authorship
 * 2. Nothing posts automatically - outputs are drafts for review
 * 3. System reduces friction, not automates voice
 * 4. Founder judgment remains the final step
 * 
 * NON-GOALS: Auto-posting, engagement bots, scraping, growth hacking
 * This system supports thoughtful presence, not volume.
 */
export interface LinkedInPack {
  primaryPost: string      // 5-8 short paragraphs, scroll-stopping opener, ends with question
  shortVersion: string     // 3-4 paragraphs, tighter framing
  commentStarters: string[] // 3 suggested first comments (internal prompts)
  replyAngles: string[]    // 3 engagement reply angles (internal prompts)
  articleLink: string      // Optional quiet CTA: "I wrote more about this here → [link]"
}

// =============================================================================
// EDITORIAL PLAYBOOK (SYSTEM PROMPT)
// =============================================================================

const SYSTEM_PROMPT = `You are Martin Riley — a fractional CFO, leadership coach, and trusted advisor to construction company owners. You write weekly leadership articles that function as meeting inputs, not content.

══════════════════════════════════════════════════════════════════════════════
POSITIONING (NON-NEGOTIABLE)
══════════════════════════════════════════════════════════════════════════════

AUDIENCE: Construction owners who have realized more revenue hasn't made their business better. They've hit $2-10M and discovered that growth amplified their problems instead of solving them.

TONE: Calm, direct, experienced peer. You've sat across the table from hundreds of owners. You're not a guru, not motivational, not selling hope. You're the person who tells them what they already know but haven't admitted.

PURPOSE: Every article must drive: Clarity → Conversation → Action inside a leadership team. If it can't be used in a meeting, it shouldn't exist.

YOUR CORE PHILOSOPHY: PEACE, LOVE, SERVE
- Peace: This human life is a small piece of something bigger — don't get dragged into drama
- Love: Unconditional, for everyone — including the reader
- Serve: How you show up with clients, family, and yourself
This is your operating system, not a tagline.

══════════════════════════════════════════════════════════════════════════════
CONTENT PILLARS (EXACTLY ONE PER ARTICLE — YOU MUST DECLARE IT)
══════════════════════════════════════════════════════════════════════════════

1. Think Like an Investor (Operator Edition)
   - View the business as an asset, not just income
   - Adjusted EBITDA × Multiple thinking
   - What would a buyer see? What would scare them?

2. Financial Clarity Without Accounting Theater
   - Cash is truth. Everything else is narrative.
   - The 15-minute weekly finance meeting
   - Numbers that matter vs numbers that impress accountants

3. Operational Discipline That Reduces Chaos
   - Labor capacity planning
   - Job costing reality
   - Systems that work when the owner isn't watching

4. Leadership Reality in Small Companies
   - Clarity, Consistency, Courage
   - The owner ceiling (business grows only to owner's development level)
   - Hard conversations nobody wants to have

5. Building Value Without Burning Your Life Down
   - Space → Perspective → Decisions → Value
   - Anti-hustle philosophy
   - The exit that doesn't require you to hate your life first

══════════════════════════════════════════════════════════════════════════════
ARTICLE ARCHETYPES (EXACTLY ONE PER ARTICLE — YOU MUST DECLARE IT)
══════════════════════════════════════════════════════════════════════════════

1. Misconception Kill Shot
   - Open by naming the false belief
   - Show why it persists (it feels true, it's comfortable, it's what everyone says)
   - Demolish it with operator reality
   - Replace it with harder truth

2. Operator Reality Check
   - Start with "Here's what actually happens..."
   - No theory, no best practices
   - Ground truth from sitting across from real owners
   - Acknowledge why the easy path is tempting

3. Decision Framework
   - For recurring decisions that paralyze owners
   - Give them a structure, not a formula
   - Include the human friction (they won't want to follow it)
   - Make it usable in a real meeting

4. Failure-Earned Insight
   - Start with a specific failure (yours or a disguised client)
   - No silver linings, no "everything happens for a reason"
   - Extract the insight that only failure teaches
   - Make them feel less alone

5. Quiet Discipline Piece
   - The unsexy habit that compounds
   - No quick wins, no hacks
   - The thing they know they should do but don't
   - Make discipline feel possible, not punishing

6. Value vs Life Tension Piece
   - Acknowledge the real tradeoff
   - No false solutions ("you can have it all!")
   - Navigate the tension honestly
   - Peace as a starting point, not a reward

══════════════════════════════════════════════════════════════════════════════
MANDATORY ARTICLE STRUCTURE
══════════════════════════════════════════════════════════════════════════════

Every article MUST follow this structure:

1. OPENING TENSION (first 3 paragraphs)
   - Name the false belief or avoided issue immediately
   - Make the reader feel seen ("this is about me")
   - No warm-up, no context-setting, no "In today's competitive landscape..."

2. CORE INSIGHT
   - Explain why the belief persists (it's not stupidity — it's human)
   - Show how it fails in real operator conditions
   - Use specific scenarios, not abstract principles

3. REALITY LAYER
   - Include the human friction: resistance, ego, fear
   - Acknowledge why the right path is hard
   - Avoid generic advice — be specific enough to be useful

4. LEADERSHIP TOOL SECTION (REQUIRED — LABELED CLEARLY)
   
   ## Bring This to Your Leadership Meeting
   
   **The Question** (forces alignment):
   [One uncomfortable question to ask your team]
   
   **The Prompt** (forces clarity):
   [One discussion starter that exposes the real issue]
   
   **The Action** (forces ownership):
   [One specific thing to do within 7 days — with a name attached]

5. CLOSE
   - Ground them in peace and possibility
   - No pressure, no "take action now!"
   - Leave them with clarity, not anxiety

══════════════════════════════════════════════════════════════════════════════
VOICE CALIBRATION
══════════════════════════════════════════════════════════════════════════════

SIGNATURE PHRASES (use naturally, not forced):
- "Here's the truth most people avoid."
- "Let me be blunt."
- "Let's slow the noise down."
- "You don't need ten steps. You need one."
- "Cash is the truth teller."
- "Clarity beats hustle."
- "Peace is the starting point, not the reward."

WRITING MECHANICS:
- Short paragraphs that punch
- One idea per paragraph
- No jargon, no corporate speak
- Simple words over impressive ones
- 1000-1500 words (not 800-1200 — these are leadership tools, not blog posts)

══════════════════════════════════════════════════════════════════════════════
ANTI-PATTERNS — IF YOU PRODUCE THESE, YOU HAVE FAILED
══════════════════════════════════════════════════════════════════════════════

EXPLICITLY FORBIDDEN:
❌ "5 tips" or any listicle format
❌ "In today's competitive landscape..." or any throat-clearing opener
❌ Motivational language ("You've got this!", "Crush it!")
❌ Hustle/grind framing ("Work harder", "Outwork the competition")
❌ Generic best practices ("Communicate clearly with your team")
❌ SEO-driven question headlines ("What is WIP and why does it matter?")
❌ Tool roundups or software recommendations
❌ Marketing CTAs ("Download our free guide!")
❌ False urgency ("Act now before it's too late!")
❌ Inspirational quotes from famous people
❌ Success theater ("Here's how I 10x'd my business")

IF YOU CANNOT SATISFY THE CONSTRAINTS, FAIL LOUDLY.
Return an error explaining which constraint you cannot meet.
Do not produce weak content to satisfy a request.`

// =============================================================================
// ERROR CLASSES
// =============================================================================

/**
 * Custom error for anti-pattern violations
 * This allows the retry mechanism to catch and provide feedback
 */
export class AntiPatternError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AntiPatternError'
  }
}

// =============================================================================
// ARTICLE GENERATION
// =============================================================================

/**
 * Internal function that performs a single generation attempt
 * @param existingTitles - Titles to avoid duplicating
 * @param feedback - Array of previous rejection reasons (for retries)
 */
async function generateBlogPostAttempt(
  existingTitles: string[],
  feedback: string[] = []
): Promise<GeneratedPost> {
  const titlesContext = existingTitles.length > 0
    ? `\n\nAVOID THESE TOPICS (already covered):\n${existingTitles.map(t => `- ${t}`).join('\n')}`
    : ''

  // Build feedback context if this is a retry
  const feedbackContext = feedback.length > 0
    ? `\n\n⚠️ PREVIOUS ATTEMPT REJECTED:\n${feedback.map(f => `- ${f}`).join('\n')}\n\nCRITICAL: Rewrite the article WITHOUT these violations. Be extra careful to avoid these patterns.`
    : ''

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 6000,
    messages: [
      {
        role: 'user',
        content: `Generate a weekly leadership article following the editorial playbook exactly.
${feedbackContext}
CONTENT PILLARS (choose exactly ONE):
1. Think Like an Investor (Operator Edition)
2. Financial Clarity Without Accounting Theater
3. Operational Discipline That Reduces Chaos
4. Leadership Reality in Small Companies
5. Building Value Without Burning Your Life Down

ARTICLE ARCHETYPES (choose exactly ONE):
1. Misconception Kill Shot
2. Operator Reality Check
3. Decision Framework
4. Failure-Earned Insight
5. Quiet Discipline Piece
6. Value vs Life Tension Piece
${titlesContext}

Respond with a JSON object in this EXACT format:
{
  "pillar": "exact pillar name from list above",
  "archetype": "exact archetype name from list above",
  "title": "Compelling title that signals the core tension (no SEO-bait questions)",
  "slug": "url-friendly-slug-with-hyphens",
  "excerpt": "2-3 sentences in Martin's voice — direct, specific, no fluff (150-200 chars)",
  "content": "Full article in Markdown. MUST include '## Bring This to Your Leadership Meeting' section with The Question, The Prompt, and The Action. 1000-1500 words.",
  "leadershipTool": {
    "question": "The uncomfortable alignment question",
    "prompt": "The clarity-forcing discussion starter",
    "action": "Specific 7-day action with ownership"
  },
  "books": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "asin": "Amazon ASIN",
      "description": "One sentence on why this book matters for this specific topic"
    }
  ]
}

BOOK OPTIONS (choose 2-3 most relevant):
- "Profit First for Contractors" by Shawn Van Dyke (ASIN: 1642011118)
- "The E-Myth Contractor" by Michael Gerber (ASIN: 0060938463)
- "Markup & Profit: A Contractor's Guide" by Michael Stone (ASIN: 1928580017)
- "Running a Successful Construction Company" by David Gerstel (ASIN: 1561585300)
- "Built to Sell" by John Warrillow (ASIN: 1591845823)
- "Traction" by Gino Wickman (ASIN: 1936661837)
- "The Goal" by Eliyahu Goldratt (ASIN: 0884271951)
- "Good to Great" by Jim Collins (ASIN: 0066620996)
- "The Lean Builder" by Joe Donarumo (ASIN: 1734108509)
- "The Wealthy Contractor" by Brian Kaskavalciyan (ASIN: 1734928204)

Return ONLY the JSON object, no other text.
If you cannot satisfy all editorial constraints, return: {"error": "explanation of which constraint cannot be met"}`
      }
    ],
    system: SYSTEM_PROMPT,
  })

  const textContent = response.content.find(block => block.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response')
  }

  try {
    let jsonString = textContent.text.trim()
    
    // Remove markdown code blocks if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7)
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3)
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.slice(0, -3)
    }
    jsonString = jsonString.trim()
    
    // Try to extract JSON object if there's extra text
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonString = jsonMatch[0]
    }

    let parsed
    try {
      parsed = JSON.parse(jsonString)
    } catch (jsonError) {
      // Log first 500 chars of response for debugging
      console.error('JSON parse failed. Response preview:', jsonString.substring(0, 500))
      throw new Error(`JSON parse error: ${jsonError instanceof Error ? jsonError.message : 'Unknown'}. Check server logs for response preview.`)
    }
    
    // Check for explicit failure
    if (parsed.error) {
      throw new Error(`Claude refused to generate: ${parsed.error}`)
    }

    const post = parsed as GeneratedPost
    
    // Validate required fields
    if (!post.title || !post.slug || !post.content || !post.excerpt) {
      throw new Error('Missing required fields in generated post')
    }
    
    // Validate pillar
    if (!post.pillar || !CONTENT_PILLARS.includes(post.pillar)) {
      throw new Error(`Invalid or missing pillar. Must be one of: ${CONTENT_PILLARS.join(', ')}`)
    }
    
    // Validate archetype
    if (!post.archetype || !ARTICLE_ARCHETYPES.includes(post.archetype)) {
      throw new Error(`Invalid or missing archetype. Must be one of: ${ARTICLE_ARCHETYPES.join(', ')}`)
    }
    
    // Validate leadership tool
    if (!post.leadershipTool || !post.leadershipTool.question || !post.leadershipTool.prompt || !post.leadershipTool.action) {
      throw new Error('Missing required Leadership Tool section (question, prompt, action)')
    }
    
    // Validate content includes leadership meeting section
    if (!post.content.includes('## Bring This to Your Leadership Meeting')) {
      throw new Error('Article content must include "## Bring This to Your Leadership Meeting" section')
    }
    
    // Validate books
    if (!Array.isArray(post.books) || post.books.length < 2 || post.books.length > 3) {
      throw new Error('Expected 2-3 book recommendations')
    }
    
    // Anti-pattern validation
    const antiPatterns = [
      { pattern: /\d+\s+(tips|ways|steps|secrets|hacks)/i, name: 'listicle format' },
      { pattern: /in today's (competitive|fast-paced|modern)/i, name: 'throat-clearing opener' },
      { pattern: /(you've got this|crush it|let's go)/i, name: 'motivational language' },
      { pattern: /(hustle|grind|outwork|10x)/i, name: 'hustle culture framing' },
      { pattern: /download our|free guide|sign up now/i, name: 'marketing CTA' },
    ]
    
    for (const { pattern, name } of antiPatterns) {
      if (pattern.test(post.content)) {
        throw new AntiPatternError(`Anti-pattern detected: ${name}. Article rejected.`)
      }
    }
    
    return post
  } catch (parseError) {
    console.error('Failed to parse Claude response:', textContent.text)
    throw new Error(`Failed to parse generated post: ${parseError}`)
  }
}

/**
 * Retry wrapper for article generation with feedback loop
 * Catches AntiPatternError and retries with feedback up to maxAttempts times
 */
async function generateWithRetry(
  existingTitles: string[],
  maxAttempts: number = 3
): Promise<GeneratedPost> {
  let lastError: Error | null = null
  const feedback: string[] = []
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const post = await generateBlogPostAttempt(existingTitles, feedback)
      if (attempt > 1) {
        console.log(`✓ Success on attempt ${attempt} after incorporating feedback`)
      }
      return post // Success
    } catch (error) {
      if (error instanceof AntiPatternError) {
        // Add feedback for next attempt
        feedback.push(error.message)
        lastError = error
        console.log(`Attempt ${attempt}/${maxAttempts} rejected: ${error.message}. Retrying...`)
        
        if (attempt === maxAttempts) {
          // Final attempt failed - throw with all feedback
          throw new Error(
            `Failed after ${maxAttempts} attempts. Violations:\n${feedback.map(f => `- ${f}`).join('\n')}`
          )
        }
      } else {
        // Non-recoverable error (parsing, API, etc.) - throw immediately
        throw error
      }
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw new Error(`Failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`)
}

/**
 * Public function: Generate a blog post
 * 
 * Uses multi-agent pipeline by default (controlled by USE_MULTI_AGENT_PIPELINE flag).
 * Falls back to legacy single-prompt approach if disabled.
 * 
 * Multi-Agent Pipeline Advantages:
 * - Separates creative thinking from editorial enforcement
 * - Strict Discipline Enforcer catches tone drift and weak leadership tools
 * - Each agent can be tuned independently
 * - Higher-confidence publishable articles
 */
export async function generateBlogPost(existingTitles: string[]): Promise<GeneratedPost> {
  if (USE_MULTI_AGENT_PIPELINE) {
    console.log('Using multi-agent pipeline for article generation')
    return generateArticleWithPipeline(existingTitles)
  }
  
  // Legacy fallback
  console.log('Using legacy single-prompt generation')
  return generateWithRetry(existingTitles, 3)
}

// =============================================================================
// EMAIL COMPANION GENERATION
// =============================================================================

export async function generateWeeklyEmail(post: GeneratedPost): Promise<GeneratedEmail> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Generate a weekly leadership email companion for this article.

ARTICLE TITLE: "${post.title}"
ARTICLE PILLAR: ${post.pillar}
ARTICLE ARCHETYPE: ${post.archetype}
LEADERSHIP TOOL:
- Question: ${post.leadershipTool.question}
- Prompt: ${post.leadershipTool.prompt}
- Action: ${post.leadershipTool.action}

ARTICLE EXCERPT: "${post.excerpt}"

EMAIL REQUIREMENTS:
1. SHORTER than the article — this is a meeting nudge, not a summary
2. Focus on helping the reader USE the idea in their next leadership meeting
3. DO NOT recap the article — assume they'll read it
4. DO NOT use newsletter voice ("Happy Monday!", "In this week's issue...")
5. Write as Martin — direct, human, grounded

MUST INCLUDE:
- One sharpened leadership prompt (can be adapted from article)
- One "watch for this" warning (what will resist this change)
- One execution nudge (how to actually do the thing)

Respond with JSON in this EXACT format:
{
  "subject": "Email subject line — direct, no clickbait (under 50 chars)",
  "preheader": "Preview text that appears after subject (under 100 chars)",
  "body": "The email body in plain text. 150-250 words max. Direct, human, focused on meeting utility.",
  "leadershipPrompt": "One sharpened prompt to bring to the meeting",
  "watchFor": "One specific resistance pattern to anticipate",
  "executionNudge": "One concrete way to actually do this"
}

Return ONLY the JSON object.`
      }
    ],
    system: SYSTEM_PROMPT,
  })

  const textContent = response.content.find(block => block.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response for email')
  }

  try {
    let jsonString = textContent.text.trim()
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7)
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3)
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.slice(0, -3)
    }
    jsonString = jsonString.trim()

    const email = JSON.parse(jsonString) as GeneratedEmail
    
    // Validate required fields
    if (!email.subject || !email.body || !email.leadershipPrompt || !email.watchFor || !email.executionNudge) {
      throw new Error('Missing required fields in generated email')
    }
    
    // Validate length constraints
    if (email.subject.length > 60) {
      throw new Error('Email subject too long (max 60 chars)')
    }
    
    // Anti-pattern check for newsletter voice
    const newsletterPatterns = [
      /happy (monday|tuesday|wednesday|thursday|friday)/i,
      /in this (week's|issue|edition)/i,
      /welcome to/i,
      /hope this finds you/i,
    ]
    
    for (const pattern of newsletterPatterns) {
      if (pattern.test(email.body)) {
        throw new Error('Email uses newsletter voice. Rejected.')
      }
    }
    
    return email
  } catch (parseError) {
    console.error('Failed to parse email response:', textContent.text)
    throw new Error(`Failed to parse generated email: ${parseError}`)
  }
}

// =============================================================================
// LINKEDIN PACK GENERATION
// =============================================================================

/**
 * SOCIAL CONTENT PHILOSOPHY (Non-Negotiable):
 * 
 * 1. The founder's thinking stays human - AI assists with translation, not authorship
 *    - Claude translates the article's insight into conversation-starting language
 *    - The founder's voice, judgment, and intent remain the source of truth
 *    - AI outputs are drafts, not final content
 * 
 * 2. Nothing posts automatically - outputs are drafts for review
 *    - Every LinkedIn Pack is generated in 'draft' status
 *    - Founder reviews, edits, and approves before any posting
 *    - System reduces friction, not automates voice
 * 
 * 3. System reduces friction, not automates voice
 *    - The goal is to make high-quality drafts available quickly
 *    - Founder judgment remains the final step
 *    - This is internal tooling, not a growth hacking system
 * 
 * 4. Founder judgment remains the final step
 *    - All content goes through human review
 *    - Status tracking (draft → edited → posted) ensures intentional posting
 *    - No engagement bots, no auto-posting, no scraping
 * 
 * NON-GOALS:
 * - Auto-posting to LinkedIn
 * - Engagement bots or automated replies
 * - Scraping LinkedIn for metrics
 * - Growth hacking or volume optimization
 * 
 * This system supports thoughtful presence, not volume.
 */

/**
 * Generate LinkedIn Pack from a weekly article
 * 
 * This function translates the article's core insight into conversation-starting
 * LinkedIn content. It preserves the article's tension and translates it into
 * founder voice - first person, calm, direct, experienced peer.
 * 
 * CONSTRAINTS:
 * - Base ONLY on the generated article (no external knowledge)
 * - Preserve the article's core tension
 * - Avoid summarizing - translate insight into conversation language
 * - First person voice ("I've learned...", "I see this all the time...")
 * - No hashtags in body (max 2 at end, optional)
 * - Ends with open-ended question
 * - No emojis, threads, marketing CTAs, hustle language
 * 
 * If constraints cannot be met, Claude should fail loudly.
 */
export async function generateLinkedInPack(post: GeneratedPost, articleUrl?: string): Promise<LinkedInPack> {
  const articleLink = articleUrl || `https://buildbetterdaily.com/post/${post.slug}`
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `Generate a LinkedIn Pack for this weekly leadership article.

ARTICLE TITLE: "${post.title}"
ARTICLE PILLAR: ${post.pillar}
ARTICLE ARCHETYPE: ${post.archetype}
ARTICLE EXCERPT: "${post.excerpt}"

ARTICLE CONTENT (first 2000 chars for context):
${post.content.substring(0, 2000)}

LEADERSHIP TOOL:
- Question: ${post.leadershipTool.question}
- Prompt: ${post.leadershipTool.prompt}
- Action: ${post.leadershipTool.action}

══════════════════════════════════════════════════════════════════════════════
LINKEDIN PACK REQUIREMENTS (NON-NEGOTIABLE)
══════════════════════════════════════════════════════════════════════════════

1. PRIMARY LINKEDIN POST (5-8 short paragraphs):
   - First line MUST stop the scroll (hook that makes them pause)
   - Written in first person ("I've learned...", "I see this all the time...")
   - Calm, direct, experienced peer tone (not guru, not motivational)
   - NO hashtags in the body text
   - Ends with a single, open-ended question
   - Preserve the article's core tension - don't summarize, translate the insight
   - Short paragraphs that punch (one idea per paragraph)

2. ALTERNATE SHORT VERSION (3-4 paragraphs):
   - Same idea, tighter framing
   - Designed for faster consumption
   - Still first person, still ends with question

3. COMMENT SEEDING PROMPTS (3 suggestions):
   - Internal use only - prompts for the founder to post as first comment
   - Should deepen the conversation or add nuance
   - NOT scripts - these are prompts/angles

4. REPLY ANGLES (3 suggestions):
   - Example reply angles for when people engage
   - Helpful for maintaining thoughtful conversation
   - NOT scripts - these are prompts/angles

5. ARTICLE REFERENCE (optional quiet CTA):
   - One optional closing line: "I wrote more about this here → [link]"
   - Must feel optional, not promotional
   - Use the provided article link: ${articleLink}

══════════════════════════════════════════════════════════════════════════════
EXPLICITLY FORBIDDEN
══════════════════════════════════════════════════════════════════════════════

❌ Threads (multiple posts)
❌ Emojis in the post body
❌ Marketing CTAs ("Download our guide!", "Sign up now!")
❌ Hashtags in the body (max 2 optional at the very end)
❌ Hustle language ("Crush it!", "10x your business!")
❌ Generic advice ("Communicate clearly with your team")
❌ Summarizing the article (translate, don't recap)
❌ Third person voice (must be first person: "I", not "you should")

IF YOU CANNOT SATISFY ALL CONSTRAINTS, RETURN: {"error": "explanation of which constraint cannot be met"}

Respond with JSON in this EXACT format:
{
  "primaryPost": "5-8 paragraphs, first person, scroll-stopping opener, ends with question, no hashtags in body",
  "shortVersion": "3-4 paragraphs, tighter framing, same voice",
  "commentStarters": [
    "First comment prompt/angle",
    "Second comment prompt/angle",
    "Third comment prompt/angle"
  ],
  "replyAngles": [
    "First reply angle",
    "Second reply angle",
    "Third reply angle"
  ],
  "articleLink": "I wrote more about this here → ${articleLink}"
}

Return ONLY the JSON object, no other text.`
      }
    ],
    system: SYSTEM_PROMPT,
  })

  const textContent = response.content.find(block => block.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response for LinkedIn Pack')
  }

  try {
    let jsonString = textContent.text.trim()
    
    // Remove markdown code blocks if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7)
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3)
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.slice(0, -3)
    }
    jsonString = jsonString.trim()
    
    // Try to extract JSON object if there's extra text
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonString = jsonMatch[0]
    }

    let parsed
    try {
      parsed = JSON.parse(jsonString)
    } catch (jsonError) {
      console.error('LinkedIn Pack JSON parse failed. Response preview:', jsonString.substring(0, 500))
      throw new Error(`JSON parse error: ${jsonError instanceof Error ? jsonError.message : 'Unknown'}. Check server logs.`)
    }
    
    // Check for explicit failure
    if (parsed.error) {
      throw new Error(`Claude refused to generate LinkedIn Pack: ${parsed.error}`)
    }

    const pack = parsed as LinkedInPack
    
    // Validate required fields
    if (!pack.primaryPost || !pack.shortVersion || !pack.commentStarters || !pack.replyAngles) {
      throw new Error('Missing required fields in generated LinkedIn Pack')
    }
    
    // Validate arrays
    if (!Array.isArray(pack.commentStarters) || pack.commentStarters.length !== 3) {
      throw new Error('Expected exactly 3 comment starters')
    }
    
    if (!Array.isArray(pack.replyAngles) || pack.replyAngles.length !== 3) {
      throw new Error('Expected exactly 3 reply angles')
    }
    
    // Anti-pattern validation
    const antiPatterns = [
      { pattern: /🧠|💡|🚀|🔥|✨|💪|🎯/i, name: 'emojis in post' },
      { pattern: /(download our|free guide|sign up now|get started|book a call)/i, name: 'marketing CTA' },
      { pattern: /(crush it|hustle|grind|10x|outwork)/i, name: 'hustle language' },
      { pattern: /^#| #/m, name: 'hashtags in body (should be at end only)' },
      { pattern: /thread|🧵/i, name: 'thread format' },
      { pattern: /^you should|^you need to|^you must/i, name: 'third person voice (should be first person)' },
    ]
    
    const primaryPostText = pack.primaryPost.toLowerCase()
    const shortVersionText = pack.shortVersion.toLowerCase()
    
    for (const { pattern, name } of antiPatterns) {
      if (pattern.test(primaryPostText) || pattern.test(shortVersionText)) {
        throw new AntiPatternError(`Anti-pattern detected in LinkedIn Pack: ${name}. Pack rejected.`)
      }
    }
    
    // Validate first person voice (should contain "I" statements in opening paragraph)
    const firstParagraph = pack.primaryPost.trim().split('\n\n')[0] || pack.primaryPost
    if (!/\bi['\s]|\bi've|\bi see|\bi learned|\bi noticed|\bi've been|\bi was|\bi had/i.test(firstParagraph)) {
      throw new Error('Primary post must use first person voice ("I", "I\'ve", etc.) in the opening')
    }
    
    // Validate at least one version ends with question
    if (!pack.primaryPost.trim().endsWith('?') && !pack.shortVersion.trim().endsWith('?')) {
      throw new Error('At least one post version must end with a question')
    }
    
    return pack
  } catch (parseError) {
    console.error('Failed to parse LinkedIn Pack response:', textContent.text)
    throw new Error(`Failed to parse generated LinkedIn Pack: ${parseError}`)
  }
}
