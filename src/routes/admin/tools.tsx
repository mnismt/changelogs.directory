import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getAdminTools, updateTool } from '@/server/admin'

export const Route = createFileRoute('/admin/tools')({
	loader: async () => {
		return await getAdminTools()
	},
	component: AdminTools,
})

function AdminTools() {
	const { tools } = Route.useLoaderData()
	const router = useRouter()
	const [editingId, setEditingId] = useState<string | null>(null)

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold">Tools Management</h2>
			<div className="rounded-lg border border-neutral-800 overflow-hidden">
				<table className="w-full text-left text-sm">
					<thead className="bg-neutral-900 text-neutral-400">
						<tr>
							<th className="px-4 py-3 font-medium">Name</th>
							<th className="px-4 py-3 font-medium">Slug</th>
							<th className="px-4 py-3 font-medium">Description</th>
							<th className="px-4 py-3 font-medium">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-neutral-800 bg-neutral-900/50">
						{tools.map((tool) => (
							<tr key={tool.id}>
								<td className="px-4 py-3 font-medium text-white">
									{tool.name}
								</td>
								<td className="px-4 py-3 text-neutral-400">{tool.slug}</td>
								<td className="px-4 py-3 text-neutral-400">
									{editingId === tool.id ? (
										<ToolEditor
											tool={tool}
											onCancel={() => setEditingId(null)}
											onSave={() => {
												setEditingId(null)
												router.invalidate()
											}}
										/>
									) : (
										tool.description || '-'
									)}
								</td>
								<td className="px-4 py-3">
									<div className="flex items-center gap-3">
										{editingId !== tool.id && (
											<button
												onClick={() => setEditingId(tool.id)}
												className="text-blue-500 hover:text-blue-400"
											>
												Edit
											</button>
										)}
										<Link
											to="/admin/tools/$slug"
											params={{ slug: tool.slug }}
											className="text-neutral-400 hover:text-white"
										>
											Releases
										</Link>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

function ToolEditor({
	tool,
	onCancel,
	onSave,
}: {
	tool: any
	onCancel: () => void
	onSave: () => void
}) {
	const [description, setDescription] = useState(tool.description || '')
	const [isSaving, setIsSaving] = useState(false)

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await updateTool({
				data: {
					id: tool.id,
					description,
				},
			})
			onSave()
		} catch (error) {
			console.error('Failed to update tool:', error)
			alert('Failed to update tool')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className="flex items-center gap-2">
			<input
				type="text"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-white focus:border-blue-500 focus:outline-none"
			/>
			<button
				onClick={handleSave}
				disabled={isSaving}
				className="text-green-500 hover:text-green-400 disabled:opacity-50"
			>
				Save
			</button>
			<button
				onClick={onCancel}
				disabled={isSaving}
				className="text-red-500 hover:text-red-400 disabled:opacity-50"
			>
				Cancel
			</button>
		</div>
	)
}
