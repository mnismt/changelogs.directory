import { AlertTriangle, Filter, Mail, Tags } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FeatureCard } from './feature-card'

interface FeaturesGridProps {
	selectedFeatureId: string | null
	onSelectFeature: (id: string) => void
	className?: string
}

export const features = [
	{
		id: 'weekly-digest',
		title: 'Weekly Digest',
		description:
			'Curated weekly email with the latest releases from all tracked tools. One email, zero noise.',
		status: 'active' as const,
		icon: Mail,
		command: 'digest --weekly',
	},
	{
		id: 'breaking-alerts',
		title: 'Breaking Alerts',
		description:
			'Instant notifications when tools ship breaking changes. Never get caught off guard again.',
		status: 'coming-soon' as const,
		icon: AlertTriangle,
		command: 'watch --breaking',
	},
	{
		id: 'tool-subscriptions',
		title: 'Tool Subscriptions',
		description:
			'Subscribe to specific tools only. Get updates for the stack you actually use.',
		status: 'coming-soon' as const,
		icon: Filter,
		command: 'subscribe --tool=<slug>',
	},
	{
		id: 'release-filters',
		title: 'Release Filters',
		description:
			'Filter by release type. Features only? Bug fixes? You decide what matters.',
		status: 'coming-soon' as const,
		icon: Tags,
		command: 'filter --type=feature',
	},
]

export function FeaturesGrid({
	selectedFeatureId,
	onSelectFeature,
	className,
}: FeaturesGridProps) {
	return (
		<div className={cn('space-y-4', className)}>
			{/* Features grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{features.map((feature, index) => (
					<FeatureCard
						key={feature.id}
						{...feature}
						delay={0.6 + index * 0.1}
						isSelected={selectedFeatureId === feature.id}
						onSelect={
							feature.status === 'active'
								? () => onSelectFeature(feature.id)
								: undefined
						}
					/>
				))}
			</div>
		</div>
	)
}
