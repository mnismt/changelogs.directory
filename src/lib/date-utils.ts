import { format, formatDistanceToNow, parseISO } from 'date-fns'

/**
 * Safely formats a date, handling both Date objects and date strings.
 * Ensures dates are parsed correctly without timezone shifts.
 * @param date - Date object or ISO date string (YYYY-MM-DD or ISO 8601)
 * @param formatStr - date-fns format string (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatDate(
	date: Date | string | null | undefined,
	formatStr: string = 'MMM d, yyyy',
): string {
	if (!date) return 'Date unknown'

	// If already a Date object, use it directly
	if (date instanceof Date) {
		// Ensure it's a valid date
		if (Number.isNaN(date.getTime())) {
			return 'Date unknown'
		}
		return format(date, formatStr)
	}

	// If it's a string, parse it properly
	if (typeof date === 'string') {
		// If it's just YYYY-MM-DD format, parse it as local date (not UTC)
		// to avoid timezone shifts that could change the date
		if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
			const [year, month, day] = date.split('-').map(Number)
			const localDate = new Date(year, month - 1, day)
			return format(localDate, formatStr)
		}

		// For ISO 8601 strings with time, use parseISO which handles timezones correctly
		try {
			const parsed = parseISO(date)
			if (Number.isNaN(parsed.getTime())) {
				return 'Date unknown'
			}
			return format(parsed, formatStr)
		} catch {
			return 'Date unknown'
		}
	}

	return 'Date unknown'
}

/**
 * Converts a date to a Date object, handling strings and Date objects safely.
 * @param date - Date object or date string
 * @returns Date object or null if invalid
 */
export function toDate(date: Date | string | null | undefined): Date | null {
	if (!date) return null

	if (date instanceof Date) {
		return Number.isNaN(date.getTime()) ? null : date
	}

	if (typeof date === 'string') {
		// If it's just YYYY-MM-DD format, parse as local date
		if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
			const [year, month, day] = date.split('-').map(Number)
			return new Date(year, month - 1, day)
		}

		// For ISO 8601 strings, use parseISO
		try {
			const parsed = parseISO(date)
			return Number.isNaN(parsed.getTime()) ? null : parsed
		} catch {
			return null
		}
	}

	return null
}

/**
 * Formats a date as relative time (e.g., "5 days ago")
 * @param date - Date object or date string
 * @returns Relative time string
 */
export function formatRelativeDate(
	date: Date | string | null | undefined,
): string {
	if (!date) return 'Date unknown'

	const dateObj = toDate(date)
	if (!dateObj) return 'Date unknown'

	return formatDistanceToNow(dateObj, { addSuffix: true })
}
