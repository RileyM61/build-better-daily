/**
 * MULTI-AGENT ARTICLE PIPELINE
 * 
 * This module orchestrates the four-agent editorial workflow:
 * 
 * 1. INSIGHT GENERATOR → Raw creative insight (divergent thinking)
 * 2. EDITORIAL ARCHITECT → Structured article (convergent thinking)
 * 3. DISCIPLINE ENFORCER → Pass/Fail gate (quality validation)
 * 4. FINAL POLISHER → Language refinement (only on PASS)
 * 
 * WHY MULTI-AGENT SEPARATION EXISTS:
 * 
 * Single-prompt article generation conflates four distinct cognitive tasks:
 * - Creative ideation (needs freedom)
 * - Structural enforcement (needs constraints)
 * - Quality validation (needs objectivity)
 * - Language refinement (needs preservation)
 * 
 * By separating these into agents:
 * - Each can be tuned and debugged independently
 * - The Discipline Enforcer becomes a hard gate, not a hopeful check
 * - Failures are explicit and actionable
 * - We get higher-confidence publishable articles
 * 
 * WORKFLOW LOGIC:
 * - Agents run SEQUENTIALLY (no parallel execution)
 * - If Discipline Enforcer returns FAIL → Stop workflow, return violations
 * - Only PASS articles reach the Final Polisher
 * - Pipeline can retry on failure (configurable)
 * 
 * CONSTRAINTS:
 * - No external tools or orchestrators
 * - All prompts are explicit and documented
 * - Simple orchestration over abstraction
 */

import { generateInsight } from './insight-generator'
import { architectArticle } from './editorial-architect'
import { enforceEditorialStandards, runRegexValidation } from './discipline-enforcer'
import { polishArticle } from './final-polisher'
import type { 
  PipelineResult, 
  PipelineConfig, 
  RawInsight, 
  StructuredDraft, 
  EnforcerVerdict,
  PolishedArticle,
  Violation 
} from './types'
import type { GeneratedPost } from '../claude'

// Re-export types for external use
export * from './types'
export { generateInsight } from './insight-generator'
export { architectArticle } from './editorial-architect'
export { enforceEditorialStandards, runRegexValidation } from './discipline-enforcer'
export { polishArticle } from './final-polisher'

// =============================================================================
// PIPELINE ORCHESTRATION
// =============================================================================

/**
 * Run the full multi-agent article generation pipeline
 * 
 * This is the main entry point for generating articles. It orchestrates
 * all four agents in sequence and handles failures appropriately.
 * 
 * @param theme - Optional theme or trigger for the article
 * @param config - Pipeline configuration
 * @returns Pipeline result with article or failure details
 */
