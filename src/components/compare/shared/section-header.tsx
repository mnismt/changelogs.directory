import { cn } from '@/lib/utils'

interface SectionHeaderProps {
	title: string
	subtitle?: string
	className?: string
}

export function SectionHeader({
	title,
	subtitle,
	className,
}: SectionHeaderProps) {
	return (
		<div className={cn('mb-8 text-center', className)}>
			<h2 className="font-mono text-2xl font-bold tracking-tight uppercase text-foreground sm:text-3xl">
				{title}
			</h2>
			{subtitle && (
				<p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
					{subtitle}
				</p>
			)}
			<div className="mx-auto mt-4 h-1 w-20 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
		</div>
	)
}
