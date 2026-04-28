import {
	Check,
	Coins,
	Info,
	Key,
	Minus,
	Shield,
	Users,
	Zap,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import {
	MODELS,
	type ModelCapability,
	type ModelDefinition,
	type ModelProvider,
	type ModelTier,
} from '@/data/models'
import type { ModelAvailability, ToolComparison } from '@/data/tool-comparison'
import { cn } from '@/lib/utils'
import type { FilterState } from './persona-filters'
import { SectionHeader } from './shared/section-header'
import { ToolLogo } from './tool-logo'

interface ModelsSectionProps {
	tools: ToolComparison[]
	filters: FilterState
}

type PlanLens = 'free' | 'pro' | 'team' | 'ent'

const planOptions: { value: PlanLens; label: string }[] = [
	{ value: 'free', label: 'Free' },
	{ value: 'pro', label: 'Pro' },
	{ value: 'team', label: 'Team' },
	{ value: 'ent', label: 'Enterprise' },
]

export function ModelsSection({ tools, filters }: ModelsSectionProps) {
	const [planLens, setPlanLens] = useState<PlanLens>('pro')

	// 1. Identify relevant models based on tools and current plan lens
	// We want to show models that are supported by at least ONE tool in the current plan
	const allModelIds = new Set<string>()
	for (const tool of tools) {
		for (const m of tool.pricing.models) {
			// Check if this model is available in the selected plan
			const isAvailable = checkAvailability(m, planLens)
			if (isAvailable !== 'unavailable') {
				allModelIds.add(m.modelId)
			}
		}
	}

	// 2. Resolve to canonical definitions
	const relevantModels: ModelDefinition[] = []
	for (const id of allModelIds) {
		const def = MODELS[id]
		if (def) {
			relevantModels.push(def)
		} else {
			// Fallback for unknown models if necessary
			relevantModels.push({
				id,
				name: id,
				provider: 'Other',
				tier: 'standard', // default assumption
			})
		}
	}

	// 3. Group by Provider
	const modelsByProvider: Record<string, ModelDefinition[]> = {}
	for (const m of relevantModels) {
		if (!modelsByProvider[m.provider]) {
			modelsByProvider[m.provider] = []
		}
		modelsByProvider[m.provider].push(m)
	}

	// 4. Sort providers (Big 3 first, then others)
	const providerOrder: ModelProvider[] = [
		'Anthropic',
		'OpenAI',
		'Google',
		'DeepSeek',
		'xAI',
	]
	const sortedProviders = Object.keys(modelsByProvider).sort((a, b) => {
		const idxA = providerOrder.indexOf(a as ModelProvider)
		const idxB = providerOrder.indexOf(b as ModelProvider)
		if (idxA !== -1 && idxB !== -1) return idxA - idxB
		if (idxA !== -1) return -1
		if (idxB !== -1) return 1
		return a.localeCompare(b)
	})

	// 5. Sort models within provider by Tier (Frontier -> Free) then Name
	const tierOrder: ModelTier[] = ['frontier', 'standard', 'budget', 'free']
	for (const provider of sortedProviders) {
		modelsByProvider[provider].sort((a, b) => {
			const tierIdxA = tierOrder.indexOf(a.tier)
			const tierIdxB = tierOrder.indexOf(b.tier)
			if (tierIdxA !== tierIdxB) return tierIdxA - tierIdxB
			return a.name.localeCompare(b.name)
		})
	}

	return (
		<section className="py-12">
			<SectionHeader
				title="Model Support Matrix"
				subtitle="Which brains can you actually use?"
			/>

			{/* Controls & Legend */}
			<div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
				{/* Plan Lens Control */}
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<span className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
							Plan Context
						</span>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<Info className="h-3 w-3 text-muted-foreground/50 hover:text-foreground" />
								</TooltipTrigger>
								<TooltipContent className="max-w-xs border-white/10 bg-black/90 backdrop-blur">
									<p className="text-xs text-muted-foreground">
										Filters availability based on subscription tier. "Pro" is
										the standard paid tier ($20/mo).
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					<div className="flex flex-wrap gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
						{planOptions.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => setPlanLens(option.value)}
								className={cn(
									'rounded px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wide transition-all',
									planLens === option.value
										? 'bg-foreground text-background shadow-lg'
										: 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
								)}
							>
								{option.label}
							</button>
						))}
					</div>
				</div>

				{/* Legend */}
				<div className="flex flex-wrap gap-4 rounded border border-white/5 bg-white/[0.02] p-3 text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
					<div className="flex items-center gap-2">
						<div className="flex h-2 w-2 items-center justify-center rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
						<span>Included</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="flex h-2 w-2 items-center justify-center rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
						<span>Paid / Tokens</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="flex h-2 w-2 items-center justify-center rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
						<span>BYOK</span>
					</div>
				</div>
			</div>

			{/* Matrix Grid */}
			<div className="space-y-12">
				{sortedProviders.map((provider) => (
					<ProviderBlock
						key={provider}
						provider={provider}
						models={modelsByProvider[provider]}
						tools={tools}
						planLens={planLens}
						filters={filters}
					/>
				))}

				{sortedProviders.length === 0 && (
					<div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 p-12 text-center font-mono text-sm text-muted-foreground">
						No models found for the selected plan context.
						<br />
						Try switching to "Pro" or "BYOK".
					</div>
				)}
			</div>
		</section>
	)
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function ProviderBlock({
	provider,
	models,
	tools,
	planLens,
	filters,
}: {
	provider: string
	models: ModelDefinition[]
	tools: ToolComparison[]
	planLens: PlanLens
	filters: FilterState
}) {
	// Calculate coverage stats
	const coverageStats = tools.map((tool) => {
		const supportedCount = models.filter((m) => {
			const availability = tool.pricing.models.find((tm) => tm.modelId === m.id)
			return (
				availability &&
				checkAvailability(availability, planLens) !== 'unavailable'
			)
		}).length
		return { slug: tool.slug, count: supportedCount, total: models.length }
	})

	return (
		<div className="group/provider">
			{/* Provider Header */}
			<div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2">
				<h3 className="font-mono text-lg font-bold uppercase tracking-tight text-foreground">
					{provider}
				</h3>
				<div className="flex items-center gap-4 opacity-50 transition-opacity group-hover/provider:opacity-100">
					{coverageStats.map((stat) => (
						<div
							key={stat.slug}
							className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground"
						>
							<ToolLogo slug={stat.slug} className="h-3 w-3 opacity-70" />
							<span
								className={cn(
									stat.count > 0
										? 'text-foreground'
										: 'text-muted-foreground/50',
								)}
							>
								{stat.count}/{stat.total}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* Tiles Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{models.map((model) => (
					<ModelTile
						key={model.id}
						model={model}
						tools={tools}
						planLens={planLens}
						highlightedTier={filters.models}
					/>
				))}
			</div>
		</div>
	)
}

function ModelTile({
	model,
	tools,
	planLens,
	highlightedTier,
}: {
	model: ModelDefinition
	tools: ToolComparison[]
	planLens: PlanLens
	highlightedTier: ModelTier
}) {
	const isHighlighted = highlightedTier === model.tier
	const isTierDimmed = highlightedTier !== model.tier

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			whileInView={{ opacity: 1, scale: 1 }}
			viewport={{ once: true, margin: '-50px' }}
			className={cn(
				'group relative flex flex-col justify-between overflow-hidden rounded-lg border transition-all duration-300',
				isHighlighted
					? 'border-white/20 bg-white/[0.03] shadow-lg'
					: 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-white/[0.02]',
				isTierDimmed &&
					'opacity-70 grayscale-[0.5] hover:opacity-100 hover:grayscale-0',
			)}
		>
			{/* Header */}
			<div className="p-4">
				<div className="mb-2 flex items-start justify-between gap-2">
					<h4 className="font-mono text-sm font-bold text-foreground">
						{model.name}
					</h4>
					<TierBadge tier={model.tier} />
				</div>

				<div className="mb-4 flex flex-wrap gap-1">
					{model.contextWindow && (
						<Badge variant="outline">
							{Math.round(model.contextWindow / 1000)}k ctx
						</Badge>
					)}
					{model.capabilities?.map((cap) => (
						<CapabilityBadge key={cap} capability={cap} />
					))}
				</div>

				{model.note && (
					<p className="line-clamp-2 min-h-[2.5em] font-mono text-[10px] italic text-muted-foreground/60">
						"{model.note}"
					</p>
				)}
			</div>

			{/* Tool Strip */}
			<div className="flex divide-x divide-white/5 border-t border-white/5 bg-black/40 backdrop-blur-sm">
				{tools.map((tool) => {
					const availability = tool.pricing.models.find(
						(m) => m.modelId === model.id,
					)
					return (
						<div key={tool.slug} className="flex-1 py-2">
							<ToolStatusCell
								tool={tool}
								availability={availability}
								planLens={planLens}
							/>
						</div>
					)
				})}
			</div>
		</motion.div>
	)
}

function ToolStatusCell({
	tool,
	availability,
	planLens,
}: {
	tool: ToolComparison
	availability: ModelAvailability | undefined
	planLens: PlanLens
}) {
	const status = availability
		? checkAvailability(availability, planLens)
		: 'unavailable'

	// Status Colors & Glyphs
	const styles = {
		included: 'text-green-400',
		tokens: 'text-amber-400',
		byok: 'text-blue-400',
		unavailable: 'text-muted-foreground/20',
	}

	const glyphs = {
		included: (
			<div className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
		),
		tokens: <span className="font-mono text-[10px] font-bold">$</span>,
		byok: <Key className="h-2.5 w-2.5" />,
		unavailable: <span className="font-mono text-[10px]">—</span>,
	}

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="flex h-full w-full cursor-help flex-col items-center justify-center gap-1.5 transition-colors hover:bg-white/5">
						<ToolLogo
							slug={tool.slug}
							className={cn(
								'h-4 w-4 transition-opacity',
								status === 'unavailable' ? 'opacity-30' : 'opacity-90',
							)}
						/>
						<div
							className={cn('flex items-center justify-center', styles[status])}
						>
							{glyphs[status]}
						</div>
					</div>
				</TooltipTrigger>
				<TooltipContent
					side="bottom"
					className="w-64 border border-white/10 bg-black/95 p-0 backdrop-blur-xl"
				>
					<div className="border-b border-white/10 bg-white/5 px-3 py-2">
						<div className="flex items-center gap-2">
							<ToolLogo slug={tool.slug} className="h-4 w-4" />
							<span className="font-mono text-xs font-bold uppercase tracking-tight text-foreground">
								{tool.slug}
							</span>
							<span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
								{planLens} Lens
							</span>
						</div>
					</div>
					<div className="p-3">
						<StatusDetail
							status={status}
							availability={availability}
							planLens={planLens}
						/>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}

function StatusDetail({
	status,
	availability,
	planLens,
}: {
	status: 'included' | 'tokens' | 'byok' | 'unavailable'
	availability: ModelAvailability | undefined
	planLens: PlanLens
}) {
	if (!availability || status === 'unavailable') {
		return (
			<div className="flex items-center gap-2 text-muted-foreground">
				<Minus className="h-4 w-4" />
				<span className="text-xs">Not available on {planLens} plan</span>
			</div>
		)
	}

	return (
		<div className="space-y-3">
			{/* Primary Status */}
			<div className="flex items-center gap-2">
				{status === 'included' && <Check className="h-4 w-4 text-green-400" />}
				{status === 'tokens' && <Coins className="h-4 w-4 text-amber-400" />}
				{status === 'byok' && <Key className="h-4 w-4 text-blue-400" />}
				<span
					className={cn(
						'font-mono text-xs font-bold uppercase',
						status === 'included' && 'text-green-400',
						status === 'tokens' && 'text-amber-400',
						status === 'byok' && 'text-blue-400',
					)}
				>
					{status === 'included'
						? 'Included in Subscription'
						: status === 'tokens'
							? 'Usage Metered (Tokens)'
							: 'Bring Your Own Key'}
				</span>
			</div>

			{/* Cost Details */}
			<div className="rounded bg-white/5 p-2 font-mono text-[10px] text-muted-foreground">
				{availability.cost.type === 'tokens' && (
					<div className="space-y-1">
						<div className="flex justify-between">
							<span>Input:</span>
							<span className="text-foreground">
								${availability.cost.inputPer1M}/1M
							</span>
						</div>
						<div className="flex justify-between">
							<span>Output:</span>
							<span className="text-foreground">
								${availability.cost.outputPer1M}/1M
							</span>
						</div>
					</div>
				)}
				{availability.cost.type === 'included' && (
					<p>{availability.cost.note}</p>
				)}
				{availability.cost.type === 'byok' && (
					<p>Direct API billing via {availability.cost.note || 'Provider'}</p>
				)}
				{availability.cost.type === 'credits' && (
					<div className="flex justify-between">
						<span>Cost:</span>
						<span className="text-foreground">
							{availability.cost.amount} credits
						</span>
					</div>
				)}
			</div>

			{/* Limits / Variants */}
			{availability.variants && availability.variants.length > 0 && (
				<div className="space-y-1">
					<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
						Variants
					</span>
					{availability.variants.map((v) => (
						<div
							key={v.id}
							className="flex justify-between text-[10px] text-foreground"
						>
							<span>{v.label}</span>
							{v.limits?.contextWindow && (
								<span className="text-muted-foreground opacity-70">
									{Math.round(v.limits.contextWindow / 1000)}k
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}

// ---------------------------------------------------------------------------
// Helpers & Badges
// ---------------------------------------------------------------------------

function checkAvailability(
	availability: ModelAvailability,
	plan: PlanLens,
): 'included' | 'tokens' | 'byok' | 'unavailable' {
	const map: Record<PlanLens, keyof typeof availability.availability> = {
		free: 'free',
		pro: 'pro',
		team: 'teams',
		ent: 'enterprise',
	}
	const planSupport = availability.availability[map[plan]]

	if (!planSupport) return 'unavailable'
	if (planSupport === 'byok') return 'byok'

	// If supported (true), fall back to the model's cost type
	const costType = availability.cost.type
	if (costType === 'included' || costType === 'free' || costType === 'requests')
		return 'included'
	if (costType === 'tokens' || costType === 'credits') return 'tokens'
	if (costType === 'byok') return 'byok'

	return 'unavailable'
}

function TierBadge({ tier }: { tier: string }) {
	const colors = {
		frontier: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
		standard: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
		budget: 'border-green-500/30 text-green-400 bg-green-500/10',
		free: 'border-white/20 text-muted-foreground bg-white/5',
	}
	return (
		<span
			className={cn(
				'shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider',
				colors[tier as keyof typeof colors] || colors.free,
			)}
		>
			{tier}
		</span>
	)
}

function Badge({
	children,
	variant = 'default',
}: {
	children: React.ReactNode
	variant?: 'default' | 'outline'
}) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-medium transition-colors',
				variant === 'outline'
					? 'border border-white/10 text-muted-foreground'
					: 'bg-white/10 text-foreground',
			)}
		>
			{children}
		</span>
	)
}

function CapabilityBadge({ capability }: { capability: ModelCapability }) {
	const icons = {
		code: <Zap className="mr-1 h-3 w-3" />,
		vision: <Shield className="mr-1 h-3 w-3" />,
		thinking: <Users className="mr-1 h-3 w-3" />,
		fast: <Zap className="mr-1 h-3 w-3" />,
		'long-context': <Info className="mr-1 h-3 w-3" />,
	}

	return (
		<span className="inline-flex items-center rounded border border-white/5 bg-white/[0.02] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/70">
			{icons[capability]}
			{capability}
		</span>
	)
}
