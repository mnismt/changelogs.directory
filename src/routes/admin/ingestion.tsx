import { createFileRoute } from '@tanstack/react-router'
import { getAdminIngestionLogs } from '@/server/admin'

export const Route = createFileRoute('/admin/ingestion')({
	loader: async () => {
		return await getAdminIngestionLogs()
	},
	component: AdminIngestion,
})

function AdminIngestion() {
	const { logs } = Route.useLoaderData()

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Ingestion Logs</h2>
				<button className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200">
					Trigger All
				</button>
			</div>

			<div className="rounded-lg border border-neutral-800 overflow-hidden">
				<table className="w-full text-left text-sm">
					<thead className="bg-neutral-900 text-neutral-400">
						<tr>
							<th className="px-4 py-3 font-medium">Tool</th>
							<th className="px-4 py-3 font-medium">Status</th>
							<th className="px-4 py-3 font-medium">Started</th>
							<th className="px-4 py-3 font-medium">Duration</th>
							<th className="px-4 py-3 font-medium">New Releases</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-neutral-800 bg-neutral-900/50">
						{logs.map((log) => (
							<tr key={log.id}>
								<td className="px-4 py-3">{log.tool.name}</td>
								<td className="px-4 py-3">
									<span
										className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
											log.status === 'SUCCESS'
												? 'bg-green-500/10 text-green-500'
												: log.status === 'FAILED'
													? 'bg-red-500/10 text-red-500'
													: 'bg-yellow-500/10 text-yellow-500'
										}`}
									>
										{log.status}
									</span>
								</td>
								<td className="px-4 py-3">
									{new Date(log.startedAt).toLocaleString()}
								</td>
								<td className="px-4 py-3">
									{log.duration ? `${log.duration}ms` : '-'}
								</td>
								<td className="px-4 py-3">{log.releasesNew}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
