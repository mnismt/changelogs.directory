import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { UserRole } from '@/lib/auth/types'
import { getSessionFn } from '@/server/auth'

export const Route = createFileRoute('/admin')({
	beforeLoad: async () => {
		const session = await getSessionFn()
		if (!session?.user || session.user.role !== UserRole.ADMIN) {
			throw redirect({
				to: '/login',
			})
		}
	},
	component: AdminLayout,
})

import { AdminSidebar } from '@/components/admin/admin-sidebar'

function AdminLayout() {
	return (
		<div className="min-h-screen bg-[#0A0A0A] text-neutral-50 font-sans selection:bg-white/20">
			<AdminSidebar />

			{/* Main Content */}
			<main className="pl-64">
				<div className="mx-auto max-w-5xl p-8">
					{/* Breadcrumb / Header Area */}
					<header className="mb-8 flex items-center justify-between">
						<div className="flex items-center gap-2 text-sm text-neutral-500 font-mono">
							<span>~/admin</span>
							<span>/</span>
							<span className="text-white">dashboard</span>
						</div>

						{/* User Profile / Actions could go here */}
						<div className="h-8 w-8 rounded-full bg-white/10 border border-white/10" />
					</header>

					<Outlet />
				</div>
			</main>
		</div>
	)
}
