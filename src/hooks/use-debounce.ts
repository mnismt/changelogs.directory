import { useEffect, useState } from 'react'

/**
 * Hook that debounces a value, delaying updates until after a specified delay
 * Useful for search inputs to reduce unnecessary re-renders and API calls
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 *
 * @example
 * const [searchQuery, setSearchQuery] = useState('')
 * const debouncedQuery = useDebounce(searchQuery, 300)
 *
 * // searchQuery updates immediately, debouncedQuery updates after 300ms
 */
export function useDebounce<T>(value: T, delay = 300): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	useEffect(() => {
		// Set up a timer to update the debounced value after the delay
		const timer = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		// Clean up the timer if value changes before delay expires
		return () => {
			clearTimeout(timer)
		}
	}, [value, delay])

	return debouncedValue
}
