/**
 * AGENT 3: DISCIPLINE ENFORCER
 * 
 * PURPOSE:
 * Act as a strict quality gate that PASS or FAIL articles based on editorial doctrine.
 * This agent is ADVERSARIAL — its job is to catch problems, not approve content.
 * 
 * WHY SEPARATE:
 * Validation requires objectivity. When the same prompt generates AND validates,
 * it naturally wants to approve its own work. By separating the enforcer:
 * - It has no investment in the draft passing
 * - It can apply stricter standards
 * - Failures are explicit and actionable
 * 
 * FAILURE MODES IT CATCHES:
 * - Tone becomes motivational or generic
 * - Advice lacks human friction
 * - Leadership tool is weak or vague
 * - Content violates editorial doctrine
 * - Structure doesn't match declared archetype
 * - Voice drifts from Martin's style
 * 
 * INPUT: Structured draft from Editorial Architect
 * OUTPUT: JSON verdict { status: PASS | FAIL, violations: [...] }
 */

import Anthropic from '@anthropic-ai/sdk'
import type { StructuredDraft, EnforcerVerdict, Violation, ViolationType } from './types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// =============================================================================
// DISCIPLINE ENFORCER PROMPT
// =============================================================================

/**
 * System prompt for the Discipline Enforcer
 * 
 * This prompt is ADVERSARIAL by design. The enforcer's job is to find problems.
 * A good enforcer has a high rejection rate on bad content.
 */
const DISCIPLINE_ENFORCER_SYSTEM = `You are the Discipline Enforcer for Build Better Daily. Your job is to REJECT articles that violate editorial doctrine.

══════════════════════════════════════════════════════════════════════════════
YOUR ROLE
══════════════════════════════════════════════════════════════════════════════

You are a strict quality gate. You exist to CATCH problems, not to approve content.

Your default stance is SKEPTICAL. Assume the article has problems until proven otherwise.

A FAIL verdict is not a failure — it's the system working correctly.
Letting weak content through IS the failure.

══════════════════════════════════════════════════════════════════════════════
WHAT MAKES YOU FAIL AN ARTICLE
══════════════════════════════════════════════════════════════════════════════

You MUST return FAIL if ANY of these are true:

1. TONE VIOLATIONS
   - TONE_MOTIVATIONAL: Sounds like a guru or cheerleader ("You've got this!", "Crush it!")
   - TONE_GENERIC: Could have been written for any audience, not construction owners specifically
   - VOICE_DRIFT: Doesn't sound like Martin Riley (calm, direct, experienced peer)

2. ADVICE QUALITY
   - ADVICE_NO_FRICTION: Ignores human resistance, ego, or fear
   - Generic advice that anyone could give ("Communicate better with your team")
   - Solutions without acknowledging why they're hard to implement

3. LEADERSHIP TOOL PROBLEMS
   - LEADERSHIP_TOOL_WEAK: Question, prompt, or action is vague
   - LEADERSHIP_TOOL_MISSING: Section not present or incomplete
   
   WEAK EXAMPLES (must fail):
   ❌ Question: "Are we aligned?" (too vague, easy to answer "yes")
   ❌ Prompt: "Discuss how to improve" (no specificity, no forcing function)
   ❌ Action: "Think about priorities" (no owner, no deadline, no commitment)
   
   STRONG EXAMPLES (can pass):
   ✓ Question: "What's the one project we're keeping alive that should be killed?"
   ✓ Prompt: "Name the person who knows about a problem but hasn't escalated it"
   ✓ Action: "By Friday, [specific name] will cancel or renegotiate one commitment we made under pressure"

4. ANTI-PATTERN VIOLATIONS
   - ANTI_PATTERN_LISTICLE: Uses "5 tips", "7 ways", numbered list format
   - ANTI_PATTERN_OPENER: Throat-clearing intro ("In today's competitive landscape...")
   - ANTI_PATTERN_HUSTLE: Hustle/grind language ("10x", "outwork the competition")
   - ANTI_PATTERN_MARKETING: CTAs, downloads, sign-ups

5. STRUCTURE VIOLATIONS
   - STRUCTURE_VIOLATION: Missing required sections
   - PILLAR_MISMATCH: Content doesn't actually match the declared pillar
   - ARCHETYPE_MISMATCH: Article structure doesn't match the declared archetype

══════════════════════════════════════════════════════════════════════════════
HOW TO EVALUATE
══════════════════════════════════════════════════════════════════════════════

Read the article as if you're a construction owner who's seen too much generic content.

Ask yourself:
- Does this feel like it was written BY an operator, or FOR operators by a marketer?
- Is the leadership tool something I could actually use in a meeting, or is it filler?
- Does the advice acknowledge that I'll resist it, or does it assume I'll just do it?
- Does this sound like Martin Riley, or like a business content mill?

Be specific in your violations. Quote the problematic text. Suggest remediation.

══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
══════════════════════════════════════════════════════════════════════════════

Return a JSON verdict:

For PASS:
{
  "status": "PASS",
  "violations": [],
  "confidence": 85,
  "polisherNotes": "Optional suggestions for the polisher (minor improvements, not violations)"
}

For FAIL:
{
  "status": "FAIL",
  "violations": [
    {
      "type": "VIOLATION_TYPE",
      "description": "What's wrong",
      "evidence": "Quote the problematic text",
      "remediation": "How to fix it"
    }
  ],
  "confidence": 90
}

VIOLATION TYPES:
- TONE_MOTIVATIONAL
- TONE_GENERIC
- ADVICE_NO_FRICTION
- LEADERSHIP_TOOL_WEAK
- LEADERSHIP_TOOL_MISSING
- ANTI_PATTERN_LISTICLE
- ANTI_PATTERN_OPENER
- ANTI_PATTERN_HUSTLE
- ANTI_PATTERN_MARKETING
- STRUCTURE_VIOLATION
- PILLAR_MISMATCH
- ARCHETYPE_MISMATCH
- VOICE_DRIFT

══════════════════════════════════════════════════════════════════════════════
CRITICAL REMINDERS
══════════════════════════════════════════════════════════════════════════════

- You are NOT here to improve the article — just to pass or fail it
- If you're uncertain, FAIL. Weak content is more expensive than regeneration.
- Leadership Tool quality is the #1 failure point — scrutinize it closely
- Generic advice is a silent killer — catch it even when it sounds good`

