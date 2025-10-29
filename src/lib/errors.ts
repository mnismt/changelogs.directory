/**
 * Extracts a user-friendly error message from various error formats
 * Handles TanStack Start server function errors and Zod validation errors
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		// TanStack Start wraps validation errors as JSON in error.message
		try {
			const parsed = JSON.parse(error.message)
			// Array of Zod errors: [{ code, path, message }]
			if (Array.isArray(parsed) && parsed.length > 0) {
				// Return the last error message (most specific validation)
				return parsed[parsed.length - 1].message || 'Something went wrong'
			}
		} catch {
			// Not JSON, return the error message directly
			return error.message
		}
	}

	return 'Something went wrong'
}
