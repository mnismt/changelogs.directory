import { Link, useMatches } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { SparklesCore } from '@/components/ui/sparkles'
import { getToolLogo } from '@/lib/tool-logos'

interface ToolHeroProps {
	slug: string
	tool: {
		name: string
		description: string | null
		latestVersion: string | null
		formattedLatestVersion?: string | null
		homepage: string | null
		_count: {
			releases: number
		}
	}
}

export function ToolHero({ slug, tool }: ToolHeroProps) {
	const [systemStatus, setSystemStatus] = useState<'BOOTING' | 'READY'>(
		'BOOTING',
	)
	const matches = useMatches()
	const versionMatch = matches.find(
		(m) => m.routeId === '/tools/$slug/releases/$version',
	)
	const version = versionMatch?.params?.version
	const releaseData = versionMatch?.loaderData as
		| {
				release: {
					changes: unknown[]
					sourceUrl: string
					formattedVersion?: string
				}
		  }
		| undefined
	const release = releaseData?.release

	useEffect(() => {
		const timer = setTimeout(() => {
			setSystemStatus('READY')
		}, 3000)
		return () => clearTimeout(timer)
	}, [])

	const logo = getToolLogo(slug)

	// Check if user is viewing the latest version
	const isViewingLatest =
		version && tool.latestVersion && version === tool.latestVersion

	return (
		<div className="mb-16 relative">
			<div className="absolute inset-x-0 -top-20 -bottom-20 opacity-20 pointer-events-none">
				<SparklesCore
					background="transparent"
					minSize={0.4}
					maxSize={1}
					particleDensity={30}
					className="h-full w-full"
					particleColor="#FFFFFF"
				/>
			</div>

			<motion.div
				initial="hidden"
				animate="visible"
				variants={{
					hidden: { opacity: 0 },
					visible: {
						opacity: 1,
						transition: {
							staggerChildren: 0.1,
							delayChildren: 0.2,
						},
					},
				}}
				className="relative z-10 space-y-8"
			>
				{/* Breadcrumbs */}
				<motion.div
					variants={{
						hidden: { opacity: 0, y: -10 },
						visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
					}}
					className="flex items-center gap-2 font-mono text-sm text-muted-foreground"
				>
					<Link to="/" className="hover:text-foreground transition-colors">
						~
					</Link>
					<span>/</span>
					<Link to="/tools" className="hover:text-foreground transition-colors">
						tools
					</Link>
					<span>/</span>

					{/* Slug Segment */}
					{version ? (
						<Link
							to="/tools/$slug"
							params={{ slug }}
							className="hover:text-foreground transition-colors"
						>
							{slug}
						</Link>
					) : (
						<span className="text-foreground transition-colors">{slug}</span>
					)}

					{/* Version Segment (Animated) */}
					<AnimatePresence>
						{version && (
							<motion.div
								key="version-segment"
								initial={{ opacity: 0, x: -10, width: 0, marginLeft: -8 }}
								animate={{
									opacity: 1,
									x: 0,
									width: 'auto',
									marginLeft: 0,
									transition: {
										duration: 0.4,
										ease: 'circOut',
										marginLeft: { duration: 0.4, ease: 'circOut' },
									},
								}}
								exit={{
									opacity: 0,
									x: -10,
									width: 0,
									marginLeft: -8,
									transition: { duration: 0.3, ease: 'easeIn' },
								}}
								className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
							>
								<span>/</span>
								<span className="text-foreground">
									{release?.formattedVersion || version}
								</span>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>

				{/* Title & Logo */}
				<div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
					<motion.div
						variants={{
							hidden: { opacity: 0, scale: 0.8, rotate: -10 },
							visible: {
								opacity: 1,
								scale: 1,
								rotate: 0,
								transition: { type: 'spring', stiffness: 100, damping: 15 },
							},
						}}
						className="relative group"
					>
						<div className="absolute -inset-0.5 bg-gradient-to-br from-white/20 to-white/0 rounded-xl opacity-50 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
						<div className="relative flex size-20 md:size-24 items-center justify-center rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl">
							<div
								className="size-12 md:size-14 text-foreground [&>svg]:size-full [&>svg]:fill-foreground"
								data-testid="tool-logo"
							>
								{logo}
							</div>
						</div>
					</motion.div>

					<div className="space-y-2">
						<motion.h1
							variants={{
								hidden: { opacity: 0, x: -20 },
								visible: {
									opacity: 1,
									x: 0,
									transition: { duration: 0.5 },
								},
							}}
							className="font-mono text-4xl md:text-5xl font-bold tracking-tighter text-foreground"
						>
							{tool.name}
						</motion.h1>
						<motion.p
							variants={{
								hidden: { opacity: 0 },
								visible: {
									opacity: 1,
									transition: { duration: 0.5, delay: 0.2 },
								},
							}}
							className="text-lg text-muted-foreground max-w-2xl leading-relaxed"
						>
							{tool.description}
						</motion.p>
					</div>
				</div>

				{/* System Stats */}
				<motion.div
					variants={{
						hidden: { opacity: 0, width: '0%' },
						visible: {
							opacity: 1,
							width: '100%',
							transition: { duration: 0.8, ease: 'circOut' },
						},
					}}
					className="flex items-center gap-4 md:gap-8 font-mono text-xs text-muted-foreground border-y border-white/5 py-4 bg-white/[0.02] overflow-hidden"
				>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.8 }}
						className="flex items-center gap-6 md:gap-8 w-full"
					>
						{/* Status Indicator */}
						<div className="flex items-center gap-2 min-w-[140px]">
							<AnimatePresence mode="wait">
								{systemStatus === 'BOOTING' ? (
									<motion.div
										key="booting"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.5 }}
										className="flex items-center gap-2"
									>
										<span className="size-1.5 rounded-full bg-yellow-500/80 animate-pulse" />
										<span className="tracking-wider text-yellow-500/80">
											SYSTEM_CHECK...
										</span>
									</motion.div>
								) : version ? (
									isViewingLatest ? (
										<motion.div
											key="viewing-latest"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ duration: 0.5 }}
											className="flex items-center gap-2"
										>
											<span className="size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
											<span className="tracking-wider text-foreground">
												VIEWING:{' '}
												{release?.sourceUrl ? (
													<a
														href={release.sourceUrl}
														target="_blank"
														rel="noreferrer"
														className="text-green-400 underline decoration-green-400/50 decoration-2 underline-offset-4 hover:decoration-green-400 transition-colors"
													>
														{release?.formattedVersion || version}
													</a>
												) : (
													<span className="text-green-400">
														{release?.formattedVersion || version}
													</span>
												)}
												<span className="text-muted-foreground ml-2">
													(LATEST)
												</span>
											</span>
										</motion.div>
									) : (
										<motion.div
											key="viewing-old"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ duration: 0.5 }}
											className="flex items-center gap-2"
										>
											<span className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
											<span className="tracking-wider text-foreground">
												VIEWING:{' '}
												{release?.sourceUrl ? (
													<a
														href={release.sourceUrl}
														target="_blank"
														rel="noreferrer"
														className="text-amber-400 underline decoration-amber-400/50 decoration-2 underline-offset-4 hover:decoration-amber-400 transition-colors"
													>
														{release?.formattedVersion || version}
													</a>
												) : (
													<span className="text-amber-400">
														{release?.formattedVersion || version}
													</span>
												)}
											</span>
										</motion.div>
									)
								) : (
									<motion.div
										key="ready"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ duration: 0.5 }}
										className="flex items-center gap-2"
									>
										<span className="size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
										<span className="tracking-wider text-foreground">
											STATUS: ACTIVE
										</span>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{tool.latestVersion && !isViewingLatest && (
							<div className="flex items-center gap-2">
								{version ? (
									<Link
										to="/tools/$slug/releases/$version"
										params={{ slug, version: tool.latestVersion }}
										className="group flex items-center gap-2 hover:text-foreground transition-colors"
									>
										<span className="text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
											↗ LATEST:
										</span>
										<span className="text-foreground group-hover:text-green-400 transition-colors">
											{tool.formattedLatestVersion || tool.latestVersion}
										</span>
									</Link>
								) : (
									<>
										<span className="text-muted-foreground/70">
											LATEST_VER:
										</span>
										<span className="text-foreground">
											{tool.formattedLatestVersion || tool.latestVersion}
										</span>
									</>
								)}
							</div>
						)}

						<div className="hidden md:flex items-center gap-2">
							<span className="text-muted-foreground/70">
								{release ? 'CHANGES:' : 'TOTAL_RELEASES:'}
							</span>
							<span className="text-foreground">
								{release ? release.changes.length : tool._count.releases}
							</span>
						</div>

						{(tool.homepage || release?.sourceUrl) && (
							<a
								href={release?.sourceUrl || tool.homepage || '#'}
								target="_blank"
								rel="noreferrer"
								className="hidden md:flex group items-center gap-2 ml-auto px-3 py-1.5 rounded-sm border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
							>
								<span className="text-[10px] tracking-widest uppercase text-muted-foreground group-hover:text-foreground transition-colors">
									[ {release ? 'OPEN_CHANGELOG' : 'OPEN_HOMEPAGE'} ]
								</span>
							</a>
						)}
					</motion.div>
				</motion.div>
			</motion.div>
		</div>
	)
}