// =============================================================================
// DISCIPLINE ENFORCER FUNCTION
// =============================================================================

/**
 * Evaluate a structured draft and return a pass/fail verdict
 * 
 * @param draft - The structured draft from the Editorial Architect
 * @returns Enforcer verdict with status and any violations
 */
export async function enforceEditorialStandards(draft: StructuredDraft): Promise<EnforcerVerdict> {
  
  const userPrompt = `Evaluate this article draft against Build Better Daily editorial standards.

══════════════════════════════════════════════════════════════════════════════
ARTICLE METADATA
══════════════════════════════════════════════════════════════════════════════

Title: ${draft.title}
Declared Pillar: ${draft.pillar}
Declared Archetype: ${draft.archetype}
Excerpt: ${draft.excerpt}

══════════════════════════════════════════════════════════════════════════════
LEADERSHIP TOOL (SCRUTINIZE CLOSELY)
══════════════════════════════════════════════════════════════════════════════

Question: ${draft.leadershipTool.question}
Prompt: ${draft.leadershipTool.prompt}
Action: ${draft.leadershipTool.action}

══════════════════════════════════════════════════════════════════════════════
FULL ARTICLE CONTENT
══════════════════════════════════════════════════════════════════════════════

${draft.content}

══════════════════════════════════════════════════════════════════════════════
YOUR TASK
══════════════════════════════════════════════════════════════════════════════

1. Read the article critically as a construction owner who's tired of generic content
2. Evaluate against all failure modes
3. Pay SPECIAL attention to the Leadership Tool — this is the most common failure point
4. Return your verdict as JSON

Return ONLY the JSON verdict object, no other text.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    system: DISCIPLINE_ENFORCER_SYSTEM,
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
    throw new Error('[DisciplineEnforcer] No text content in response')
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

    const verdict = JSON.parse(jsonString) as EnforcerVerdict
    
    // Validate verdict structure
    if (!verdict.status || !['PASS', 'FAIL'].includes(verdict.status)) {
      throw new Error('[DisciplineEnforcer] Invalid verdict status')
    }
    
    if (!Array.isArray(verdict.violations)) {
      verdict.violations = []
    }
    
    // If FAIL, must have violations
    if (verdict.status === 'FAIL' && verdict.violations.length === 0) {
      throw new Error('[DisciplineEnforcer] FAIL verdict must include violations')
    }
    
    // Validate violation types
    const validTypes: ViolationType[] = [
      'TONE_MOTIVATIONAL', 'TONE_GENERIC', 'ADVICE_NO_FRICTION',
      'LEADERSHIP_TOOL_WEAK', 'LEADERSHIP_TOOL_MISSING',
      'ANTI_PATTERN_LISTICLE', 'ANTI_PATTERN_OPENER', 'ANTI_PATTERN_HUSTLE',
      'ANTI_PATTERN_MARKETING', 'STRUCTURE_VIOLATION', 'PILLAR_MISMATCH',
      'ARCHETYPE_MISMATCH', 'VOICE_DRIFT'
    ]
    
    for (const violation of verdict.violations) {
      if (!validTypes.includes(violation.type)) {
        console.warn(`[DisciplineEnforcer] Unknown violation type: ${violation.type}`)
      }
    }
    
    return verdict
    
  } catch (parseError) {
    console.error('[DisciplineEnforcer] Failed to parse response:', textContent.text.substring(0, 500))
    throw new Error(`[DisciplineEnforcer] Parse failed: ${parseError}`)
  }
}

// =============================================================================
// SUPPLEMENTARY VALIDATION (REGEX-BASED)
// =============================================================================

/**
 * Additional regex-based validation as a safety net
 * 
 * This catches obvious anti-patterns that Claude might miss.
 * It's deterministic and fast — runs before/after AI enforcement.
 */
export function runRegexValidation(draft: StructuredDraft): Violation[] {
  const violations: Violation[] = []
  const content = draft.content.toLowerCase()
  
  // Anti-pattern checks
  const antiPatterns: Array<{ pattern: RegExp; type: ViolationType; description: string }> = [
    { 
      pattern: /\d+\s+(tips|ways|steps|secrets|hacks)/i, 
      type: 'ANTI_PATTERN_LISTICLE',
      description: 'Uses listicle format which is explicitly forbidden'
    },
    { 
      pattern: /in today's (competitive|fast-paced|modern|ever-changing)/i, 
      type: 'ANTI_PATTERN_OPENER',
      description: 'Uses throat-clearing opener'
    },
    { 
      pattern: /(you've got this|crush it|let's go|you can do it)/i, 
      type: 'TONE_MOTIVATIONAL',
      description: 'Uses motivational language which violates editorial tone'
    },
    { 
      pattern: /(hustle|grind|outwork|10x|double down)/i, 
      type: 'ANTI_PATTERN_HUSTLE',
      description: 'Uses hustle culture framing'
    },
    { 
      pattern: /(download our|free guide|sign up now|book a call|get started today)/i, 
      type: 'ANTI_PATTERN_MARKETING',
      description: 'Contains marketing CTA'
    },
  ]
  
  for (const { pattern, type, description } of antiPatterns) {
    const match = content.match(pattern)
    if (match) {
      violations.push({
        type,
        description,
        evidence: match[0],
        remediation: 'Remove or rewrite this phrase'
      })
    }
  }
  
  // Leadership tool checks
  const toolQuestion = draft.leadershipTool.question.toLowerCase()
  const toolPrompt = draft.leadershipTool.prompt.toLowerCase()
  const toolAction = draft.leadershipTool.action.toLowerCase()
  
  // Vague question patterns
  const vagueQuestionPatterns = [
    /^are we aligned/,
    /^how can we improve/,
    /^what should we do/,
    /^do we have/,
  ]
  
  for (const pattern of vagueQuestionPatterns) {
    if (pattern.test(toolQuestion)) {
      violations.push({
        type: 'LEADERSHIP_TOOL_WEAK',
        description: 'Leadership question is too vague to force real alignment',
        evidence: draft.leadershipTool.question,
        remediation: 'Make the question uncomfortable and specific'
      })
      break
    }
  }
  
  // Vague action patterns
  if (!toolAction.includes('by ') && !toolAction.includes('within ') && !toolAction.includes('friday') && !toolAction.includes('monday')) {
    // No deadline indicator
    if (!toolAction.match(/\b(week|day|hour|tomorrow)\b/)) {
      violations.push({
        type: 'LEADERSHIP_TOOL_WEAK',
        description: 'Leadership action lacks a clear deadline',
        evidence: draft.leadershipTool.action,
        remediation: 'Add a specific deadline (e.g., "By Friday...", "Within 7 days...")'
      })
    }
  }
  
  // Check for "someone should" vs specific ownership
  if (toolAction.match(/someone (should|needs|must|will)/i) || 
      toolAction.match(/we (should|need|must) think/i)) {
    violations.push({
      type: 'LEADERSHIP_TOOL_WEAK',
      description: 'Leadership action lacks specific ownership',
      evidence: draft.leadershipTool.action,
      remediation: 'Assign to a specific role or person (e.g., "The ops manager will...")'
    })
  }
  
  return violations
}

