import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
	title: string
	value: string | number
	description?: string
	icon?: React.ReactNode
	trend?: {
		value: number
		isPositive: boolean
	}
	className?: string
}

export function StatsCard({
	title,
	value,
	description,
	icon,
	trend,
	className,
}: StatsCardProps) {
	return (
		<Card className={cn('border-border bg-card', className)}>
			<CardContent className="p-6">
				<div className="flex items-start justify-between">
					<div className="space-y-2">
						<p className="text-muted-foreground text-sm">{title}</p>
						<p className="font-mono text-3xl font-semibold">{value}</p>
						{description && (
							<p className="text-muted-foreground text-xs">{description}</p>
						)}
						{trend && (
							<p
								className={cn(
									'font-mono text-xs',
									trend.isPositive
										? 'text-foreground'
										: 'text-muted-foreground',
								)}
							>
								{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
							</p>
						)}
					</div>
					{icon && <div className="text-muted-foreground">{icon}</div>}
				</div>
			</CardContent>
		</Card>
	)
}
