/**
 * AGENT 1: INSIGHT GENERATOR
 * 
 * PURPOSE:
 * Generate raw, unstructured creative insight from a theme or trigger.
 * This agent operates with MAXIMUM creative freedom.
 * 
 * WHY SEPARATE:
 * Creative ideation suffers when burdened with formatting requirements.
 * By removing all structural constraints, we get richer, more authentic insights.
 * The Editorial Architect will apply structure later.
 * 
 * CONSTRAINTS (intentionally minimal):
 * - No formatting requirements
 * - No leadership tool yet
 * - No self-editing or polishing
 * - Just raw, honest observation
 * 
 * INPUT: Article theme or trigger (can be vague)
 * OUTPUT: Unstructured prose containing the core insight
 */

import Anthropic from '@anthropic-ai/sdk'
import type { RawInsight } from './types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// =============================================================================
// INSIGHT GENERATOR PROMPT
// =============================================================================

/**
 * System prompt for the Insight Generator
 * 
 * NOTE: This prompt is INTENTIONALLY sparse on structure.
 * We want divergent thinking, not template-filling.
 */
const INSIGHT_GENERATOR_SYSTEM = `You are Martin Riley's creative intuition — the part that notices patterns, feels tensions, and sees what others avoid.

YOUR ROLE: Surface a raw insight about leadership, business ownership, or operational reality for construction company owners.

YOUR AUDIENCE: Construction owners who've hit $2-10M and discovered that growth amplified their problems instead of solving them. They don't need motivation — they need truth.

YOUR MINDSET:
- You've sat across the table from hundreds of owners
- You notice what they avoid, what they pretend, what they fear
- You see the gap between what they say and what they do
- You recognize patterns that repeat across companies

WHAT MAKES A GOOD INSIGHT:
- It names something uncomfortable but true
- It reveals a tension the reader feels but hasn't articulated
- It comes from operator reality, not business theory
- It makes the reader think "this is about me"

WHAT TO AVOID:
- Generic business advice ("communicate better")
- Motivational framing ("you can do it!")
- Academic or consultant-speak
- Solutions (that comes later — just surface the tension)

OUTPUT: Write freely. No formatting. No structure. Just capture the core tension or insight in 200-400 words of unstructured prose. Think of this as a journal entry or internal monologue, not a polished piece.`

// =============================================================================
// INSIGHT GENERATION FUNCTION
// =============================================================================

/**
 * Generate a raw insight from a theme or trigger
 * 
 * @param theme - Optional theme or trigger (e.g., "pricing fear", "delegation failure")
 *                If not provided, the agent will surface its own theme.
 * @param existingTopics - Topics to avoid (for deduplication)
 * @returns Raw, unstructured insight
 */
export async function generateInsight(
  theme?: string,
  existingTopics?: string[]
): Promise<RawInsight> {
  
  // Build the user prompt
  let userPrompt = ''
  
  if (theme) {
    userPrompt = `Surface a raw insight about: "${theme}"

Write freely. No formatting. Just capture what's true about this topic for construction owners who've outgrown their systems but not their habits.`
  } else {
    userPrompt = `Surface a raw insight about something construction owners avoid, pretend about, or struggle with silently.

Think about:
- What patterns repeat across the owners you've worked with?
- What truth do they avoid until it's too late?
- What tension exists between what they want and how they behave?

Write freely. No formatting. Just capture what's true.`
  }
  
  // Add topic avoidance if provided
  if (existingTopics && existingTopics.length > 0) {
    userPrompt += `

AVOID THESE TOPICS (already covered):
${existingTopics.slice(0, 20).map(t => `- ${t}`).join('\n')}

Surface something different.`
  }
  
  // Add output format instruction
  userPrompt += `

Respond with a JSON object:
{
  "insight": "Your 200-400 word raw insight (unstructured prose)",
  "trigger": "What triggered this insight (optional, one sentence)",
  "emotionalCore": "The emotional truth this surfaces (optional, one sentence)"
}

Return ONLY the JSON object.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    system: INSIGHT_GENERATOR_SYSTEM,
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
    throw new Error('[InsightGenerator] No text content in response')
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

    const parsed = JSON.parse(jsonString) as RawInsight
    
    // Validate we got an insight
    if (!parsed.insight || parsed.insight.length < 100) {
      throw new Error('[InsightGenerator] Insight too short or missing')
    }
    
    return parsed
    
  } catch (parseError) {
    console.error('[InsightGenerator] Failed to parse response:', textContent.text)
    throw new Error(`[InsightGenerator] Parse failed: ${parseError}`)
  }
}

