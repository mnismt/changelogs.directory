import { createFileRoute } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { sendTestEmail } from '@/server/admin-email-test'

export const Route = createFileRoute('/admin/test-email')({
	component: EmailTestPage,
})

function EmailTestPage() {
	const [isLoading, setIsLoading] = useState(false)
	const [result, setResult] = useState<{
		success: boolean
		error?: string
	} | null>(null)

	const templateId = useId()
	const recipientId = useId()
	const dataId = useId()

	const [formData, setFormData] = useState({
		template: 'welcome' as
			| 'welcome'
			| 'tool-release-update'
			| 'release-digest'
			| 'new-tool-announcement',
		to: '',
		data: '{}',
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setResult(null)

		try {
			let parsedData = {}
			try {
				parsedData = JSON.parse(formData.data)
			} catch {
				alert('Invalid JSON data')
				setIsLoading(false)
				return
			}

			const res = await sendTestEmail({
				data: {
					template: formData.template,
					to: formData.to,
					data: parsedData,
				},
			})

			setResult(res)
		} catch (error) {
			setResult({ success: false, error: String(error) })
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="space-y-6 max-w-2xl mx-auto">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Test Emails</h2>
			</div>

			<div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor={templateId}
							className="block text-sm font-medium text-neutral-400 mb-1"
						>
							Template
						</label>
						<select
							id={templateId}
							value={formData.template}
							onChange={(e) =>
								setFormData({
									...formData,
									template: e.target.value as
										| 'welcome'
										| 'tool-release-update'
										| 'release-digest'
										| 'new-tool-announcement',
								})
							}
							className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-700"
						>
							<option value="welcome">Welcome Email</option>
							<option value="tool-release-update">Tool Release Update</option>
							<option value="release-digest">Release Digest</option>
							<option value="new-tool-announcement">
								New Tool Announcement
							</option>
						</select>
					</div>

					<div>
						<label
							htmlFor={recipientId}
							className="block text-sm font-medium text-neutral-400 mb-1"
						>
							Recipient
						</label>
						<input
							id={recipientId}
							type="email"
							required
							value={formData.to}
							onChange={(e) => setFormData({ ...formData, to: e.target.value })}
							placeholder="user@example.com"
							className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-700"
						/>
					</div>

					<div>
						<label
							htmlFor={dataId}
							className="block text-sm font-medium text-neutral-400 mb-1"
						>
							Data (JSON)
						</label>
						<textarea
							id={dataId}
							value={formData.data}
							onChange={(e) =>
								setFormData({ ...formData, data: e.target.value })
							}
							rows={10}
							className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm font-mono text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-700"
						/>
						<p className="mt-1 text-xs text-neutral-500">
							Optional JSON data to override default template props.
						</p>
					</div>

					<div className="pt-4">
						<button
							type="submit"
							disabled={isLoading}
							className="w-full rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? 'Sending...' : 'Send Test Email'}
						</button>
					</div>
				</form>

				{result && (
					<div
						className={`mt-6 p-4 rounded-md border ${
							result.success
								? 'border-green-900/50 bg-green-900/10 text-green-400'
								: 'border-red-900/50 bg-red-900/10 text-red-400'
						}`}
					>
						<p className="font-medium">
							{result.success
								? 'Email sent successfully!'
								: 'Failed to send email'}
						</p>
						{result.error && (
							<p className="mt-1 text-sm opacity-90">{result.error}</p>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
