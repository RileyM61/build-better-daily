/**
 * MULTI-AGENT EDITORIAL PIPELINE - Shared Types
 * 
 * WHY MULTI-AGENT SEPARATION EXISTS:
 * 
 * Single-prompt article generation fails because it conflates four distinct cognitive tasks:
 * 1. Creative ideation (divergent thinking - needs freedom)
 * 2. Structural enforcement (convergent thinking - needs constraints)
 * 3. Quality validation (binary judgment - needs objectivity)
 * 4. Language refinement (polish - needs preservation)
 * 
 * When one prompt handles all four, you get:
 * - Tone drift (creative freedom bleeds into structure)
 * - Weak leadership tools (validation happens too late)
 * - Generic advice (enforcer has no teeth)
 * 
 * By separating agents, each can be tuned, debugged, and evolved independently.
 * The Discipline Enforcer becomes a hard gate, not a hopeful check.
 */

import type { ContentPillar, ArticleArchetype, LeadershipTool, GeneratedPost } from '../claude'

// =============================================================================
// AGENT 1: INSIGHT GENERATOR OUTPUT
// =============================================================================

/**
 * Raw insight from the Insight Generator
 * 
 * This is UNSTRUCTURED creative output. No formatting requirements.
 * The goal is to capture the core tension or insight without editorial overhead.
 * 
 * Think of this as the "napkin sketch" before architecture.
 */
export interface RawInsight {
  /** The core tension, observation, or insight (unstructured prose) */
  insight: string
  
  /** Optional: what triggered this insight (theme, observation, pattern) */
  trigger?: string
  
  /** Optional: the emotional truth this insight surfaces */
  emotionalCore?: string
}

// =============================================================================
// AGENT 2: EDITORIAL ARCHITECT OUTPUT
// =============================================================================

/**
 * Structured draft from the Editorial Architect
 * 
 * This is the first STRUCTURED output. The architect has:
 * - Selected exactly ONE content pillar
 * - Selected exactly ONE article archetype
 * - Applied the Build Better Daily article structure
 * - Created a full Leadership Tool section
 * 
 * This draft may still have tone issues or weak spots - that's for the Enforcer.
 */
export interface StructuredDraft {
  /** The raw insight this draft is based on (for traceability) */
  sourceInsight: string
  
  /** Selected content pillar (exactly one) */
  pillar: ContentPillar
  
  /** Selected article archetype (exactly one) */
  archetype: ArticleArchetype
  
  /** Article title */
  title: string
  
  /** URL-friendly slug */
  slug: string
  
  /** 2-3 sentence excerpt in Martin's voice */
  excerpt: string
  
  /** Full article content in Markdown */
  content: string
  
  /** The leadership meeting tool (mandatory) */
  leadershipTool: LeadershipTool
  
  /** Book recommendations (2-3) */
  books: Array<{
    title: string
    author: string
    asin: string
    description: string
  }>
}

// =============================================================================
// AGENT 3: DISCIPLINE ENFORCER OUTPUT
// =============================================================================

/**
 * Violation categories for the Discipline Enforcer
 * 
 * These are the specific failure modes we're catching.
 * Each violation type has different remediation strategies.
 */
export type ViolationType = 
  | 'TONE_MOTIVATIONAL'           // Sounds like a guru or cheerleader
  | 'TONE_GENERIC'                // Could have been written for any audience
  | 'ADVICE_NO_FRICTION'          // Ignores human resistance
  | 'LEADERSHIP_TOOL_WEAK'        // Question/prompt/action are vague
  | 'LEADERSHIP_TOOL_MISSING'     // Section not present
  | 'ANTI_PATTERN_LISTICLE'       // "5 tips" format
  | 'ANTI_PATTERN_OPENER'         // Throat-clearing opener
  | 'ANTI_PATTERN_HUSTLE'         // Hustle/grind language
  | 'ANTI_PATTERN_MARKETING'      // CTAs, downloads, sign-ups
  | 'STRUCTURE_VIOLATION'         // Missing required sections
  | 'PILLAR_MISMATCH'             // Content doesn't match declared pillar
  | 'ARCHETYPE_MISMATCH'          // Structure doesn't match declared archetype
  | 'VOICE_DRIFT'                 // Doesn't sound like Martin

/**
 * A specific violation with context
 */
export interface Violation {
  /** The type of violation */
  type: ViolationType
  
