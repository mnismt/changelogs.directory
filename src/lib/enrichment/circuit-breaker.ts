/**
 * Circuit Breaker for LLM calls
 *
 * Prevents cascading failures by tracking consecutive errors and
 * short-circuiting calls when a threshold is exceeded.
 *
 * Use case: When the LLM API is down or rate-limited, stop hammering it
 * and fall back to keyword-based classification for remaining releases.
 */

export interface CircuitBreakerConfig {
	/** Number of consecutive failures before opening the circuit */
	failureThreshold: number
	/** Optional: auto-reset circuit after this many milliseconds */
	resetAfterMs?: number
}

export interface CircuitBreakerStats {
	consecutiveFailures: number
	isOpen: boolean
	totalFailures: number
	totalSuccesses: number
}

export class CircuitBreaker {
	private consecutiveFailures = 0
	private totalFailures = 0
	private totalSuccesses = 0
	private isOpen = false
	private openedAt?: number

	constructor(private config: CircuitBreakerConfig = { failureThreshold: 3 }) {}

	/**
	 * Record a successful call. Resets consecutive failure count and closes circuit.
	 */
	recordSuccess(): void {
		this.consecutiveFailures = 0
		this.totalSuccesses++
		this.isOpen = false
	}

	/**
	 * Record a failed call. Opens circuit if threshold is exceeded.
	 */
	recordFailure(): void {
		this.consecutiveFailures++
		this.totalFailures++

		if (this.consecutiveFailures >= this.config.failureThreshold) {
			this.isOpen = true
			this.openedAt = Date.now()
		}
	}

	/**
	 * Check if calls should be skipped (circuit is open).
	 * Respects optional auto-reset timeout.
	 */
	shouldSkip(): boolean {
		if (!this.isOpen) return false

		// Optional: auto-reset after timeout
		if (this.config.resetAfterMs && this.openedAt) {
			if (Date.now() - this.openedAt > this.config.resetAfterMs) {
				this.isOpen = false
				this.consecutiveFailures = 0
				return false
			}
		}

		return true
	}

	/**
	 * Get current circuit breaker statistics.
	 */
	getStats(): CircuitBreakerStats {
		return {
			consecutiveFailures: this.consecutiveFailures,
			isOpen: this.isOpen,
			totalFailures: this.totalFailures,
			totalSuccesses: this.totalSuccesses,
		}
	}

	/**
	 * Reset the circuit breaker to initial state.
	 */
	reset(): void {
		this.consecutiveFailures = 0
		this.totalFailures = 0
		this.totalSuccesses = 0
		this.isOpen = false
		this.openedAt = undefined
	}
}

/**
 * Default circuit breaker configuration.
 * Opens after 3 consecutive failures.
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
	failureThreshold: 3,
}
