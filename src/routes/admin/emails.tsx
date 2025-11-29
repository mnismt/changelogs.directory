import { createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import { getEmailLogs } from '@/server/admin-emails'

export const Route = createFileRoute('/admin/emails')({
	loader: async () => {
		return await getEmailLogs()
	},
	component: AdminEmails,
})

function AdminEmails() {
	const logs = Route.useLoaderData()

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Email Activity</h2>
				<div className="text-sm text-neutral-400">Last 100 emails sent</div>
			</div>

			<div className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm">
						<thead className="bg-neutral-950 text-neutral-400">
							<tr>
								<th className="px-6 py-3 font-medium">Status</th>
								<th className="px-6 py-3 font-medium">To</th>
								<th className="px-6 py-3 font-medium">Subject</th>
								<th className="px-6 py-3 font-medium">Provider</th>
								<th className="px-6 py-3 font-medium">Date</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-neutral-800">
							{logs.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="px-6 py-8 text-center text-neutral-500"
									>
										No email activity found.
									</td>
								</tr>
							) : (
								logs.map(
									(log: {
										id: string
										to: string
										subject: string
										status: string
										provider: string
										error: string | null
										createdAt: Date
									}) => (
										<tr key={log.id} className="hover:bg-neutral-800/50">
											<td className="px-6 py-4">
												<span
													className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
														log.status === 'success'
															? 'bg-green-500/10 text-green-500'
															: 'bg-red-500/10 text-red-500'
													}`}
												>
													{log.status}
												</span>
												{log.error && (
													<div
														className="mt-1 text-xs text-red-400 max-w-[200px] truncate"
														title={log.error}
													>
														{log.error}
													</div>
												)}
											</td>
											<td className="px-6 py-4 text-neutral-300">{log.to}</td>
											<td className="px-6 py-4 text-neutral-300">
												{log.subject}
											</td>
											<td className="px-6 py-4 text-neutral-400 capitalize">
												{log.provider}
											</td>
											<td className="px-6 py-4 text-neutral-400 whitespace-nowrap">
												{format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
											</td>
										</tr>
									),
								)
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
