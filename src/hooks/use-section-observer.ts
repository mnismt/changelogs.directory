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
	const { rootMargin = '-40% 0px -40% 0px', threshold = 0 } = options
	const [activeSection, setActiveSection] = useState<ChangeType | null>(null)

	useEffect(() => {
		const sections = Array.from(sectionRefs.entries()).filter(
			([, el]) => el !== null,
		)

		if (sections.length === 0) return

		const observer = new IntersectionObserver(
			(entries) => {
				const visibleEntries = entries.filter((entry) => entry.isIntersecting)

				if (visibleEntries.length > 0) {
					const mostVisible = visibleEntries.reduce((prev, current) =>
						current.intersectionRatio > prev.intersectionRatio ? current : prev,
					)

					const sectionType = sections.find(
						([, el]) => el === mostVisible.target,
					)?.[0]

					if (sectionType) {
						setActiveSection(sectionType)
					}
				}
			},
			{
				rootMargin,
				threshold: [0, 0.25, 0.5, 0.75, 1],
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
		scrollToSection,
	}
}
