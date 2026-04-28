import { useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useState } from 'react'
import type { ToolComparison } from '@/data/tool-comparison'

import type { VelocityStats } from '@/server/compare'
import { CapabilitiesSection } from './capabilities-section'
import { CompareCommandBar } from './compare-command-bar'
import type { CompareViewMode } from './compare-view-toggle'
import { CategoryWinners } from './decision/category-winners'
import { RecommendationPanel } from './decision/recommendation-panel'
import { ModelsSection } from './models-section'
import type { FilterState } from './persona-filters'
import { PricingSection } from './pricing-section'
import { SectionHeader } from './shared/section-header'
import { ToolLogo } from './tool-logo'
import { VelocitySection } from './velocity-section'

interface ComparePageProps {
	tools: ToolComparison[]
	velocityStats: VelocityStats[]
	initialFilters?: Partial<FilterState>
	initialView?: CompareViewMode
}

const defaultFilters: FilterState = {
	usage: 'daily',
	models: 'standard',
	style: undefined,
	privacy: false,
}

export function ComparePage({
	tools,
	velocityStats,
	initialFilters,
	initialView = 'decision',
}: ComparePageProps) {
	const navigate = useNavigate({ from: '/compare' })
	const [filters, setFilters] = useState<FilterState>({
		...defaultFilters,
		...initialFilters,
	})
	const [view, setView] = useState<CompareViewMode>(initialView)

	const handleFilterChange = (newFilters: FilterState) => {
		// Normalize: If usage is daily/power, force model to standard if it was free
		// (Free tier is not viable for daily/power usage)
		const normalizedFilters = { ...newFilters }
		if (
			(newFilters.usage === 'daily' || newFilters.usage === 'power') &&
			newFilters.models === 'free'
		) {
			normalizedFilters.models = 'standard'
		}

		setFilters(normalizedFilters)
		navigate({
			search: (prev) => ({
				...prev,
				usage: normalizedFilters.usage,
				models: normalizedFilters.models,
				style: normalizedFilters.style,
				privacy: normalizedFilters.privacy || undefined,
			}),
			replace: true,
			resetScroll: false,
		})
	}

	const handleViewChange = (newView: CompareViewMode) => {
		setView(newView)
		navigate({
			search: (prev) => ({
				...prev,
				view: newView,
			}),
			replace: true,
			resetScroll: false,
		})
	}

	const handleShare = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href)
		} catch {
			// Fallback for older browsers
		}
	}

	const handleCategoryClick = (category: string) => {
		handleViewChange('data')
		setTimeout(() => {
			const sectionMap: Record<string, string> = {
				cost: 'pricing',
				models: 'models',
				agents: 'capabilities',
				search: 'capabilities',
				velocity: 'velocity',
				privacy: 'capabilities',
				ux: 'capabilities',
			}
			const sectionId = sectionMap[category]
			if (sectionId) {
				document
					.querySelector(`[data-section="${sectionId}"]`)
					?.scrollIntoView({ behavior: 'smooth' })
			}
		}, 100)
	}

	return (
		<div className="relative min-h-screen">
			{/* Background Grid */}
			<div className="pointer-events-none absolute inset-0 z-0 opacity-[0.02]">
				<div
					className="absolute inset-0"
					style={{
						backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px),
                           linear-gradient(to bottom, #888 1px, transparent 1px)`,
						backgroundSize: '40px 40px',
						maskImage:
							'radial-gradient(circle at center, black 30%, transparent 80%)',
					}}
				/>
			</div>

			<div className="relative z-10 mx-auto max-w-6xl px-4 pt-20 pb-12 md:pt-32">
				{/* Hero */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="mb-8 text-center"
				>
					<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-green-400">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
						</span>
						Live Data
					</div>

					<h1 className="mb-4 font-mono text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
						Compare AI Coding Tools
					</h1>
					<p className="mx-auto max-w-2xl font-mono text-sm text-muted-foreground">
						We've tracked hundreds of releases. Here's the honest take on{' '}
						{tools.map((t) => t.slug).join(', ')}.
					</p>
				</motion.div>

				{/* Compact Tool Identity Row */}
				<div className="mb-8 flex flex-wrap justify-center gap-4">
					{tools.map((tool, index) => (
						<motion.div
							key={tool.slug}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05 }}
							className="flex items-center gap-2 rounded-full border border-border/40 bg-background/40 px-4 py-2 backdrop-blur-sm"
						>
							<ToolLogo slug={tool.slug} className="h-5 w-5" />
							<span className="font-mono text-sm font-medium uppercase text-foreground">
								{tool.slug}
							</span>
							<span className="hidden font-mono text-xs text-muted-foreground sm:inline">
								"{tool.tagline}"
							</span>
						</motion.div>
					))}
				</div>

				{/* Command Bar (Sticky) */}
				<div className="mb-8">
					<CompareCommandBar
						filters={filters}
						onFilterChange={handleFilterChange}
						view={view}
						onViewChange={handleViewChange}
						onShare={handleShare}
					/>
				</div>

				{/* Decision View */}
				{view === 'decision' && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
						className="space-y-6"
					>
						<RecommendationPanel tools={tools} filters={filters} />
						<CategoryWinners
							tools={tools}
							filters={filters}
							velocityStats={velocityStats}
							onCategoryClick={handleCategoryClick}
						/>
					</motion.div>
				)}

				{/* Data View */}
				{view === 'data' && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
					>
						<section data-section="pricing">
							<PricingSection tools={tools} filters={filters} />
						</section>

						<div className="my-16 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

						<section data-section="models">
							<ModelsSection tools={tools} filters={filters} />
						</section>

						<div className="my-16 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

						<section data-section="capabilities">
							<CapabilitiesSection tools={tools} />
						</section>

						<div className="my-16 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

						<section data-section="velocity">
							{velocityStats.length > 0 ? (
								<VelocitySection velocityStats={velocityStats} />
							) : (
								<div className="py-12">
									<SectionHeader
										title="Development Velocity"
										subtitle="Not enough release data to display velocity stats yet."
									/>
								</div>
							)}
						</section>
					</motion.div>
				)}
			</div>
		</div>
	)
}
