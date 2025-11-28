import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/emails')({
	component: AdminEmails,
})

function AdminEmails() {
	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold">Email Activity</h2>
			<div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6 text-center text-neutral-400">
				<p>Email activity tracking coming soon.</p>
			</div>
		</div>
	)
}
