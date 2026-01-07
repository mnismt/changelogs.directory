import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { PlatformChangelog } from '@/lib/parsers/platform-changelog'
import { getPlatformChangelog } from '@/server/platform'

const NAV_LINKS = [
	{ label: 'Home', href: '/' },
	{ label: 'Tools', href: '/tools' },
	{ label: 'Analytics', href: '/analytics' },
	{ label: 'Changelog', href: '/changelog' },
] as const

export function Footer() {
	const [changelog, setChangelog] = useState<PlatformChangelog | null>(null)

	useEffect(() => {
		if (!changelog) {
			getPlatformChangelog().then(setChangelog)
		}
	}, [changelog])

	const version = changelog ? `v${changelog.latestVersion}` : 'v0.0.0'

	return (
		<footer className="border-t border-border/40 bg-background">
			<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 pb-24 sm:px-6 md:flex-row md:pb-6 lg:px-8">
				<div className="flex items-center gap-4">
					<Link
						to="/changelog"
						className="group flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						<span className="text-foreground">changelogs.directory</span>
						<span className="mx-2 text-border">::</span>
						<span className="group-hover:text-primary transition-colors">
							{version}
						</span>
					</Link>
				</div>

				<nav className="flex items-center gap-6">
					{NAV_LINKS.map((link) => (
						<Link
							key={link.label}
							to={link.href}
							className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
							activeProps={{
								className: 'text-foreground font-medium',
							}}
						>
							{link.label}
						</Link>
					))}
				</nav>

				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
						</span>
						<span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
							Operational
						</span>
					</div>
					<span className="text-border">|</span>
					<p className="font-mono text-[10px] text-muted-foreground">
						Built by{' '}
						<a
							href="https://twitter.com/leodoan_"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground hover:underline"
						>
							@leodoan
						</a>
					</p>
				</div>
			</div>
		</footer>
	)
}
