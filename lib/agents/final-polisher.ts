/**
 * AGENT 4: FINAL POLISHER
 * 
 * PURPOSE:
 * Tighten language and improve clarity on APPROVED drafts only.
 * This agent receives only PASS verdicts from the Discipline Enforcer.
 * 
 * WHY SEPARATE:
 * Polishing is a different cognitive mode than creation or validation.
 * It requires:
 * - Preservation of meaning (no new ideas)
 * - Sentence-level focus (not structural)
 * - Restraint (less is more)
 * 
 * By isolating polish as the final step:
 * - We ensure only quality content gets polished
 * - The polisher can focus purely on craft
 * - Changes are minimal and traceable
 * 
 * CONSTRAINTS:
 * - MUST NOT change meaning
 * - MUST NOT add new ideas or content
 * - MUST NOT alter structure
 * - MUST preserve the Leadership Tool exactly (or improve only word choice)
 * - Changes should be surgical, not sweeping
 * 
 * INPUT: Approved draft from Discipline Enforcer
 * OUTPUT: Polished article ready for publishing
 */

import Anthropic from '@anthropic-ai/sdk'
import type { StructuredDraft, PolishedArticle } from './types'
import { parseJsonRobust } from './types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// =============================================================================
// FINAL POLISHER PROMPT
// =============================================================================

/**
 * System prompt for the Final Polisher
 * 
 * This prompt emphasizes RESTRAINT. The article has passed validation —
 * the polisher's job is to make it sharper, not different.
 */
const FINAL_POLISHER_SYSTEM = `You are the Final Polisher for Build Better Daily. Your job is to make good writing great — without changing what it says.

══════════════════════════════════════════════════════════════════════════════
YOUR ROLE
══════════════════════════════════════════════════════════════════════════════

This article has ALREADY PASSED editorial validation. It does not need to be fixed.

Your job is to TIGHTEN and CLARIFY. That's it.

Think of yourself as a copyeditor, not a rewriter. Every change should make the sentence stronger without making it different.

══════════════════════════════════════════════════════════════════════════════
WHAT YOU CAN DO
══════════════════════════════════════════════════════════════════════════════

✓ Remove filler words ("really", "very", "just", "actually", "basically")
✓ Tighten sentences (fewer words, same meaning)
✓ Improve word choice (more precise, more vivid)
✓ Fix awkward phrasing
✓ Improve rhythm and punch
✓ Ensure consistent paragraph length (short paragraphs that punch)
✓ Strengthen the opening line if it's weak
✓ Make the close land better

══════════════════════════════════════════════════════════════════════════════
WHAT YOU MUST NOT DO
══════════════════════════════════════════════════════════════════════════════

❌ Add new ideas or content
❌ Remove sections or paragraphs
❌ Change the structure
❌ Alter the meaning of any sentence
❌ Soften strong statements
❌ Add qualifiers or hedging
❌ Change the Leadership Tool content (only word choice improvements allowed)
❌ Make the tone more formal or less direct
❌ Add transitions that feel artificial

══════════════════════════════════════════════════════════════════════════════
MARTIN'S VOICE REMINDERS
══════════════════════════════════════════════════════════════════════════════

- Short paragraphs that punch
- One idea per paragraph
- Simple words over impressive ones
- No jargon, no corporate speak
- Calm, direct, experienced peer tone
- Not preachy, not motivational

══════════════════════════════════════════════════════════════════════════════
OUTPUT
══════════════════════════════════════════════════════════════════════════════

Return the polished article in the same JSON format, with minimal changes.
Track what you changed in the "polishChanges" array so we can audit.

If the article is already tight and clear, return it as-is with minimal changes.
Less is more. Restraint is the goal.`

// =============================================================================
// FINAL POLISHER FUNCTION
// =============================================================================

/**
 * Polish an approved draft for final publication
 * 
 * @param draft - The approved draft from the Discipline Enforcer
 * @param polisherNotes - Optional notes from the Enforcer about areas to focus on
 * @returns Polished article ready for publishing
 */
export async function polishArticle(
  draft: StructuredDraft, 
  polisherNotes?: string
): Promise<PolishedArticle> {
  
  const notesSection = polisherNotes 
    ? `\n══════════════════════════════════════════════════════════════════════════════
ENFORCER NOTES (areas to consider)
══════════════════════════════════════════════════════════════════════════════

${polisherNotes}`
    : ''

  const userPrompt = `Polish this approved article for publication.

══════════════════════════════════════════════════════════════════════════════
ARTICLE TO POLISH
══════════════════════════════════════════════════════════════════════════════

Title: ${draft.title}
Slug: ${draft.slug}
Pillar: ${draft.pillar}
Archetype: ${draft.archetype}

Excerpt:
${draft.excerpt}

Leadership Tool:
- Question: ${draft.leadershipTool.question}
- Prompt: ${draft.leadershipTool.prompt}
- Action: ${draft.leadershipTool.action}

Content:
${draft.content}
${notesSection}

══════════════════════════════════════════════════════════════════════════════
YOUR TASK
══════════════════════════════════════════════════════════════════════════════

1. Read the article and identify opportunities to tighten language
2. Make surgical improvements (not sweeping rewrites)
3. Preserve meaning exactly
4. Track what you changed

Return a JSON object with these fields:
- sourceInsight: Copy the original source insight exactly (preserve it unchanged)
- pillar: "${draft.pillar}"
- archetype: "${draft.archetype}"
- title: The title (unchanged unless there's a clear typo)
- slug: "${draft.slug}"
- excerpt: The excerpt (tightened if needed)
- content: The full polished article content in Markdown
- leadershipTool: Object with question, prompt, action (unchanged or only word choice improved)
- books: The same book array provided above
- pipelineComplete: true
- polishChanges: Array of brief descriptions of changes made

If no changes are needed, return the article as-is with polishChanges: ["No changes needed - article is already tight"]

Return ONLY a valid JSON object, no other text. Ensure all string values are properly escaped for JSON (escape newlines as \\n, quotes as \\", etc).`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 6000,
    system: FINAL_POLISHER_SYSTEM,
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
    throw new Error('[FinalPolisher] No text content in response')
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

    const polished = parseJsonRobust<PolishedArticle>(jsonString, 'FinalPolisher')
    
    // Validate required fields
    if (!polished.title || !polished.slug || !polished.content || !polished.excerpt) {
      throw new Error('[FinalPolisher] Missing required fields')
    }
    
    // Ensure pipelineComplete flag is set
    polished.pipelineComplete = true
    
    // Validate leadership tool wasn't removed
    if (!polished.leadershipTool || 
        !polished.leadershipTool.question || 
        !polished.leadershipTool.prompt || 
        !polished.leadershipTool.action) {
      throw new Error('[FinalPolisher] Leadership tool was removed or corrupted')
    }
    
    // Validate leadership section still in content
    if (!polished.content.includes('## Bring This to Your Leadership Meeting')) {
      throw new Error('[FinalPolisher] Leadership meeting section was removed')
    }
    
    // Log polish changes for monitoring
    if (polished.polishChanges && polished.polishChanges.length > 0) {
      console.log('[FinalPolisher] Changes made:', polished.polishChanges)
    }
    
    return polished
    
  } catch (parseError) {
    console.error('[FinalPolisher] Failed to parse response:', textContent.text.substring(0, 500))
    throw new Error(`[FinalPolisher] Parse failed: ${parseError}`)
  }
}

