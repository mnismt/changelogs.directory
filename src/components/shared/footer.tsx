import { Link } from '@tanstack/react-router'

const NAV_LINKS = [
	{ label: 'Home', href: '/' },
	{ label: 'Tools', href: '/tools' },
	{
		label: 'PRD',
		href: 'https://github.com/minhthanh/changelogs-directory/blob/main/docs/PRD.md',
		external: true,
	},
] as const

export function Footer() {
	return (
		<footer className="border-t border-border/50 bg-background/80">
			<div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1 text-center md:text-left">
					<p className="font-mono text-sm text-foreground">
						changelogs.directory
					</p>
					<p className="font-mono text-xs text-muted-foreground">
						Track CLI tool releases in one monochrome feed.
					</p>
				</div>

				<nav className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
					{NAV_LINKS.map((link) =>
						link.external ? (
							<a
								key={link.label}
								href={link.href}
								target="_blank"
								rel="noopener noreferrer"
								className="font-mono uppercase tracking-wide transition-colors hover:text-foreground"
							>
								{link.label}
							</a>
						) : (
							<Link
								key={link.label}
								to={link.href}
								className="font-mono uppercase tracking-wide transition-colors hover:text-foreground"
							>
								{link.label}
							</Link>
						),
					)}
				</nav>

				<div className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground md:items-end md:text-right">
					<div className="flex items-center gap-2">
						<div className="relative flex items-center justify-center">
							<span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-foreground/30" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-foreground" />
						</div>
						<span className="font-mono uppercase tracking-wide">
							Operational
						</span>
					</div>
					<p className="font-mono text-[11px] text-muted-foreground/80">
						Built by{' '}
						<a
							href="https://twitter.com/leodoan_"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground transition-colors hover:text-muted-foreground"
						>
							leodoan
						</a>
					</p>
				</div>
			</div>
		</footer>
	)
}
