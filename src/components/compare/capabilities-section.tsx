import { Check, Cloud, Globe, Laptop, Search, Terminal, X } from 'lucide-react'
import { motion } from 'motion/react'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import type { AgentCapabilities, ToolComparison } from '@/data/tool-comparison'
import { cn } from '@/lib/utils'
import { SectionHeader } from './shared/section-header'
import { ToolLogo } from './tool-logo'

interface CapabilitiesSectionProps {
	tools: ToolComparison[]
}

const capabilityLabels: Record<keyof AgentCapabilities, string> = {
	fileEdit: 'File Editing',
	terminal: 'Terminal Access',
	browser: 'Browser Control',
	mcp: 'MCP Support',
	cloudAgents: 'Cloud Agents',
	codebaseSearch: 'Codebase Search',
}

const capabilityDescriptions: Record<keyof AgentCapabilities, string> = {
	fileEdit: 'Create, edit, delete files across your project',
	terminal: 'Execute shell commands in your environment',
	browser: 'Automate browser interactions (Computer Use)',
	mcp: 'Model Context Protocol for tool integrations',
	cloudAgents: 'Execute tasks on cloud infrastructure asynchronously',
	codebaseSearch: 'Semantic search across your codebase',
}

export function CapabilitiesSection({ tools }: CapabilitiesSectionProps) {
	const capabilities = Object.keys(
		capabilityLabels,
	) as (keyof AgentCapabilities)[]

	return (
		<section className="py-12">
			<SectionHeader
				title="Agent Capabilities"
				subtitle="What each tool can actually do"
			/>

			<div className="mt-8 overflow-x-auto">
				<table className="w-full min-w-[600px] border-collapse font-mono text-sm">
					<thead>
						<tr className="border-b border-border/40">
							<th className="py-3 pr-4 text-left font-medium uppercase tracking-wider text-muted-foreground">
								Capability
							</th>
							{tools.map((tool) => (
								<th
									key={tool.slug}
									className="px-4 py-3 text-center font-medium uppercase tracking-wider text-foreground"
								>
									<div className="flex items-center justify-center gap-2">
										<ToolLogo slug={tool.slug} className="h-4 w-4" />
										{tool.slug}
									</div>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{capabilities.map((cap, index) => (
							<motion.tr
								key={cap}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.05 }}
								className="border-b border-border/20"
							>
								<td className="py-3 pr-4">
									<div className="text-foreground">{capabilityLabels[cap]}</div>
									<div className="text-xs text-muted-foreground/70">
										{capabilityDescriptions[cap]}
									</div>
								</td>
								{tools.map((tool) => (
									<td key={tool.slug} className="px-4 py-3 text-center">
										<CapabilityCell
											value={tool.capabilities[cap]}
											details={tool.capabilityDetails?.[cap]}
										/>
									</td>
								))}
							</motion.tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Capability Highlights */}
			<div className="mt-8 grid gap-4 sm:grid-cols-3">
				{tools.map((tool) => (
					<motion.div
						key={tool.slug}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="rounded border border-border/30 bg-background/20 p-4"
					>
						<div className="mb-2 flex items-center gap-2 font-mono text-sm font-bold uppercase text-foreground">
							<ToolLogo slug={tool.slug} className="h-4 w-4" />
							{tool.slug}
						</div>
						<p className="font-mono text-xs text-muted-foreground">
							{tool.categoryNotes.agents || tool.bestFor}
						</p>
					</motion.div>
				))}
			</div>
		</section>
	)
}

function CapabilityCell({
	value,
	details,
}: {
	value: string | boolean
	details?: string
}) {
	const badge = <CapabilityBadge value={value} details={!!details} />

	if (!details) return badge

	// Determine accent color based on value type for the tooltip
	const isWarning =
		value === 'agentic' ||
		value === 'preview' ||
		value === 'mcp' ||
		value === 'limited' ||
		value === 'view-only'

	return (
		<TooltipProvider delayDuration={150}>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="group relative inline-flex cursor-help items-center gap-1.5 transition-all hover:scale-[1.02] hover:opacity-100">
						{badge}
						{/* Hover Hint Indicator */}
						<div className="absolute -bottom-1 left-0 right-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-300 group-hover:scale-x-100 group-hover:opacity-100" />
						{/* Subtle Corner Indicator */}
						<div className="absolute -right-1 -top-1 h-1 w-1 rounded-full bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
					</div>
				</TooltipTrigger>
				<TooltipContent
					sideOffset={12}
					className={cn(
						'max-w-[320px] rounded-lg border border-white/10 bg-black/95 p-0 shadow-2xl backdrop-blur-xl',
						'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out',
						'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-200',
					)}
				>
					<div className="flex flex-col gap-2 p-4">
						<div className="flex items-center gap-2 border-b border-white/5 pb-2">
							<Terminal className="h-3 w-3 text-muted-foreground" />
							<span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
								Technical Detail
							</span>
						</div>
						<p className="font-sans text-sm leading-relaxed text-foreground/90">
							{details}
						</p>
					</div>
					{/* Accent Line at bottom */}
					<div
						className={cn(
							'h-0.5 w-full',
							isWarning ? 'bg-amber-500/50' : 'bg-green-500/50',
						)}
					/>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}

function CapabilityBadge({
	value,
	details,
}: {
	value: string | boolean
	details?: boolean
}) {
	if (typeof value === 'boolean') {
		return (
			<Badge
				variant={value ? 'success' : 'neutral'}
				icon={value ? Check : X}
				label={value ? 'Yes' : 'No'}
				interactive={details}
			/>
		)
	}

	// Handle Enums
	switch (value) {
		// Terminal
		case 'local':
			return (
				<Badge
					variant="success"
					icon={Terminal}
					label="Local"
					interactive={details}
				/>
			)
		// Cloud Agents
		case 'cloud':
			return (
				<Badge
					variant="success"
					icon={Cloud}
					label="Cloud"
					interactive={details}
				/>
			)
		case 'preview':
			return (
				<Badge
					variant="warning"
					icon={Cloud}
					label="Preview"
					interactive={details}
				/>
			)
		case 'hybrid':
			return (
				<Badge
					variant="success"
					icon={Terminal}
					label="Local & Cloud"
					interactive={details}
				/>
			)

		// Browser
		case 'control':
			return (
				<Badge
					variant="success"
					icon={Globe}
					label="Native"
					interactive={details}
				/>
			)
		case 'mcp':
			return (
				<Badge
					variant="warning"
					icon={Laptop}
					label="via MCP"
					interactive={details}
				/>
			)
		case 'view-only':
			return (
				<Badge
					variant="warning"
					icon={Globe}
					label="View Only"
					interactive={details}
				/>
			)

		// MCP
		case 'native':
			return (
				<Badge
					variant="success"
					icon={Laptop}
					label="Native"
					interactive={details}
				/>
			)
		case 'limited':
			return (
				<Badge
					variant="warning"
					icon={Laptop}
					label="Limited"
					interactive={details}
				/>
			)

		// Search
		case 'native-rag':
			return (
				<Badge
					variant="success"
					icon={Search}
					label="Native RAG"
					interactive={details}
				/>
			)
		case 'agentic':
			return (
				<Badge
					variant="warning"
					icon={Search}
					label="Agentic"
					interactive={details}
				/>
			)

		// None/Default
		case 'none':
			return (
				<Badge variant="neutral" icon={X} label="No" interactive={details} />
			)

		default:
			return (
				<span className="font-mono text-xs text-muted-foreground">{value}</span>
			)
	}
}

function Badge({
	variant,
	icon: Icon,
	label,
	interactive,
}: {
	variant: 'success' | 'warning' | 'neutral'
	icon: any
	label: string
	interactive?: boolean
}) {
	// Add dashed underline style to interactive badges
	const interactiveStyle = interactive
		? 'border-b border-dashed border-white/20'
		: ''

	return (
		<div
			className={cn(
				'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
				variant === 'success' && 'bg-green-500/10 text-green-400',
				variant === 'warning' && 'bg-amber-500/10 text-amber-400',
				variant === 'neutral' && 'bg-muted/10 text-muted-foreground',
			)}
		>
			<Icon className="h-3.5 w-3.5" />
			<span className={cn(interactiveStyle)}>{label}</span>
		</div>
	)
}
