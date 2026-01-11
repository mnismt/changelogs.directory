/**
 * Enrichment statistics tracking.
 *
 * Tracks success/failure rates for LLM enrichment during ingestion runs.
 */

/**
 * Stats for a single release enrichment attempt.
 */
export interface ReleaseEnrichmentStat {
	version: string
	success: boolean
	modelUsed: string | null
	circuitBreakerTriggered?: boolean
	durationMs?: number
}

/**
 * Aggregated stats for an enrichment run.
 */
export interface EnrichmentRunStats {
	total: number
	succeeded: number
	failed: number
	circuitBreakerTriggered: number
	modelUsage: Record<string, number>
	averageDurationMs: number
}

/**
 * Collector for enrichment statistics during a run.
 */
export class EnrichmentStatsCollector {
	private stats: ReleaseEnrichmentStat[] = []

	/**
	 * Record a successful enrichment.
	 */
	recordSuccess(version: string, modelUsed: string, durationMs?: number): void {
		this.stats.push({
			version,
			success: true,
			modelUsed,
			durationMs,
		})
	}

	/**
	 * Record a failed enrichment.
	 */
	recordFailure(
		version: string,
		circuitBreakerTriggered = false,
		durationMs?: number,
	): void {
		this.stats.push({
			version,
			success: false,
			modelUsed: null,
			circuitBreakerTriggered,
			durationMs,
		})
	}

	/**
	 * Get individual release stats.
	 */
	getReleaseStats(): ReleaseEnrichmentStat[] {
		return [...this.stats]
	}

	/**
	 * Get aggregated run statistics.
	 */
	getRunStats(): EnrichmentRunStats {
		const total = this.stats.length
		const succeeded = this.stats.filter((s) => s.success).length
		const failed = total - succeeded
		const circuitBreakerTriggered = this.stats.filter(
			(s) => s.circuitBreakerTriggered,
		).length

		// Count model usage
		const modelUsage: Record<string, number> = {}
		for (const stat of this.stats) {
			if (stat.modelUsed) {
				modelUsage[stat.modelUsed] = (modelUsage[stat.modelUsed] ?? 0) + 1
			}
		}

		// Calculate average duration
		const durations = this.stats
			.filter((s) => s.durationMs !== undefined)
			.map((s) => s.durationMs as number)
		const averageDurationMs =
			durations.length > 0
				? durations.reduce((a, b) => a + b, 0) / durations.length
				: 0

		return {
			total,
			succeeded,
			failed,
			circuitBreakerTriggered,
			modelUsage,
			averageDurationMs,
		}
	}

	/**
	 * Reset all stats.
	 */
	reset(): void {
		this.stats = []
	}
}
