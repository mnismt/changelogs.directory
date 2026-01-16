import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { format } from 'date-fns'
import { Eye, Loader2, Send, X } from 'lucide-react'
import { useState } from 'react'
import {
	getDigestLogs,
	getDigestPreviewData,
	getDigestStats,
	sendTestDigest,
} from '@/server/digest'

export const Route = createFileRoute('/admin/digests')({
	loader: async () => {
		const [logs, stats, preview] = await Promise.all([
			getDigestLogs({ data: { limit: 20 } }),
			getDigestStats(),
			getDigestPreviewData(),
		])
		return { logs, stats, preview }
	},
	component: AdminDigests,
})

function StatusBadge({ status }: { status: string }) {
	const colors: Record<string, string> = {
		COMPLETED: 'bg-green-500/10 text-green-500',
		PARTIAL: 'bg-yellow-500/10 text-yellow-500',
		FAILED: 'bg-red-500/10 text-red-500',
		IN_PROGRESS: 'bg-blue-500/10 text-blue-500',
		PENDING: 'bg-neutral-500/10 text-neutral-500',
		SKIPPED: 'bg-neutral-500/10 text-neutral-400',
	}

	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${colors[status] || colors.PENDING}`}
		>
			{status}
		</span>
	)
}

function PreviewModal({
	html,
	onClose,
}: {
	html: string
	onClose: () => void
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
			<div className="relative h-[90vh] w-full max-w-2xl rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl">
				<div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
					<h3 className="font-medium text-neutral-200">Email Preview</h3>
					<button
						type="button"
						onClick={onClose}
						className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
				<div className="h-[calc(90vh-56px)] overflow-auto bg-white">
					<iframe
						srcDoc={html}
						title="Email Preview"
						className="h-full w-full border-0"
						sandbox="allow-same-origin"
					/>
				</div>
			</div>
		</div>
	)
}

function AdminDigests() {
	const { logs, stats, preview } = Route.useLoaderData()
	const [showPreview, setShowPreview] = useState(false)
	const [showTests, setShowTests] = useState(false)
	const [testEmail, setTestEmail] = useState('')
	const [isSending, setIsSending] = useState(false)
	const [sendResult, setSendResult] = useState<{
		success: boolean
		message: string
	} | null>(null)

	const sendTest = useServerFn(sendTestDigest)
	const fetchLogs = useServerFn(getDigestLogs)
	const [displayLogs, setDisplayLogs] = useState(logs)
	const [isLoadingLogs, setIsLoadingLogs] = useState(false)

	const handleToggleTests = async () => {
		const newShowTests = !showTests
		setShowTests(newShowTests)
		setIsLoadingLogs(true)
		try {
			const newLogs = await fetchLogs({
				data: { limit: 20, includeTests: newShowTests },
			})
			setDisplayLogs(newLogs)
		} finally {
			setIsLoadingLogs(false)
		}
	}

	const handleSendTest = async () => {
		if (!testEmail) return
		setIsSending(true)
		setSendResult(null)
		try {
			const result = await sendTest({ data: { email: testEmail } })
			setSendResult(result)
		} catch (error) {
			setSendResult({
				success: false,
				message: error instanceof Error ? error.message : 'Failed to send',
			})
		} finally {
			setIsSending(false)
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Weekly Digest</h2>
					<div className="text-sm text-neutral-400">
						Automated email digest sent every Monday at 9 AM UTC
					</div>
				</div>
				<Link
					to="/admin/emails"
					className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
				>
					View All Emails
				</Link>
			</div>

			{/* Preview & Test Card */}
			<div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h3 className="font-medium text-neutral-200">Preview & Test</h3>
						<p className="text-sm text-neutral-400">
							Preview the digest email with real data from the last 7 days
						</p>
					</div>
					<div className="flex items-center gap-4 text-sm">
						<div className="text-neutral-400">
							<span className="font-mono text-green-500">
								{preview.totalReleases}
							</span>{' '}
							releases
						</div>
						<div className="text-neutral-400">
							<span className="font-mono text-cyan-500">
								{preview.totalTools}
							</span>{' '}
							tools
						</div>
						<div className="text-neutral-500">{preview.periodLabel}</div>
					</div>
				</div>

				{preview.hasReleases ? (
					<div className="flex flex-wrap items-end gap-4">
						<button
							type="button"
							onClick={() => setShowPreview(true)}
							className="inline-flex items-center gap-2 rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
						>
							<Eye className="h-4 w-4" />
							Preview Email
						</button>

						<div className="flex items-center gap-2">
							<input
								type="email"
								placeholder="your@email.com"
								value={testEmail}
								onChange={(e) => setTestEmail(e.target.value)}
								className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
							/>
							<button
								type="button"
								onClick={handleSendTest}
								disabled={!testEmail || isSending}
								className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isSending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Send className="h-4 w-4" />
								)}
								Send Test
							</button>
						</div>

						{sendResult && (
							<div
								className={`text-sm ${sendResult.success ? 'text-green-500' : 'text-red-500'}`}
							>
								{sendResult.message}
							</div>
						)}
					</div>
				) : (
					<div className="rounded-md border border-neutral-700 bg-neutral-800/50 px-4 py-3 text-sm text-neutral-400">
						No releases in the last 7 days. The digest would be skipped.
					</div>
				)}
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-4 gap-4">
				<div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
					<div className="text-sm text-neutral-400">Active Subscribers</div>
					<div className="mt-1 text-2xl font-bold text-green-500">
						{stats.activeSubscribers}
					</div>
				</div>
				<div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
					<div className="text-sm text-neutral-400">Total Subscribers</div>
					<div className="mt-1 text-2xl font-bold">
						{stats.totalSubscribers}
					</div>
				</div>
				<div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
					<div className="text-sm text-neutral-400">Unsubscribed</div>
					<div className="mt-1 text-2xl font-bold text-neutral-500">
						{stats.unsubscribed}
					</div>
				</div>
				<div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
					<div className="text-sm text-neutral-400">Last Digest</div>
					<div className="mt-1 text-lg font-bold">
						{stats.lastDigest?.sentAt
							? format(new Date(stats.lastDigest.sentAt), 'MMM d')
							: 'Never'}
					</div>
					{stats.lastDigest && (
						<div className="text-xs text-neutral-500">
							{stats.lastDigest.emailsSent} emails sent
						</div>
					)}
				</div>
			</div>

			{/* Digest History Table */}
			<div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
				<div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-6 py-3">
					<h3 className="font-medium text-neutral-300">Digest History</h3>
					<label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-400">
						<input
							type="checkbox"
							checked={showTests}
							onChange={handleToggleTests}
							disabled={isLoadingLogs}
							className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-green-500 focus:ring-green-500 focus:ring-offset-neutral-900"
						/>
						<span>Show test runs</span>
						{isLoadingLogs && (
							<Loader2 className="h-3 w-3 animate-spin text-neutral-500" />
						)}
					</label>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm">
						<thead className="bg-neutral-950 text-neutral-400">
							<tr>
								<th className="px-6 py-3 font-medium">Period</th>
								<th className="px-6 py-3 font-medium">Status</th>
								<th className="px-6 py-3 font-medium">Subscribers</th>
								<th className="px-6 py-3 font-medium">Sent</th>
								<th className="px-6 py-3 font-medium">Failed</th>
								<th className="px-6 py-3 font-medium">Bounced</th>
								<th className="px-6 py-3 font-medium">Releases</th>
								<th className="px-6 py-3 font-medium">Delivery Rate</th>
								<th className="px-6 py-3 font-medium">Sent At</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-neutral-800">
							{displayLogs.length === 0 ? (
								<tr>
									<td
										colSpan={9}
										className="px-6 py-8 text-center text-neutral-500"
									>
										No digest runs yet. The first digest will be sent next
										Monday at 9 AM UTC.
									</td>
								</tr>
							) : (
								displayLogs.map(
									(log: {
										id: string
										period: string
										isTest: boolean
										status: string
										subscribersTotal: number
										emailsSent: number
										emailsFailed: number
										emailsBounced: number
										releasesIncluded: number
										toolsIncluded: number
										deliveryRate: string
										bounceRate: string
										startedAt: Date
										completedAt: Date | null
										error: string | null
									}) => (
										<tr
											key={log.id}
											className={`hover:bg-neutral-800/50 ${log.isTest ? 'bg-neutral-800/20' : ''}`}
										>
											<td className="px-6 py-4 font-mono text-neutral-300">
												{log.isTest && (
													<span className="mr-2 inline-flex items-center rounded-full bg-purple-500/10 px-1.5 py-0.5 text-xs font-medium text-purple-400">
														TEST
													</span>
												)}
												{log.period}
											</td>
											<td className="px-6 py-4">
												<StatusBadge status={log.status} />
												{log.error && (
													<div
														className="mt-1 max-w-[200px] truncate text-xs text-red-400"
														title={log.error}
													>
														{log.error}
													</div>
												)}
											</td>
											<td className="px-6 py-4 text-neutral-400">
												{log.subscribersTotal}
											</td>
											<td className="px-6 py-4 text-green-500">
												{log.emailsSent}
											</td>
											<td className="px-6 py-4 text-red-500">
												{log.emailsFailed > 0 ? log.emailsFailed : '-'}
											</td>
											<td className="px-6 py-4 text-yellow-500">
												{log.emailsBounced > 0 ? log.emailsBounced : '-'}
											</td>
											<td className="px-6 py-4 text-neutral-400">
												{log.releasesIncluded} / {log.toolsIncluded} tools
											</td>
											<td className="px-6 py-4">
												<span
													className={
														Number(log.deliveryRate) >= 95
															? 'text-green-500'
															: Number(log.deliveryRate) >= 80
																? 'text-yellow-500'
																: 'text-red-500'
													}
												>
													{log.deliveryRate}%
												</span>
											</td>
											<td className="whitespace-nowrap px-6 py-4 text-neutral-400">
												{log.completedAt
													? format(
															new Date(log.completedAt),
															'MMM d, yyyy HH:mm',
														)
													: '-'}
											</td>
										</tr>
									),
								)
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Info Box */}
			<div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
				<h4 className="mb-2 font-medium text-neutral-300">
					Observability Notes
				</h4>
				<ul className="list-inside list-disc space-y-1 text-sm text-neutral-400">
					<li>
						Digests are sent every Monday at 9:00 AM UTC via Trigger.dev
						scheduled job
					</li>
					<li>
						If no releases occurred during the week, the digest is skipped
					</li>
					<li>
						Emails are sent in batches of 50 with 100ms delay to avoid rate
						limiting
					</li>
					<li>
						Bounce events are tracked via Resend webhooks (when configured)
					</li>
					<li>
						View real-time job logs in the{' '}
						<a
							href="https://cloud.trigger.dev"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-400 hover:underline"
						>
							Trigger.dev dashboard
						</a>
					</li>
				</ul>
			</div>

			{/* Preview Modal */}
			{showPreview && (
				<PreviewModal
					html={preview.htmlPreview}
					onClose={() => setShowPreview(false)}
				/>
			)}
		</div>
	)
}
