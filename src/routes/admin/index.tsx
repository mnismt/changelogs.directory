import { createFileRoute } from '@tanstack/react-router'
import { getAdminDashboardStats } from '@/server/admin'

export const Route = createFileRoute('/admin/')({
	loader: async () => {
		return await getAdminDashboardStats()
	},
	component: AdminDashboard,
})

function AdminDashboard() {
	const { userCount, toolCount, releaseCount } = Route.useLoaderData()

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold">Dashboard Overview</h2>
			<div className="grid gap-4 md:grid-cols-3">
				<StatCard title="Total Users" value={userCount} />
				<StatCard title="Total Tools" value={toolCount} />
				<StatCard title="Total Releases" value={releaseCount} />
			</div>
		</div>
	)
}

function StatCard({ title, value }: { title: string; value: number }) {
	return (
		<div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
			<h3 className="text-sm font-medium text-neutral-400">{title}</h3>
			<p className="mt-2 text-3xl font-bold text-white">{value}</p>
		</div>
	)
}
