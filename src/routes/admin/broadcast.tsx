import { createFileRoute, Link } from '@tanstack/react-router'
import { useId, useMemo, useState } from 'react'
import type { TemplateId } from '@/lib/email/template-registry'
import {
	getEmailTemplates,
	getToolBySlug,
	getWaitlistSubscribers,
	renderTemplatePreview,
	sendBroadcast,
} from '@/server/admin-broadcast'

export const Route = createFileRoute('/admin/broadcast')({
	loader: async () => {
		const [subscribersData, templates] = await Promise.all([
			getWaitlistSubscribers(),
			getEmailTemplates(),
		])
		return { ...subscribersData, templates }
	},
	component: BroadcastPage,
})

function BroadcastPage() {
	const { subscribers, total, templates } = Route.useLoaderData()

	const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(
		'new-tool-announcement',
	)
	const [templateProps, setTemplateProps] = useState<Record<string, string>>({
		toolSlug: '',
	})
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
	const [searchQuery, setSearchQuery] = useState('')
	const [filterType, setFilterType] = useState<'all' | 'test' | 'real'>('all')
	const [isSending, setIsSending] = useState(false)
	const [sendResult, setSendResult] = useState<{
		success: number
		failed: number
		errors: string[]
	} | null>(null)
	const [showConfirmDialog, setShowConfirmDialog] = useState(false)
	const [showPreview, setShowPreview] = useState(false)
	const [previewHtml, setPreviewHtml] = useState<string | null>(null)
	const [previewSubject, setPreviewSubject] = useState<string | null>(null)
	const [isLoadingPreview, setIsLoadingPreview] = useState(false)
	const [toolData, setToolData] = useState<{
		name: string
		slug: string
		vendor: string | null
		description: string | null
	} | null>(null)

	const [customSubject, setCustomSubject] = useState('')
	const [customFromName, setCustomFromName] = useState('Changelogs Directory')
	const [customFromEmail, setCustomFromEmail] = useState(
		'system@changelogs.directory',
	)
	const [customReplyTo, setCustomReplyTo] = useState('admin@example.com')

	const VERIFIED_FROM_EMAILS = [
		{
			value: 'system@changelogs.directory',
			label: 'system@changelogs.directory',
		},
		{
			value: 'hello@changelogs.directory',
			label: 'hello@changelogs.directory',
		},
		{
			value: 'digest@changelogs.directory',
			label: 'digest@changelogs.directory',
		},
	]

	const searchId = useId()
	const templateSelectId = useId()
	const toolSlugId = useId()
	const customSubjectId = useId()
	const customFromNameId = useId()
	const customFromEmailId = useId()
	const customReplyToId = useId()

	const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

	const filteredSubscribers = useMemo(() => {
		let filtered = subscribers

		// Filter by type
		if (filterType === 'test') {
			filtered = filtered.filter((sub) => sub.isTest)
		} else if (filterType === 'real') {
			filtered = filtered.filter((sub) => !sub.isTest)
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter((sub) =>
				sub.email.toLowerCase().includes(query),
			)
		}

		return filtered
	}, [subscribers, filterType, searchQuery])

	const handleSelectAll = () => {
		setSelectedIds(new Set(filteredSubscribers.map((sub) => sub.id)))
	}

	const handleDeselectAll = () => {
		setSelectedIds(new Set())
	}

	const handleToggle = (id: string) => {
		const newSet = new Set(selectedIds)
		if (newSet.has(id)) {
			newSet.delete(id)
		} else {
			newSet.add(id)
		}
		setSelectedIds(newSet)
	}

	const handleLoadPreview = async () => {
		setIsLoadingPreview(true)
		try {
			let props: Record<string, unknown> = {}

			if (
				selectedTemplateId === 'new-tool-announcement' &&
				templateProps.toolSlug
			) {
				const tool = await getToolBySlug({
					data: { slug: templateProps.toolSlug },
				})
				setToolData(tool)
				props = {
					toolName: tool.name,
					toolSlug: tool.slug,
					vendor: tool.vendor || '',
					description: tool.description || '',
				}
			} else if (selectedTemplateId === 'welcome') {
				props = { email: 'subscriber@example.com' }
			}

			const result = await renderTemplatePreview({
				data: { templateId: selectedTemplateId, props },
			})
			setPreviewHtml(result.html)
			setPreviewSubject(result.subject)
			setCustomSubject(result.subject)
			setShowPreview(true)
		} catch (error) {
			console.error('Failed to load preview:', error)
		} finally {
			setIsLoadingPreview(false)
		}
	}

	const handleSend = async () => {
		setShowConfirmDialog(false)
		setIsSending(true)
		setSendResult(null)

		try {
			let props: Record<string, unknown> = {}

			if (selectedTemplateId === 'new-tool-announcement' && toolData) {
				props = {
					toolName: toolData.name,
					toolSlug: toolData.slug,
					vendor: toolData.vendor || '',
					description: toolData.description || '',
				}
			} else if (selectedTemplateId === 'welcome') {
				props = { email: 'subscriber@example.com' }
			}

			const result = await sendBroadcast({
				data: {
					recipientIds: Array.from(selectedIds),
					templateId: selectedTemplateId,
					templateProps: props,
					customSubject,
					customFrom: {
						email: customFromEmail,
						name: customFromName,
					},
					customReplyTo,
				},
			})
			setSendResult(result)
		} catch (error) {
			setSendResult({
				success: 0,
				failed: selectedIds.size,
				errors: [String(error)],
			})
		} finally {
			setIsSending(false)
		}
	}

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		})
	}

	const canLoadPreview =
		selectedTemplateId !== 'new-tool-announcement' || templateProps.toolSlug

	return (
		<div className="space-y-6 max-w-4xl">
			{/* Header */}
			<div>
				<h2 className="text-2xl font-bold">Email Broadcast</h2>
				<p className="text-neutral-400 mt-1">
					Send emails to waitlist subscribers
				</p>
			</div>

			{/* Template Selection */}
			<div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
				<h3 className="text-sm font-medium text-neutral-300 mb-3">
					Select Template
				</h3>
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<label htmlFor={templateSelectId} className="sr-only">
							Email Template
						</label>
						<select
							id={templateSelectId}
							value={selectedTemplateId}
							onChange={(e) => {
								setSelectedTemplateId(e.target.value as TemplateId)
								setShowPreview(false)
								setPreviewHtml(null)
								setPreviewSubject(null)
								setToolData(null)
							}}
							className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-600"
						>
							{templates.map((template) => (
								<option key={template.id} value={template.id}>
									{template.name}
								</option>
							))}
						</select>
						{selectedTemplate && (
							<p className="mt-2 text-xs text-neutral-500">
								{selectedTemplate.description}
							</p>
						)}
					</div>

					{/* Template-specific fields */}
					{selectedTemplateId === 'new-tool-announcement' && (
						<div>
							<label
								htmlFor={toolSlugId}
								className="block text-xs font-medium text-neutral-400 mb-1"
							>
								Tool Slug
							</label>
							<input
								id={toolSlugId}
								type="text"
								placeholder="e.g., opencode"
								value={templateProps.toolSlug || ''}
								onChange={(e) =>
									setTemplateProps((prev) => ({
										...prev,
										toolSlug: e.target.value,
									}))
								}
								className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-600"
							/>
						</div>
					)}
				</div>

				<div className="mt-4">
					<button
						type="button"
						onClick={handleLoadPreview}
						disabled={!canLoadPreview || isLoadingPreview}
						className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoadingPreview ? 'Loading...' : 'Load Preview'}
					</button>
				</div>
			</div>

			{/* Email Preview */}
			{previewHtml && (
				<div className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
					{/* Email Settings - Above Preview */}
					<div className="p-4 border-b border-neutral-800 space-y-3">
						<h3 className="text-sm font-medium text-neutral-300">
							Email Settings
						</h3>

						{/* Subject */}
						<div>
							<label
								htmlFor={customSubjectId}
								className="block text-xs text-neutral-500 mb-1"
							>
								Subject
							</label>
							<input
								id={customSubjectId}
								value={customSubject}
								onChange={(e) => setCustomSubject(e.target.value)}
								className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 font-mono"
							/>
						</div>

						{/* From Name */}
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label
									htmlFor={customFromNameId}
									className="block text-xs text-neutral-500 mb-1"
								>
									From Name
								</label>
								<input
									id={customFromNameId}
									value={customFromName}
									onChange={(e) => setCustomFromName(e.target.value)}
									className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
								/>
							</div>

							{/* From Email (Dropdown) */}
							<div>
								<label
									htmlFor={customFromEmailId}
									className="block text-xs text-neutral-500 mb-1"
								>
									From Email
								</label>
								<select
									id={customFromEmailId}
									value={customFromEmail}
									onChange={(e) => setCustomFromEmail(e.target.value)}
									className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
								>
									{VERIFIED_FROM_EMAILS.map((email) => (
										<option key={email.value} value={email.value}>
											{email.label}
										</option>
									))}
								</select>
							</div>
						</div>

						{/* Reply-To */}
						<div>
							<label
								htmlFor={customReplyToId}
								className="block text-xs text-neutral-500 mb-1"
							>
								Reply-To <span className="text-neutral-600">(Optional)</span>
							</label>
							<input
								id={customReplyToId}
								value={customReplyTo}
								onChange={(e) => setCustomReplyTo(e.target.value)}
								placeholder="e.g. admin@example.com"
								className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
							/>
						</div>
					</div>
					<div className="p-4 border-b border-neutral-800 flex items-center justify-between">
						<div>
							<h3 className="text-sm font-medium text-neutral-400 mb-1">
								Email Preview
							</h3>
							<div className="font-mono text-xs text-neutral-500">
								<p>
									<span className="text-neutral-600">Subject:</span>{' '}
									{previewSubject}
								</p>
								<p className="mt-0.5">
									<span className="text-neutral-600">From:</span> Changelogs
									Directory &lt;system@changelogs.directory&gt;
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={() => setShowPreview(!showPreview)}
							className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
						>
							{showPreview ? 'Hide Preview' : 'Show Full Preview'}
						</button>
					</div>

					{showPreview && (
						<div className="p-6 bg-neutral-950">
							<iframe
								srcDoc={previewHtml}
								title="Email Preview"
								className="w-full border-0 rounded bg-white"
								style={{
									height: '600px',
									maxWidth: '600px',
									margin: '0 auto',
									display: 'block',
								}}
							/>
							<div className="mt-4 pt-4 border-t border-neutral-800 text-center">
								<Link
									to="/admin/test-email"
									className="text-xs text-neutral-500 hover:text-neutral-400 underline"
								>
									Test this email →
								</Link>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Filter by Type */}
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => setFilterType('all')}
					className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
						filterType === 'all'
							? 'bg-neutral-700 text-white'
							: 'border border-neutral-700 text-neutral-300 hover:bg-neutral-800'
					}`}
				>
					All ({subscribers.length})
				</button>
				<button
					type="button"
					onClick={() => setFilterType('test')}
					className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
						filterType === 'test'
							? 'bg-neutral-700 text-white'
							: 'border border-neutral-700 text-neutral-300 hover:bg-neutral-800'
					}`}
				>
					Test ({subscribers.filter((s) => s.isTest).length})
				</button>
				<button
					type="button"
					onClick={() => setFilterType('real')}
					className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
						filterType === 'real'
							? 'bg-neutral-700 text-white'
							: 'border border-neutral-700 text-neutral-300 hover:bg-neutral-800'
					}`}
				>
					Real ({subscribers.filter((s) => !s.isTest).length})
				</button>
			</div>

			{/* Controls */}
			<div className="flex items-center gap-4 flex-wrap">
				<div className="flex-1 min-w-[200px]">
					<label htmlFor={searchId} className="sr-only">
						Search emails
					</label>
					<input
						id={searchId}
						type="text"
						placeholder="Search by email..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-700"
					/>
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={handleSelectAll}
						className="rounded-md border border-neutral-700 px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
					>
						Select All ({filteredSubscribers.length})
					</button>
					<button
						type="button"
						onClick={handleDeselectAll}
						className="rounded-md border border-neutral-700 px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
					>
						Deselect All
					</button>
				</div>
			</div>

			{/* Selected Count */}
			<div className="text-sm text-neutral-400">
				<span className="text-white font-medium">{selectedIds.size}</span> of{' '}
				{total} subscribers selected
			</div>

			{/* Subscribers Table */}
			<div className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
				<div className="max-h-[400px] overflow-auto">
					<table className="w-full">
						<thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800">
							<tr>
								<th className="w-12 px-4 py-3 text-left">
									<span className="sr-only">Select</span>
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
									Email
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
									Type
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
									Signed Up
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-neutral-800">
							{filteredSubscribers.map((subscriber) => (
								<tr
									key={subscriber.id}
									className="hover:bg-neutral-800/50 cursor-pointer"
									onClick={() => handleToggle(subscriber.id)}
								>
									<td className="px-4 py-3">
										<input
											type="checkbox"
											checked={selectedIds.has(subscriber.id)}
											onChange={() => handleToggle(subscriber.id)}
											onClick={(e) => e.stopPropagation()}
											className="rounded border-neutral-600 bg-neutral-800 text-neutral-100 focus:ring-neutral-600"
										/>
									</td>
									<td className="px-4 py-3 font-mono text-sm text-neutral-200">
										{subscriber.email}
									</td>
									<td className="px-4 py-3">
										{subscriber.isTest ? (
											<span className="inline-flex items-center rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-400">
												Test
											</span>
										) : (
											<span className="inline-flex items-center rounded-full bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-400">
												Real
											</span>
										)}
									</td>
									<td className="px-4 py-3 text-sm text-neutral-500">
										{formatDate(subscriber.createdAt)}
									</td>
								</tr>
							))}
							{filteredSubscribers.length === 0 && (
								<tr>
									<td
										colSpan={4}
										className="px-4 py-8 text-center text-neutral-500"
									>
										{searchQuery
											? 'No subscribers match your search'
											: 'No subscribers yet'}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Send Button */}
			<div className="flex items-center gap-4">
				<button
					type="button"
					onClick={() => setShowConfirmDialog(true)}
					disabled={selectedIds.size === 0 || isSending || !previewHtml}
					className="rounded-md bg-neutral-100 px-6 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSending ? 'Sending...' : `Send Broadcast (${selectedIds.size})`}
				</button>

				{!previewHtml && selectedIds.size > 0 && (
					<span className="text-sm text-yellow-500">
						Load preview first to enable sending
					</span>
				)}

				{isSending && (
					<span className="text-sm text-neutral-400">
						Sending {selectedIds.size} emails sequentially (check server logs
						for progress)...
					</span>
				)}
			</div>

			{/* Result */}
			{sendResult && (
				<div
					className={`p-4 rounded-lg border ${
						sendResult.failed === 0
							? 'border-green-900/50 bg-green-900/10'
							: sendResult.success === 0
								? 'border-red-900/50 bg-red-900/10'
								: 'border-yellow-900/50 bg-yellow-900/10'
					}`}
				>
					<p className="font-medium">
						{sendResult.failed === 0 ? (
							<span className="text-green-400">
								Successfully sent {sendResult.success} emails
							</span>
						) : sendResult.success === 0 ? (
							<span className="text-red-400">
								Failed to send all {sendResult.failed} emails
							</span>
						) : (
							<span className="text-yellow-400">
								Sent {sendResult.success} emails, {sendResult.failed} failed
							</span>
						)}
					</p>
					{sendResult.errors.length > 0 && (
						<details className="mt-2">
							<summary className="text-sm text-neutral-400 cursor-pointer">
								View errors ({sendResult.errors.length})
							</summary>
							<ul className="mt-2 text-sm text-red-400 font-mono">
								{sendResult.errors.slice(0, 5).map((error) => (
									<li key={error} className="truncate">
										{error}
									</li>
								))}
								{sendResult.errors.length > 5 && (
									<li className="text-neutral-500">
										... and {sendResult.errors.length - 5} more
									</li>
								)}
							</ul>
						</details>
					)}
				</div>
			)}

			{/* Confirmation Dialog */}
			{showConfirmDialog && (
				<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
					<div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-lg font-bold mb-2">Confirm Broadcast</h3>
						<p className="text-neutral-400 mb-4">
							You are about to send a{' '}
							<span className="text-white">{selectedTemplate?.name}</span> email
							to{' '}
							<span className="text-white font-medium">{selectedIds.size}</span>{' '}
							subscribers.
						</p>
						<p className="text-sm text-neutral-500 mb-6">
							This action cannot be undone.
						</p>
						<div className="flex gap-3 justify-end">
							<button
								type="button"
								onClick={() => setShowConfirmDialog(false)}
								className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleSend}
								className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
							>
								Send Broadcast
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
