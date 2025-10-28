import { createFileRoute } from '@tanstack/react-router'
import { GitHub } from '@/components/logo/github'
import { XformerlyTwitter } from '@/components/logo/x'
import { LogoShowcase } from '@/components/shared/logo-showcase'
import { BackgroundRippleEffect } from '@/components/ui/background-ripple-effect'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/')({ component: ComingSoon })

function ComingSoon() {
	return (
		<div className="flex min-h-screen flex-col overflow-y-hidden">
			{/* Hero Section - Full Screen */}
			<section className="relative flex flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
				<BackgroundRippleEffect rows={15} />
				<div className="relative z-10 mx-auto w-full max-w-2xl text-center">
					{/* Status Badge */}
					<Badge
						variant="outline"
						className="mb-8 border-border bg-card px-4 py-1.5 text-xs font-mono uppercase tracking-wider"
					>
						Coming Soon
					</Badge>

					{/* Main Heading */}
					<h1 className="mb-6 font-mono text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
						changelogs.directory
					</h1>

					{/* Subheading */}
					<p className="mb-4 text-lg text-muted-foreground sm:text-xl">
						Track updates for developer tools
					</p>

					{/* Description */}
					<p className="mx-auto mb-12 max-w-xl text-sm leading-relaxed text-muted-foreground/80 sm:text-base">
						Stay informed about the latest releases, features, improvements, and
						breaking changes in your favorite tools. All in one place.
					</p>

					{/* Newsletter/Notification Signup */}
					<div className="mx-auto max-w-md">
						<p className="mb-6 text-sm text-muted-foreground">
							Get notified when we launch
						</p>

						<div className="flex flex-col gap-3 sm:flex-row">
							<Input
								type="email"
								placeholder="your@email.com"
								disabled
								className="h-11 flex-1 border-border bg-card font-mono text-sm placeholder:text-muted-foreground/50"
							/>
							<Button
								size="lg"
								disabled
								className="h-11 border border-border bg-primary px-6 font-mono text-sm text-primary-foreground hover:bg-primary/90"
							>
								Notify me
							</Button>
						</div>

						<p className="mt-4 text-xs text-muted-foreground/60">
							No spam. Unsubscribe anytime.
						</p>
					</div>
				</div>
			</section>

			{/* Logo Showcase - Scrolling */}
			<LogoShowcase />

			{/* Footer */}
			<footer className="border-t border-border px-4 py-6 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
						<code className="text-xs text-muted-foreground sm:text-sm">
							changelogs.directory
						</code>
						<div className="flex items-center gap-6">
							<a
								href="https://x.com/leodoan_"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="X (@leodoan_)"
								className="text-muted-foreground transition-colors hover:text-foreground opacity-75 hover:opacity-100 "
							>
								<XformerlyTwitter className="size-5" />
								<span className="sr-only">X</span>
							</a>
							<a
								href="https://github.com/mnismt"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="GitHub (mnismt)"
								className="text-muted-foreground transition-colors hover:text-foreground opacity-75 hover:opacity-100"
							>
								<GitHub className="size-5" />
								<span className="sr-only">GitHub</span>
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}
