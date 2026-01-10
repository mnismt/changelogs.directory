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
		const sections = Array.from(sectionRefs.entries()).filter(
			([, el]) => el !== null,
		)

		if (sections.length === 0) return

		const visibleSet = new Set<ChangeType>()

		const observer = new IntersectionObserver(
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

		return () => {
			// Properly cleanup by unobserving all elements
			for (const [, element] of sections) {
				if (element) {
					observer.unobserve(element)
				}
			}
			observer.disconnect()
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
