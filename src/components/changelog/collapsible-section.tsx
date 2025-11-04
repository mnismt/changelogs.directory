import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'

interface CollapsibleSectionProps {
	title: string
	count: number
	value: string
	children: React.ReactNode
}

export function CollapsibleSection({
	title,
	count,
	value,
	children,
}: CollapsibleSectionProps) {
	return (
		<AccordionItem
			id={value}
			value={value}
			className="border-b border-border last:border-b-0 scroll-mt-24"
		>
			<AccordionTrigger className="py-4 text-left transition-colors hover:text-foreground cursor-pointer">
				<h3 className="text-lg font-semibold">
					{title}{' '}
					<span className="font-mono text-sm text-muted-foreground">
						({count})
					</span>
				</h3>
			</AccordionTrigger>

			<AccordionContent className="pb-6 pt-2 space-y-3">
				{children}
			</AccordionContent>
		</AccordionItem>
	)
}
