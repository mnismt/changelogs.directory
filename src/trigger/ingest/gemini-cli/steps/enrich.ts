/**
 * Phase 5: Enrich with LLM
 *
 * Re-exports the shared enrichment implementation.
 * All tools use the same resilient LLM enrichment with:
 * - Controlled concurrency (p-limit)
 * - Circuit breaker for failure protection
 * - Model fallback chain
 * - Automatic retry with exponential backoff
 */
export { enrichStep } from '@/trigger/shared/steps/enrich'
