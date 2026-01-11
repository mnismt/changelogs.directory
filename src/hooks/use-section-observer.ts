import { useCallback, useEffect, useState } from 'react'
import type { ChangeType } from '@/generated/prisma/client'

interface UseSectionObserverOptions {
	rootMargin?: string
	threshold?: number
}

/**
 * Hook for tracking which sections are visible in the viewport using IntersectionObserver.
 * Used by the Release page Section Navigation (TOC) to highlight active and visible sections.
 *
 * @param sectionRefs - Map of ChangeType to their corresponding DOM elements
 * @param options - IntersectionObserver configuration
 * @param options.rootMargin - Margin around the viewport (default: '-20% 0px -20% 0px')
 * @param options.threshold - Visibility threshold to trigger (default: 0)
 * @param version - Optional version string to trigger re-sync when content changes
 *
 * @returns Object containing:
 *   - `activeSection`: The topmost visible section (used for active indicator)
 *   - `visibleSections`: Set of all sections currently in viewport (used for viewport bracket)
 *   - `scrollToSection`: Function to smooth scroll to a section with header offset
 *
 * @example
 * const sectionRefs = useRef<Map<ChangeType, HTMLDivElement | null>>(new Map())
 * const { activeSection, visibleSections, scrollToSection } = useSectionObserver(
 *   sectionRefs.current
 * )
 *
 * // Set refs via callback
 * const setSectionRef = (type: ChangeType) => (el: HTMLDivElement | null) => {
 *   sectionRefs.current.set(type, el)
 * }
 *
 * @see docs/reference/hooks.md for full documentation
 */
export function useSectionObserver(
	sectionRefs: Map<ChangeType, HTMLDivElement | null>,
	options: UseSectionObserverOptions = {},
	version?: string,
) {
	const { rootMargin = '-20% 0px -20% 0px', threshold = 0 } = options
	const [activeSection, setActiveSection] = useState<ChangeType | null>(null)
	const [visibleSections, setVisibleSections] = useState<Set<ChangeType>>(
		new Set(),
	)

	useEffect(() => {
		// Reset state immediately when version changes to avoid stale UI
		setActiveSection(null)
		setVisibleSections(new Set())

		// CRITICAL: Clear the refs Map to discard stale refs from previous version
		// This ensures we wait for fresh refs from the new content
		sectionRefs.clear()

		let cancelled = false
		let observer: IntersectionObserver | null = null
		let retryTimeoutId: ReturnType<typeof setTimeout> | null = null

		const setupObserver = (attempt: number) => {
			if (cancelled) {
				return
			}

			// Filter to only valid elements that are still in the DOM
			const sections = Array.from(sectionRefs.entries()).filter(
				([, el]) => el !== null && document.contains(el),
			)

			if (sections.length === 0) {
				// Retry up to 10 times with increasing delays
				if (attempt < 10) {
					const delay = attempt * 50 // 50ms, 100ms, ... up to 500ms
					retryTimeoutId = setTimeout(() => setupObserver(attempt + 1), delay)
				}
				return
			}

			const visibleSet = new Set<ChangeType>()

			observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						const sectionType = sections.find(
							([, el]) => el === entry.target,
						)?.[0]

						if (sectionType) {
							if (entry.isIntersecting) {
								visibleSet.add(sectionType)
							} else {
								visibleSet.delete(sectionType)
							}
						}
					}

					setVisibleSections(new Set(visibleSet))

					// Set active section as the first visible one (topmost)
					const sectionOrder: ChangeType[] = [
						'BREAKING',
						'SECURITY',
						'FEATURE',
						'IMPROVEMENT',
						'PERFORMANCE',
						'BUGFIX',
						'DEPRECATION',
						'DOCUMENTATION',
						'OTHER',
					]

					const firstVisible = sectionOrder.find((type) => visibleSet.has(type))
					if (firstVisible) {
						setActiveSection(firstVisible)
					}
				},
				{
					rootMargin,
					threshold: [0, 0.1],
				},
			)

			for (const [, element] of sections) {
				if (element) {
					observer.observe(element)
				}
			}
		}

		// Start first attempt after a short delay to allow React to commit
		retryTimeoutId = setTimeout(() => setupObserver(1), 50)

		return () => {
			cancelled = true
			if (retryTimeoutId) {
				clearTimeout(retryTimeoutId)
			}
			if (observer) {
				observer.disconnect()
			}
		}
	}, [sectionRefs, rootMargin, threshold, version])

	const scrollToSection = useCallback(
		(type: ChangeType) => {
			const element = sectionRefs.get(type)
			if (element) {
				const headerOffset = 120
				const elementPosition = element.getBoundingClientRect().top
				const offsetPosition =
					elementPosition + window.pageYOffset - headerOffset

				window.scrollTo({
					top: offsetPosition,
					behavior: 'smooth',
				})
			}
		},
		[sectionRefs],
	)

	return {
		activeSection,
		visibleSections,
		scrollToSection,
	}
}
