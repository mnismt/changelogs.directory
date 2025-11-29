import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getAdminToolReleases, triggerToolIngestion } from '@/server/admin'

export const Route = createFileRoute('/admin/tools_/$slug')({
	loader: async ({ params }) => {
		return await getAdminToolReleases({ data: { slug: params.slug } })
	},
	component: AdminToolDetail,
})

function AdminToolDetail() {
	const { tool } = Route.useLoaderData()
	const router = useRouter()
	const [isTriggering, setIsTriggering] = useState(false)
	const [retryingVersion, setRetryingVersion] = useState<string | null>(null)

	const handleTriggerIngestion = async () => {
		if (!confirm('Are you sure you want to trigger ingestion for this tool?')) {
			return
		}

		setIsTriggering(true)
		try {
			await triggerToolIngestion({
				data: { toolSlug: tool.slug },
			})
			alert('Ingestion triggered successfully')
			router.invalidate()
		} catch (error) {
			console.error('Failed to trigger ingestion:', error)
			alert('Failed to trigger ingestion')
		} finally {
			setIsTriggering(false)
		}
	}

	const handleRetryVersion = async (version: string) => {
		if (
			!confirm(
				`Are you sure you want to retry ingestion for version ${version}?`,
			)
		) {
			return
		}

		setRetryingVersion(version)
		try {
			await triggerToolIngestion({
				data: { toolSlug: tool.slug, version },
			})
			alert(`Ingestion retry triggered for version ${version}`)
			router.invalidate()
		} catch (error) {
			console.error('Failed to retry version:', error)
			alert('Failed to retry version')
		} finally {
			setRetryingVersion(null)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">{tool.name}</h2>
					<p className="text-neutral-400">{tool.slug}</p>
				</div>
				<button
					onClick={handleTriggerIngestion}
					disabled={isTriggering}
					className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
				>
					{isTriggering ? 'Triggering...' : 'Trigger Ingestion'}
				</button>
			</div>

			<div className="rounded-lg border border-neutral-800 overflow-hidden">
				<table className="w-full text-left text-sm">
					<thead className="bg-neutral-900 text-neutral-400">
						<tr>
							<th className="px-4 py-3 font-medium">Version</th>
							<th className="px-4 py-3 font-medium">Date</th>
							<th className="px-4 py-3 font-medium">Content Hash</th>
							<th className="px-4 py-3 font-medium">Changes</th>
							<th className="px-4 py-3 font-medium">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-neutral-800 bg-neutral-900/50">
						{tool.releases.map((release) => (
							<tr key={release.id}>
								<td className="px-4 py-3 font-medium text-white">
									{release.version}
								</td>
								<td className="px-4 py-3 text-neutral-400">
									{release.releaseDate
										? new Date(release.releaseDate).toLocaleDateString()
										: '-'}
								</td>
								<td className="px-4 py-3 font-mono text-xs text-neutral-500">
									{release.contentHash.substring(0, 8)}...
								</td>
								<td className="px-4 py-3 text-neutral-400">
									{release._count.changes}
								</td>
								<td className="px-4 py-3">
									<button
										onClick={() => handleRetryVersion(release.version)}
										disabled={retryingVersion === release.version}
										className="text-blue-500 hover:text-blue-400 disabled:opacity-50"
									>
										{retryingVersion === release.version
											? 'Retrying...'
											: 'Retry'}
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