export async function runArticlePipeline(
  theme?: string,
  config: PipelineConfig = {}
): Promise<PipelineResult> {
  const startTime = Date.now()
  const maxRetries = config.maxPipelineRetries ?? 2
  const existingTitles = config.existingTitles ?? []
  
  let lastViolations: Violation[] = []
  
  // Retry loop for the entire pipeline
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`MULTI-AGENT PIPELINE - ATTEMPT ${attempt}/${maxRetries}`)
    console.log('='.repeat(60))
    
    try {
      // Track timing for each agent
      const timings: {
        insightDurationMs: number
        architectDurationMs: number
        enforcerDurationMs: number
        polisherDurationMs?: number
      } = {
        insightDurationMs: 0,
        architectDurationMs: 0,
        enforcerDurationMs: 0,
      }
      
      // =========================================================================
      // AGENT 1: INSIGHT GENERATOR
      // =========================================================================
      console.log('\n[1/4] INSIGHT GENERATOR')
      console.log('─'.repeat(40))
      
      const insightStart = Date.now()
      let insight: RawInsight
      
      try {
        insight = await generateInsight(theme, existingTitles)
        timings.insightDurationMs = Date.now() - insightStart
        
        console.log(`✓ Insight generated (${timings.insightDurationMs}ms)`)
        console.log(`  Trigger: ${insight.trigger || 'none'}`)
        console.log(`  Emotional core: ${insight.emotionalCore || 'none'}`)
        console.log(`  Insight preview: ${insight.insight.substring(0, 100)}...`)
        
      } catch (error) {
        return {
          success: false,
          failure: {
            failedAt: 'INSIGHT_GENERATOR',
            reason: error instanceof Error ? error.message : 'Unknown error',
          },
          metadata: config.includeMetadata !== false ? {
            totalDurationMs: Date.now() - startTime,
            ...timings,
          } : undefined,
        }
      }
      
      // =========================================================================
      // AGENT 2: EDITORIAL ARCHITECT
      // =========================================================================
      console.log('\n[2/4] EDITORIAL ARCHITECT')
      console.log('─'.repeat(40))
      
      const architectStart = Date.now()
      let draft: StructuredDraft
      
      try {
        draft = await architectArticle(insight)
        timings.architectDurationMs = Date.now() - architectStart
        
        console.log(`✓ Draft structured (${timings.architectDurationMs}ms)`)
        console.log(`  Title: ${draft.title}`)
        console.log(`  Pillar: ${draft.pillar}`)
        console.log(`  Archetype: ${draft.archetype}`)
        console.log(`  Word count: ~${draft.content.split(/\s+/).length}`)
        
      } catch (error) {
        return {
          success: false,
          failure: {
            failedAt: 'EDITORIAL_ARCHITECT',
            reason: error instanceof Error ? error.message : 'Unknown error',
          },
          metadata: config.includeMetadata !== false ? {
            totalDurationMs: Date.now() - startTime,
            ...timings,
          } : undefined,
        }
      }
      
      // =========================================================================
      // AGENT 3: DISCIPLINE ENFORCER
      // =========================================================================
      console.log('\n[3/4] DISCIPLINE ENFORCER')
      console.log('─'.repeat(40))
      
      const enforcerStart = Date.now()
      let verdict: EnforcerVerdict
      
      try {
        // First, run regex validation (fast, deterministic)
        const regexViolations = runRegexValidation(draft)
        
        if (regexViolations.length > 0) {
          console.log(`⚠ Regex validation found ${regexViolations.length} issue(s):`)
          for (const v of regexViolations) {
            console.log(`  - ${v.type}: ${v.description}`)
          }
        }
        
        // Then, run AI enforcement
        verdict = await enforceEditorialStandards(draft)
        timings.enforcerDurationMs = Date.now() - enforcerStart
        
        // Merge regex violations into verdict
        if (regexViolations.length > 0) {
          verdict.violations = [...regexViolations, ...verdict.violations]
          if (verdict.status === 'PASS' && regexViolations.length > 0) {
            // Regex violations override AI PASS
            verdict.status = 'FAIL'
            console.log('⚠ Overriding AI PASS due to regex violations')
          }
        }
        
        console.log(`${verdict.status === 'PASS' ? '✓' : '✗'} Verdict: ${verdict.status} (${timings.enforcerDurationMs}ms)`)
        
        if (verdict.status === 'FAIL') {
          console.log(`  Violations (${verdict.violations.length}):`)
          for (const v of verdict.violations) {
            console.log(`  - [${v.type}] ${v.description}`)
            if (v.evidence) {
              console.log(`    Evidence: "${v.evidence.substring(0, 50)}..."`)
            }
          }
          
          // Store violations for potential retry feedback
          lastViolations = verdict.violations
          
          // If we have retries left, continue to next attempt
          if (attempt < maxRetries) {
            console.log(`\n→ Retrying pipeline (attempt ${attempt + 1}/${maxRetries})...`)
            continue
          }
          
          // No retries left, return failure
          return {
            success: false,
            failure: {
              failedAt: 'DISCIPLINE_ENFORCER',
              reason: `Article failed editorial standards after ${maxRetries} attempts`,
              violations: verdict.violations,
            },
            metadata: config.includeMetadata !== false ? {
              totalDurationMs: Date.now() - startTime,
              ...timings,
            } : undefined,
          }
        }
        
        if (verdict.confidence) {
          console.log(`  Confidence: ${verdict.confidence}%`)
        }
        
      } catch (error) {
        return {
          success: false,
          failure: {
            failedAt: 'DISCIPLINE_ENFORCER',
            reason: error instanceof Error ? error.message : 'Unknown error',
          },
          metadata: config.includeMetadata !== false ? {
            totalDurationMs: Date.now() - startTime,
            ...timings,
          } : undefined,
        }
      }
      
      // =========================================================================
      // AGENT 4: FINAL POLISHER
      // =========================================================================
      console.log('\n[4/4] FINAL POLISHER')
      console.log('─'.repeat(40))
      
      const polisherStart = Date.now()
      let polished: PolishedArticle
      
      try {
        polished = await polishArticle(draft, verdict.polisherNotes)
        timings.polisherDurationMs = Date.now() - polisherStart
        
        console.log(`✓ Article polished (${timings.polisherDurationMs}ms)`)
        if (polished.polishChanges && polished.polishChanges.length > 0) {
          console.log(`  Changes: ${polished.polishChanges.length}`)
          for (const change of polished.polishChanges.slice(0, 3)) {
            console.log(`  - ${change}`)
          }
          if (polished.polishChanges.length > 3) {
            console.log(`  ... and ${polished.polishChanges.length - 3} more`)
          }
        }
        
      } catch (error) {
        return {
          success: false,
          failure: {
            failedAt: 'FINAL_POLISHER',
            reason: error instanceof Error ? error.message : 'Unknown error',
          },
          metadata: config.includeMetadata !== false ? {
            totalDurationMs: Date.now() - startTime,
            ...timings,
          } : undefined,
        }
      }
      
      // =========================================================================
      // SUCCESS: Convert to GeneratedPost format
      // =========================================================================
      console.log('\n' + '='.repeat(60))
      console.log('PIPELINE COMPLETE - SUCCESS')
      console.log('='.repeat(60))
      
      const totalDuration = Date.now() - startTime
      console.log(`Total duration: ${totalDuration}ms`)
      console.log(`  Insight: ${timings.insightDurationMs}ms`)
      console.log(`  Architect: ${timings.architectDurationMs}ms`)
      console.log(`  Enforcer: ${timings.enforcerDurationMs}ms`)
      console.log(`  Polisher: ${timings.polisherDurationMs}ms`)
      
      // Convert PolishedArticle to GeneratedPost format
      const article: GeneratedPost = {
        title: polished.title,
        slug: polished.slug,
        content: polished.content,
        excerpt: polished.excerpt,
        pillar: polished.pillar,
        archetype: polished.archetype,
        leadershipTool: polished.leadershipTool,
        books: polished.books,
      }
      
      return {
        success: true,
        article,
        metadata: config.includeMetadata !== false ? {
          totalDurationMs: totalDuration,
          ...timings,
        } : undefined,
      }
      
    } catch (error) {
      // Unexpected error - don't retry, just fail
      console.error('Unexpected pipeline error:', error)
      return {
        success: false,
        failure: {
          failedAt: 'INSIGHT_GENERATOR', // Default, actual location unknown
          reason: error instanceof Error ? error.message : 'Unexpected pipeline error',
        },
        metadata: config.includeMetadata !== false ? {
          totalDurationMs: Date.now() - startTime,
          insightDurationMs: 0,
          architectDurationMs: 0,
          enforcerDurationMs: 0,
        } : undefined,
      }
    }
  }
  
  // Should not reach here, but TypeScript needs it
  return {
    success: false,
    failure: {
      failedAt: 'DISCIPLINE_ENFORCER',
      reason: `Pipeline failed after ${maxRetries} attempts`,
      violations: lastViolations,
    },
    metadata: {
      totalDurationMs: Date.now() - startTime,
      insightDurationMs: 0,
      architectDurationMs: 0,
      enforcerDurationMs: 0,
    },
  }
}

// =============================================================================
// SIMPLIFIED WRAPPER FOR BACKWARDS COMPATIBILITY
// =============================================================================

/**
 * Generate an article using the multi-agent pipeline
 * 
 * This is a drop-in replacement for the old generateBlogPost function.
 * It throws on failure to maintain backwards compatibility.
 * 
 * @param existingTitles - Titles to avoid (for deduplication)
 * @returns Generated article in GeneratedPost format
 * @throws Error if pipeline fails
 */
export async function generateArticleWithPipeline(
  existingTitles: string[] = []
): Promise<GeneratedPost> {
  const result = await runArticlePipeline(undefined, {
    existingTitles,
    maxPipelineRetries: 2,
  })
  
  if (!result.success || !result.article) {
    const reason = result.failure?.reason || 'Unknown error'
    const violations = result.failure?.violations || []
    
    let errorMessage = `Pipeline failed: ${reason}`
    if (violations.length > 0) {
      errorMessage += `\n\nViolations:\n${violations.map(v => `- [${v.type}] ${v.description}`).join('\n')}`
    }
    
    throw new Error(errorMessage)
  }
  
  return result.article
}

