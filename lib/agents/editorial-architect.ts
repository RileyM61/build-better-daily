/**
 * AGENT 2: EDITORIAL ARCHITECT
 * 
 * PURPOSE:
 * Transform a raw insight into a fully structured Build Better Daily article.
 * This agent applies ALL structural requirements and editorial framework.
 * 
 * WHY SEPARATE:
 * Structure application is a CONVERGENT task. It needs discipline, not creativity.
 * By receiving a raw insight (already creative), this agent can focus purely on:
 * - Selecting the right pillar and archetype
 * - Applying the mandatory article structure
 * - Crafting a strong Leadership Tool section
 * 
 * RESPONSIBILITIES:
 * - Select exactly ONE content pillar
 * - Select exactly ONE article archetype
 * - Apply the Build Better Daily article structure
 * - Create a full "Bring This to Your Leadership Meeting" section
 * - Generate appropriate book recommendations
 * 
 * INPUT: Raw insight from Insight Generator
 * OUTPUT: Fully structured draft (may still have tone issues - Enforcer will catch)
 */

import Anthropic from '@anthropic-ai/sdk'
import { CONTENT_PILLARS, ARTICLE_ARCHETYPES } from '../claude'
import type { RawInsight, StructuredDraft } from './types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// =============================================================================
// EDITORIAL ARCHITECT PROMPT
// =============================================================================

/**
 * System prompt for the Editorial Architect
 * 
 * This prompt is HEAVY on structure and constraints.
 * The creative work is done — now we need precise execution.
 */
const EDITORIAL_ARCHITECT_SYSTEM = `You are the Editorial Architect for Build Better Daily. Your job is to transform a raw insight into a precisely structured article.

══════════════════════════════════════════════════════════════════════════════
YOUR SINGLE RESPONSIBILITY
══════════════════════════════════════════════════════════════════════════════

Take the raw insight provided and architect it into a complete article that follows the Build Better Daily editorial framework EXACTLY.

You are NOT generating new ideas. You are STRUCTURING the insight you receive.

══════════════════════════════════════════════════════════════════════════════
CONTENT PILLARS — SELECT EXACTLY ONE
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
ARTICLE ARCHETYPES — SELECT EXACTLY ONE
══════════════════════════════════════════════════════════════════════════════

1. Misconception Kill Shot
   - Open by naming the false belief
   - Show why it persists (it feels true, it's comfortable)
   - Demolish it with operator reality
   - Replace it with harder truth

2. Operator Reality Check
   - Start with "Here's what actually happens..."
   - No theory, no best practices
   - Ground truth from real owners
   - Acknowledge why the easy path is tempting

3. Decision Framework
   - For recurring decisions that paralyze owners
   - Give structure, not formula
   - Include the human friction (they won't want to follow it)
   - Make it usable in a real meeting

4. Failure-Earned Insight
   - Start with a specific failure
   - No silver linings
   - Extract insight only failure teaches
   - Make them feel less alone

5. Quiet Discipline Piece
   - The unsexy habit that compounds
   - No quick wins, no hacks
   - The thing they know they should do but don't
   - Make discipline feel possible

6. Value vs Life Tension Piece
   - Acknowledge the real tradeoff
   - No false solutions
   - Navigate the tension honestly
   - Peace as starting point, not reward

══════════════════════════════════════════════════════════════════════════════
MANDATORY ARTICLE STRUCTURE — FOLLOW EXACTLY
══════════════════════════════════════════════════════════════════════════════

1. OPENING TENSION (first 3 paragraphs)
   - Name the false belief or avoided issue immediately
   - Make the reader feel seen ("this is about me")
   - NO warm-up, NO context-setting, NO "In today's..."

2. CORE INSIGHT
   - Explain why the belief persists (it's not stupidity — it's human)
   - Show how it fails in real operator conditions
   - Use specific scenarios, not abstract principles

3. REALITY LAYER
   - Include human friction: resistance, ego, fear
   - Acknowledge why the right path is hard
   - Be specific enough to be useful

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
LEADERSHIP TOOL — THIS IS THE MOST IMPORTANT SECTION
══════════════════════════════════════════════════════════════════════════════

The Leadership Tool is what makes this article usable in a real meeting.

THE QUESTION must:
- Be uncomfortable to ask out loud
- Force the team to confront something they've been avoiding
- Have no easy answer

THE PROMPT must:
- Start a conversation that reveals the real issue
- Be specific enough that everyone knows what you're asking
- Expose disagreement or misalignment

THE ACTION must:
- Be completable within 7 days
- Have a specific owner (a name, not "someone should")
- Create a forcing function for change

WEAK LEADERSHIP TOOLS (will cause rejection):
❌ "Are we aligned on our goals?" (too vague)
❌ "Discuss how we can improve" (no forcing function)
❌ "Think about what could be better" (no ownership, no deadline)

STRONG LEADERSHIP TOOLS:
✓ "What's the one project we're keeping alive that should be killed?" (uncomfortable, specific)
✓ "Name the person on this team who carries weight they shouldn't" (forces clarity)
✓ "By Friday, [Name] will cancel or renegotiate one commitment we made under pressure" (specific, owned, deadline)

══════════════════════════════════════════════════════════════════════════════
VOICE — WRITE AS MARTIN RILEY
══════════════════════════════════════════════════════════════════════════════

TONE: Calm, direct, experienced peer. Not a guru. Not motivational. Not selling hope.

SIGNATURE PHRASES (use naturally):
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
- 1000-1500 words total

══════════════════════════════════════════════════════════════════════════════
WHAT YOU MUST NOT DO
══════════════════════════════════════════════════════════════════════════════

❌ Add ideas not in the original insight
❌ Make the insight more "positive" or "balanced"
❌ Soften uncomfortable truths
❌ Use listicle format ("5 tips...")
❌ Use motivational language ("You've got this!")
❌ Use hustle framing ("Grind harder")
❌ Add marketing CTAs`