  /** Human-readable description of the violation */
  description: string
  
  /** The specific text or section that violates (for debugging) */
  evidence?: string
  
  /** Suggested remediation */
  remediation?: string
}

/**
 * Discipline Enforcer verdict
 * 
 * This is a BINARY gate. PASS means the article can proceed to polish.
 * FAIL means the article must be regenerated (not patched).
 * 
 * We don't retry with feedback at this stage - we fail loudly.
 * The cost of a weak article is higher than the cost of regeneration.
 */
export interface EnforcerVerdict {
  /** Binary pass/fail status */
  status: 'PASS' | 'FAIL'
  
  /** Empty if PASS, contains specific issues if FAIL */
  violations: Violation[]
  
  /** Overall confidence score (0-100) - for monitoring, not gating */
  confidence?: number
  
  /** Optional notes for the polisher (if PASS) */
  polisherNotes?: string
}

// =============================================================================
// AGENT 4: FINAL POLISHER OUTPUT
// =============================================================================

/**
 * Final polished output from the Final Polisher
 * 
 * This is the FINAL output, ready for publishing.
 * The polisher ONLY tightens language and improves clarity.
 * It MUST NOT change meaning, add ideas, or alter structure.
 * 
 * This output should be directly usable as a GeneratedPost.
 */
export interface PolishedArticle extends StructuredDraft {
  /** Flag indicating this passed through the full pipeline */
  pipelineComplete: true
  
  /** Changes made by the polisher (for audit trail) */
  polishChanges?: string[]
}

// =============================================================================
// PIPELINE TYPES
// =============================================================================

/**
 * Pipeline execution result
 * 
 * Contains the final output OR the failure reason.
 * This allows the caller to handle failures appropriately.
 */
export interface PipelineResult {
  /** Whether the pipeline completed successfully */
  success: boolean
  
  /** The final article (only if success=true) */
  article?: GeneratedPost
  
  /** Failure details (only if success=false) */
  failure?: {
    /** Which agent failed */
    failedAt: 'INSIGHT_GENERATOR' | 'EDITORIAL_ARCHITECT' | 'DISCIPLINE_ENFORCER' | 'FINAL_POLISHER'
    
    /** Why it failed */
    reason: string
    
    /** Violations if from Enforcer */
    violations?: Violation[]
  }
  
  /** Execution metadata for monitoring */
  metadata?: {
    totalDurationMs: number
    insightDurationMs: number
    architectDurationMs: number
    enforcerDurationMs: number
    polisherDurationMs?: number
  }
}

/**
 * Pipeline configuration
 * 
 * Allows tuning of the pipeline behavior without code changes.
 */
export interface PipelineConfig {
  /** Maximum retries for the entire pipeline (default: 2) */
  maxPipelineRetries?: number
  
  /** Whether to include execution metadata (default: true) */
  includeMetadata?: boolean
  
  /** Model to use for agents (default: claude-sonnet-4-5-20250929) */
  model?: string
  
  /** Existing titles to avoid (for topic deduplication) */
  existingTitles?: string[]
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Robustly parse JSON from LLM responses
 * 
 * LLMs sometimes produce JSON with unescaped control characters inside string
 * values. This function attempts to parse JSON normally first, then falls back
 * to sanitizing control characters if needed.
 * 
 * @param jsonString - The JSON string to parse
 * @param agentName - Name of the calling agent for logging
 * @returns Parsed JSON object
 * @throws Error if parsing fails even after sanitization
 */
export function parseJsonRobust<T>(jsonString: string, agentName: string): T {
  // First attempt: try normal parsing
  try {
    return JSON.parse(jsonString)
  } catch (firstError) {
    console.log(`[${agentName}] First parse failed, attempting to sanitize control characters...`)
    
    // Sanitize control characters inside JSON string values only
    // The regex matches double-quoted strings and escapes control chars within them
    const sanitized = jsonString.replace(
      /"(?:[^"\\]|\\.)*"/g,
      (match) => match
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove other control chars
    )
    
    try {
      const result = JSON.parse(sanitized)
      console.log(`[${agentName}] Sanitization successful`)
      return result
    } catch {
      // If still failing, log detail and rethrow original error
      console.error(`[${agentName}] Sanitization failed. Original error:`, firstError)
      throw firstError
    }
  }
}

