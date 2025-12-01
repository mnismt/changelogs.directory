import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { UnsubscribeTerminal } from '@/components/unsubscribe/unsubscribe-terminal'

const unsubscribeSearchSchema = z.object({
	email: z.string().optional(),
})

export const Route = createFileRoute('/unsubscribe')({
	validateSearch: unsubscribeSearchSchema,
	component: UnsubscribePage,
	head: () => ({
		meta: [
			{
				title: 'unsubscribe - changelogs.directory',
			},
			{
				name: 'robots',
				content: 'noindex, nofollow',
			},
		],
	}),
})

function UnsubscribePage() {
	const { email } = Route.useSearch()

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
			<div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-500">
				{email ? (
					<UnsubscribeTerminal email={email} />
				) : (
					<div className="text-center space-y-4">
						<h1 className="text-2xl font-mono font-bold">Missing Parameter</h1>
						<p className="text-muted-foreground">
							No email address provided for unsubscription.
						</p>
					</div>
				)}
			</div>
		</div>
	)
}
