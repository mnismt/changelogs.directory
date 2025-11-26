import { Link } from '@tanstack/react-router'

const NAV_LINKS = [
	{ label: 'Home', href: '/' },
	{ label: 'Tools', href: '/tools' },
	{ label: 'Analytics', href: '/analytics' },
] as const

export function Footer() {
	return (
		<footer className="border-t border-border/40 bg-background">
			<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8 md:flex-row">
				<div className="flex items-center gap-4">
					<p className="font-mono text-xs text-muted-foreground">
						<span className="text-foreground">changelogs.directory</span>
						<span className="mx-2 text-border">::</span>
						<span>v1.0.0</span>
					</p>
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
