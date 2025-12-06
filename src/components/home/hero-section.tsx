import { useEffect, useState } from 'react'
import { HeroRelease } from '@/components/home/hero-release'
import { LogoShowcase } from '@/components/shared/logo-showcase'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type HeroReleaseData = {
	tool: {
		slug: string
		name: string
		vendor: string | null
	}
	version: string
	formattedVersion?: string
	releaseDate: Date | string | null
	headline: string | null
	summary: string | null
	_count: { changes: number }
	changesByType: Record<string, number>
	hasBreaking: boolean
	hasSecurity: boolean
	hasDeprecation: boolean
}

interface HeroSectionProps {
	heroRelease: HeroReleaseData
	isMounted: boolean
	onAnimationComplete?: () => void
}

export function HeroSection({
	heroRelease,
	isMounted,
	onAnimationComplete,
}: HeroSectionProps) {
	const [text, setText] = useState('')
	const fullText = 'changelogs.directory'

	// Typewriter effect
	useEffect(() => {
		if (!isMounted) return

		let currentIndex = 0
		const interval = setInterval(() => {
			if (currentIndex <= fullText.length) {
				setText(fullText.slice(0, currentIndex))
				currentIndex++
			} else {
				clearInterval(interval)
			}
		}, 100)

		return () => clearInterval(interval)
	}, [isMounted])

	// Notify parent when all animations are complete
	useEffect(() => {
		if (!isMounted) return

		// The longest delay is 1000ms (hero card) + 1500ms duration = 2500ms
		// Adding a small buffer to be safe and ensure smooth transition
		const timeout = setTimeout(() => {
			onAnimationComplete?.()
		}, 2600)

		return () => clearTimeout(timeout)
	}, [isMounted, onAnimationComplete])

	return (
		<section className="relative border-b border-border overflow-hidden">
			<div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
				<div className="flex flex-col items-center text-center">
					{/* Badge */}
					<div
						className={cn(
							'mb-6 transition-all duration-1000 ease-in-out',
							isMounted
								? 'translate-y-0 opacity-100'
								: 'translate-y-8 opacity-0',
						)}
					>
						<Badge
							variant="outline"
							className="border-border bg-secondary/50 font-mono text-xs uppercase tracking-widest text-muted-foreground backdrop-blur-sm"
						>
							<span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
							v1.0 Public Beta
						</Badge>
					</div>

					{/* Main Title with Typewriter */}
					<div className="mb-6 h-12 sm:h-16">
						<h1 className="font-mono text-3xl font-bold tracking-tighter sm:text-5xl">
							{text}
							<span className="animate-pulse text-muted-foreground">_</span>
						</h1>
					</div>

					{/* Subtitle */}
					<p
						className={cn(
							'mb-12 max-w-2xl font-mono text-sm text-muted-foreground/80 transition-all duration-1000 delay-500 ease-in-out sm:text-base',
							isMounted
								? 'translate-y-0 opacity-100'
								: 'translate-y-8 opacity-0',
						)}
					>
						The developer's hub for tracking CLI and editor releases.
						<br className="hidden sm:block" />
						All your tool updates in one terminal-like feed.
					</p>

					{/* Logo Showcase */}
					<div
						className={cn(
							'mb-16 w-full max-w-3xl transition-all duration-1000 delay-700 ease-in-out',
							isMounted
								? 'translate-y-0 opacity-100'
								: 'translate-y-8 opacity-0',
						)}
					>
						<div className="relative">
							{/* Fade edges */}
							<div className="absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-background to-transparent" />
							<div className="absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-background to-transparent" />
							<LogoShowcase />
						</div>
					</div>

					{/* Hero Release Card */}
					{heroRelease && (
						<div
							className={cn(
								'w-full transition-all duration-[1500ms] delay-1000 ease-in-out',
								isMounted
									? 'translate-y-0 opacity-100'
									: 'translate-y-12 opacity-0',
							)}
						>
							<div className="relative mx-auto max-w-3xl">
								{/* Glow effect behind card */}
								<div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-border via-foreground/5 to-border opacity-10 blur-2xl" />

								<HeroRelease
									toolSlug={heroRelease.tool.slug}
									toolName={heroRelease.tool.name}
									vendor={heroRelease.tool.vendor}
									version={heroRelease.version}
									formattedVersion={heroRelease.formattedVersion}
									releaseDate={heroRelease.releaseDate}
									headline={heroRelease.headline}
									summary={heroRelease.summary}
									changeCount={heroRelease._count.changes}
									changesByType={heroRelease.changesByType}
									hasBreaking={heroRelease.hasBreaking}
									hasSecurity={heroRelease.hasSecurity}
									hasDeprecation={heroRelease.hasDeprecation}
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</section>
	)
}
