import { ChevronDown } from 'lucide-react'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface CollapsibleSectionProps {
	title: string
	count: number
	defaultOpen?: boolean
	children: React.ReactNode
}

export function CollapsibleSection({
	title,
	count,
	defaultOpen = false,
	children,
}: CollapsibleSectionProps) {
	return (
		<Collapsible
			defaultOpen={defaultOpen}
			className="border-b border-border last:border-b-0"
		>
			<CollapsibleTrigger className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-foreground [&[data-state=open]>svg]:rotate-180">
				<h3 className="text-lg font-semibold">
					{title}{' '}
					<span className="font-mono text-sm text-muted-foreground">
						({count})
					</span>
				</h3>
				<ChevronDown className="h-5 w-5 transition-transform duration-200" />
			</CollapsibleTrigger>

			<CollapsibleContent className="pb-6 pt-2 space-y-3">
				{children}
			</CollapsibleContent>
		</Collapsible>
	)
}