// =============================================================================
// EDITORIAL ARCHITECT FUNCTION
// =============================================================================

/**
 * Transform a raw insight into a structured article draft
 * 
 * @param insight - The raw insight from the Insight Generator
 * @returns Fully structured draft
 */
export async function architectArticle(insight: RawInsight): Promise<StructuredDraft> {
  
  const userPrompt = `Transform this raw insight into a fully structured Build Better Daily article.

══════════════════════════════════════════════════════════════════════════════
RAW INSIGHT TO ARCHITECT
══════════════════════════════════════════════════════════════════════════════

${insight.insight}

${insight.trigger ? `TRIGGER: ${insight.trigger}` : ''}
${insight.emotionalCore ? `EMOTIONAL CORE: ${insight.emotionalCore}` : ''}

══════════════════════════════════════════════════════════════════════════════
YOUR TASK
══════════════════════════════════════════════════════════════════════════════

1. Select the ONE content pillar that best fits this insight
2. Select the ONE article archetype that best structures this insight  
3. Write the full article following the mandatory structure
4. Create a STRONG Leadership Tool section (this will be validated)
5. Select 2-3 relevant books

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

══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
══════════════════════════════════════════════════════════════════════════════

Respond with a JSON object in this EXACT format:
{
  "sourceInsight": "Copy the original insight here for traceability",
  "pillar": "Exact pillar name from the list",
  "archetype": "Exact archetype name from the list",
  "title": "Compelling title that signals the core tension",
  "slug": "url-friendly-slug-with-hyphens",
  "excerpt": "2-3 sentences in Martin's voice (150-200 chars)",
  "content": "Full article in Markdown. MUST include '## Bring This to Your Leadership Meeting' section. 1000-1500 words.",
  "leadershipTool": {
    "question": "The uncomfortable alignment question",
    "prompt": "The clarity-forcing discussion starter",
    "action": "Specific 7-day action with ownership"
  },
  "books": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "asin": "ASIN",
      "description": "One sentence on why this book matters for this topic"
    }
  ]
}

Return ONLY the JSON object, no other text.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 6000,
    system: EDITORIAL_ARCHITECT_SYSTEM,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  // Parse response
  const textContent = response.content.find(block => block.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('[EditorialArchitect] No text content in response')
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
    
    // Extract JSON if there's extra text
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonString = jsonMatch[0]
    }

    const draft = JSON.parse(jsonString) as StructuredDraft
    
    // Validate required fields
    if (!draft.title || !draft.slug || !draft.content || !draft.excerpt) {
      throw new Error('[EditorialArchitect] Missing required fields')
    }
    
    // Validate pillar
    if (!draft.pillar || !CONTENT_PILLARS.includes(draft.pillar)) {
      throw new Error(`[EditorialArchitect] Invalid pillar: ${draft.pillar}`)
    }
    
    // Validate archetype
    if (!draft.archetype || !ARTICLE_ARCHETYPES.includes(draft.archetype)) {
      throw new Error(`[EditorialArchitect] Invalid archetype: ${draft.archetype}`)
    }
    
    // Validate leadership tool exists
    if (!draft.leadershipTool || 
        !draft.leadershipTool.question || 
        !draft.leadershipTool.prompt || 
        !draft.leadershipTool.action) {
      throw new Error('[EditorialArchitect] Missing or incomplete leadership tool')
    }
    
    // Validate leadership section in content
    if (!draft.content.includes('## Bring This to Your Leadership Meeting')) {
      throw new Error('[EditorialArchitect] Missing leadership meeting section in content')
    }
    
    // Validate books
    if (!Array.isArray(draft.books) || draft.books.length < 2) {
      throw new Error('[EditorialArchitect] Expected at least 2 book recommendations')
    }
    
    return draft
    
  } catch (parseError) {
    console.error('[EditorialArchitect] Failed to parse response:', textContent.text.substring(0, 500))
    throw new Error(`[EditorialArchitect] Parse failed: ${parseError}`)
  }
}

