import { Link, useRouterState } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
	Box,
	ChevronRight,
	LayoutDashboard,
	Mail,
	Terminal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MENU_ITEMS = [
	{
		label: 'Dashboard',
		href: '/admin',
		icon: LayoutDashboard,
		shortcut: '⌘1',
	},
	{
		label: 'Emails',
		href: '/admin/emails',
		icon: Mail,
		shortcut: '⌘2',
	},
	{
		label: 'Ingestion',
		href: '/admin/ingestion',
		icon: Terminal,
		shortcut: '⌘3',
	},
	{
		label: 'Tools',
		href: '/admin/tools',
		icon: Box,
		shortcut: '⌘4',
	},
]

export function AdminSidebar() {
	return (
		<aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-[#0A0A0A] px-4 py-6">
			{/* Header */}
			<div className="mb-8 flex items-center gap-2 px-2">
				<div className="flex h-6 w-6 items-center justify-center rounded bg-white/10">
					<div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
				</div>
				<span className="font-mono text-sm font-bold tracking-tight text-white/80">
					ADMIN_PANEL
				</span>
			</div>

			{/* Navigation */}
			<nav className="space-y-1">
				{MENU_ITEMS.map((item) => (
					<SidebarItem key={item.href} item={item} />
				))}
			</nav>

			{/* Footer / System Status */}
			<div className="absolute bottom-6 left-4 right-4 space-y-4 border-t border-white/5 pt-4">
				<div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
					<span>STATUS</span>
					<span className="text-green-500">ONLINE</span>
				</div>
				<div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
					<span>UPTIME</span>
					<span>24h 12m</span>
				</div>
			</div>
		</aside>
	)
}

function SidebarItem({
	item,
}: {
	item: {
		label: string
		href: string
		icon: React.ElementType
		shortcut: string
	}
}) {
	const router = useRouterState()
	const isActive = router.location.pathname === item.href

	return (
		<Link
			to={item.href}
			className="group relative flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-white/5"
		>
			{isActive && (
				<motion.div
					layoutId="sidebar-active"
					className="absolute inset-0 rounded-md bg-white/5 border border-white/10"
					initial={false}
					transition={{
						type: 'spring',
						stiffness: 300,
						damping: 30,
					}}
				/>
			)}

			<div className="relative z-10 flex items-center gap-3">
				<item.icon
					className={cn(
						'h-4 w-4 transition-colors',
						isActive
							? 'text-white'
							: 'text-neutral-500 group-hover:text-neutral-300',
					)}
				/>
				<span
					className={cn(
						'text-sm font-medium transition-colors font-mono',
						isActive
							? 'text-white'
							: 'text-neutral-400 group-hover:text-neutral-200',
					)}
				>
					{item.label}
				</span>
			</div>

			<div className="relative z-10 flex items-center gap-2">
				{isActive && (
					<motion.div
						initial={{ opacity: 0, x: -5 }}
						animate={{ opacity: 1, x: 0 }}
						className="text-white/50"
					>
						<ChevronRight className="h-3 w-3" />
					</motion.div>
				)}
				<span className="hidden text-[10px] font-medium text-neutral-600 group-hover:text-neutral-500 lg:block font-mono">
					{item.shortcut}
				</span>
			</div>
		</Link>
	)
}
