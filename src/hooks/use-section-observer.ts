import { useCallback, useEffect, useState } from 'react'
import type { ChangeType } from '@/generated/prisma/client'

interface UseSectionObserverOptions {
	rootMargin?: string
	threshold?: number
}

export function useSectionObserver(
	sectionRefs: Map<ChangeType, HTMLDivElement | null>,
	options: UseSectionObserverOptions = {},
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

		return () => observer.disconnect()
	}, [sectionRefs, rootMargin, threshold])

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
