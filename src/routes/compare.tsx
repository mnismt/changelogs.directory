import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useState } from 'react'
import { CompareMobile } from '@/components/compare/compare-mobile'
import {
	type CompareView,
	CompareViewToggle,
} from '@/components/compare/compare-view-toggle'
import { CompareHoverProvider } from '@/components/compare/hover-context'
import { PlansCard } from '@/components/compare/plans-card'
import { PlansTable } from '@/components/compare/plans-table'
import { TOOL_PLANS } from '@/data/tool-plans'

export const Route = createFileRoute('/compare')({
	component: ComparePage,
})

function ComparePage() {
	const official = TOOL_PLANS.filter((g) => g.bucket === 'official')
	const harnesses = TOOL_PLANS.filter((g) => g.bucket === 'harness')
	const [view, setView] = useState<CompareView>('cards')

	return (
		<CompareHoverProvider>
			<div className="relative min-h-[calc(100vh-14rem)] px-4 py-16 [padding-bottom:calc(7rem+env(safe-area-inset-bottom))] sm:py-20 sm:[padding-bottom:calc(7rem+env(safe-area-inset-bottom))] md:[padding-bottom:5rem]">
				<div className="mx-auto max-w-7xl">
					<motion.div
						initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
						animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
						transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
						className="mb-14 text-center"
					>
						<h1 className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
							Coding plans, all in one place.
						</h1>
						<p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
							Every paid tier and free option for the AI coding tools we track.
							Last verified May 2026.
						</p>
					</motion.div>

					{/* Desktop: card grid or alignable table, same data (>= md). */}
					<div className="hidden md:block">
						<div className="mb-8 flex justify-center">
							<CompareViewToggle value={view} onChange={setView} />
						</div>

						{view === 'cards' ? (
							<>
								<Section
									title="Official providers"
									description="CLIs from the model vendor — Anthropic, OpenAI, Google."
									groups={official}
									indexOffset={0}
								/>

								<div className="h-14" />

								<Section
									title="Harnesses"
									description="IDEs and agents that route to multiple model providers."
									groups={harnesses}
									indexOffset={official.length}
								/>
							</>
						) : (
							<PlansTable official={official} harness={harnesses} />
						)}
					</div>

					{/* Mobile: native row list + drill-down bottom sheet (< md). */}
					<CompareMobile official={official} harness={harnesses} />
				</div>
			</div>
		</CompareHoverProvider>
	)
}

function Section({
	title,
	description,
	groups,
	indexOffset,
}: {
	title: string
	description: string
	groups: typeof TOOL_PLANS
	indexOffset: number
}) {
	return (
		<section>
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
				className="mb-6 flex flex-col gap-1"
			>
				<h2 className="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">
					{title}
				</h2>
				<p className="text-sm text-muted-foreground">{description}</p>
			</motion.div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{groups.map((group, i) => (
					<motion.div
						key={group.slug}
						initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
						animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
						transition={{
							duration: 0.5,
							delay: 0.15 + (indexOffset + i) * 0.06,
							ease: [0.22, 1, 0.36, 1],
						}}
					>
						<PlansCard group={group} />
					</motion.div>
				))}
			</div>
		</section>
	)
}
