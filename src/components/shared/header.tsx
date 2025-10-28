import { Link } from '@tanstack/react-router'

export function Header() {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<Link to="/" className="flex items-center">
					<code className="text-lg font-semibold tracking-tight text-foreground hover:text-foreground/80 transition-colors">
						changelogs.directory
					</code>
				</Link>

				<nav className="hidden items-center gap-6 text-sm md:flex">
					<Link
						to="/"
						className="text-muted-foreground hover:text-foreground transition-colors"
					>
						Tools
					</Link>
					<Link
						to="/"
						className="text-muted-foreground hover:text-foreground transition-colors"
					>
						Compare
					</Link>
					<Link
						to="/"
						className="text-muted-foreground hover:text-foreground transition-colors"
					>
						Docs
					</Link>
				</nav>
			</div>
		</header>
	)
}
