import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { GitHub } from '@/components/logo/github'
import { XformerlyTwitter } from '@/components/logo/x'
import { LogoShowcase } from '@/components/shared/logo-showcase'
import { BackgroundRippleEffect } from '@/components/ui/background-ripple-effect'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { posthog } from '@/integrations/posthog'
import { getErrorMessage } from '@/lib/errors'

export const Route = createFileRoute('/')({ component: ComingSoon })

function ComingSoon() {
	const [email, setEmail] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isMounted, setIsMounted] = useState(false)
	const [status, setStatus] = useState<{
		type: 'success' | 'error' | null
		message: string
	}>({ type: null, message: '' })

	// Trigger mount animation
	useEffect(() => {
		setIsMounted(true)
	}, [])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setStatus({ type: null, message: '' })

		posthog.capture('waitlist_subscribe_attempted', {
			source: 'hero_section',
		})

		try {
			const response = await fetch('/api/waitlist', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
			})

			const result = await response.json()

			if (!response.ok || !result.success) {
				throw new Error(result.message || 'Failed to subscribe')
			}

			setStatus({
				type: 'success',
				message: result.message,
			})
			setEmail('')

			posthog.capture('waitlist_subscribe_success', {
				source: 'hero_section',
			})
		} catch (error) {
			const errorMessage = getErrorMessage(error)

			setStatus({
				type: 'error',
				message: errorMessage,
			})

			posthog.capture('waitlist_subscribe_failed', {
				source: 'hero_section',
				error: errorMessage,
			})
		} finally {
			setIsLoading(false)
		}
	}

	// Auto-dismiss messages after 5 seconds
	useEffect(() => {
		if (status.type) {
			const timer = setTimeout(() => {
				setStatus({ type: null, message: '' })
			}, 5000)
			return () => clearTimeout(timer)
		}
	}, [status.type])

	return (
		<div className="flex min-h-screen flex-col overflow-y-hidden">
			{/* Hero Section - Full Screen */}
			<section className="relative flex flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
				<BackgroundRippleEffect rows={15} />
				<div
					className={`relative z-10 mx-auto w-full max-w-2xl text-center transition-all duration-1000 ${
						isMounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
					}`}
				>
					{/* Status Badge */}
					<Badge
						variant="outline"
						className={`mb-8 border-border bg-card px-4 py-1.5 text-xs font-mono uppercase tracking-wider transition-all duration-700 delay-[900ms] ${
							isMounted
								? 'scale-100 opacity-100 animate-pulse-subtle'
								: 'scale-95 opacity-0'
						}`}
					>
						Coming Soon
					</Badge>

					{/* Main Heading */}
					<h1
						className={`mb-6 font-mono text-4xl font-semibold tracking-tight transition-all duration-700 delay-200 sm:text-5xl md:text-6xl ${
							isMounted
								? 'translate-y-0 opacity-100'
								: 'translate-y-4 opacity-0'
						}`}
					>
						changelogs.directory
					</h1>

					{/* Subheading */}
					<p
						className={`mb-4 text-lg text-muted-foreground transition-all duration-700 delay-300 sm:text-xl ${
							isMounted
								? 'translate-y-0 opacity-100'
								: 'translate-y-4 opacity-0'
						}`}
					>
						Track updates for developer tools
					</p>

					{/* Description */}
					<p
						className={`mx-auto mb-12 max-w-xl text-sm leading-relaxed text-muted-foreground/80 transition-all duration-700 delay-[400ms] sm:text-base ${
							isMounted
								? 'translate-y-0 opacity-100'
								: 'translate-y-4 opacity-0'
						}`}
					>
						Stay informed about the latest releases, features, improvements, and
						breaking changes in your favorite tools. All in one place.
					</p>

					{/* Newsletter/Notification Signup */}
					<div
						className={`mx-auto max-w-md transition-all duration-700 delay-500 ${
							isMounted
								? 'translate-y-0 opacity-100'
								: 'translate-y-4 opacity-0'
						}`}
					>
						<p className="mb-6 text-sm text-muted-foreground">
							Get notified when we launch
						</p>

						<form
							onSubmit={handleSubmit}
							className="flex flex-col gap-3 sm:flex-row"
						>
							<Input
								type="email"
								placeholder="your@email.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={isLoading}
								required
								className="h-11 flex-1 border-border bg-card font-mono text-sm placeholder:text-muted-foreground/50"
							/>
							<Button
								type="submit"
								size="lg"
								disabled={isLoading || !email}
								className="h-11 border border-border bg-primary px-6 font-mono text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
							>
								{isLoading ? (
									<span className="flex items-center gap-2">
										<Loader2 className="h-4 w-4 animate-spin" />
										Adding...
									</span>
								) : (
									'Notify me'
								)}
							</Button>
						</form>

						{/* Status Messages with Animations */}
						<div className="min-h-[60px] transition-all">
							{status.type === 'success' && (
								<div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
									<div className="flex items-start justify-center gap-2 rounded-lg border border-foreground/20 bg-card px-4 py-3 text-sm">
										<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
										<span className="font-mono text-foreground">
											{status.message}
										</span>
									</div>
								</div>
							)}

							{status.type === 'error' && (
								<div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
									<div className="flex items-start justify-center gap-2 rounded-lg border border-destructive/30 bg-card px-4 py-3 text-sm">
										<XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
										<span className="font-mono text-destructive">
											{status.message}
										</span>
									</div>
								</div>
							)}

							{!status.type && (
								<p className="mt-4 animate-in fade-in duration-300 text-xs text-muted-foreground/60">
									No spam. Unsubscribe anytime.
								</p>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* Logo Showcase - Scrolling */}
			<div
				className={`transition-all duration-700 delay-700 ${
					isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
				}`}
			>
				<LogoShowcase />
			</div>

			{/* Footer */}
			<footer
				className={`border-t border-border px-4 py-6 transition-all duration-700 delay-[800ms] sm:px-6 lg:px-8 ${
					isMounted ? 'opacity-100' : 'opacity-0'
				}`}
			>
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
