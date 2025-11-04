import type { ChangeType } from '@prisma/client'
import { useEffect, useState } from 'react'

interface ReleaseTOCProps {
	sections: Array<{
		type: ChangeType
		title: string
		count: number
	}>
}

export function ReleaseTOC({ sections }: ReleaseTOCProps) {
	const [activeSection, setActiveSection] = useState<string | null>(null)

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				// Find the first visible section
				const visibleEntry = entries.find((entry) => entry.isIntersecting)
				if (visibleEntry) {
					setActiveSection(visibleEntry.target.id)
				}
			},
			{
				rootMargin: '-100px 0px -80% 0px',
				threshold: 0,
			},
		)

		// Observe all section elements
		sections.forEach((section) => {
			const element = document.getElementById(section.type)
			if (element) {
				observer.observe(element)
			}
		})

		return () => observer.disconnect()
	}, [sections])

	const scrollToSection = (sectionId: string) => {
		const element = document.getElementById(sectionId)
		if (element) {
			const offset = 100 // Account for sticky header
			const top = element.getBoundingClientRect().top + window.scrollY - offset
			window.scrollTo({ top, behavior: 'smooth' })
		}
	}

	if (sections.length === 0) {
		return null
	}

	return (
		<aside className="hidden xl:block">
			<div className="sticky top-24 w-64">
				<nav className="space-y-1 rounded-lg border border-border bg-card p-4">
					<h3 className="mb-3 text-sm font-semibold text-foreground">
						On this page
					</h3>
					<ul className="space-y-1">
						{sections.map((section) => (
							<li key={section.type}>
								<button
									type="button"
									onClick={() => scrollToSection(section.type)}
									className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors ${
										activeSection === section.type
											? 'bg-accent text-foreground font-medium'
											: 'text-muted-foreground hover:text-foreground hover:bg-secondary'
									}`}
								>
									<span className="truncate">
										{section.title.replace(/^[^\s]+\s/, '')}
									</span>
									<span className="ml-2 shrink-0 text-xs font-mono opacity-60">
										{section.count}
									</span>
								</button>
							</li>
						))}
					</ul>
				</nav>
			</div>
		</aside>
	)
}
