import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ReleaseStickyHeaderProps {
	toolSlug: string
	version: string
	prevVersion: string | null
	nextVersion: string | null
	allVersions: Array<{
		version: string
		releaseDate: Date | null
		_count: { changes: number }
	}>
	logo?: React.ReactNode
}

export function ReleaseStickyHeader({
	toolSlug,
	version,
	prevVersion,
	nextVersion,
	allVersions,
	logo,
}: ReleaseStickyHeaderProps) {
	const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false)

	return (
		<div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
			<div className="container mx-auto max-w-7xl px-4">
				<div className="flex h-14 items-center justify-between gap-4">
					{/* Version Display */}
					<div className="flex items-center gap-4">
						{logo && (
							<div className="[&>svg]:h-6 [&>svg]:w-6 [&>svg]:fill-foreground [&>svg_path]:fill-foreground">
								{logo}
							</div>
						)}
						<span className="font-mono text-sm font-semibold">{version}</span>

						{/* Version Switcher */}
						<div className="relative">
							<button
								type="button"
								onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
								className="flex items-center gap-2 rounded border border-border bg-card px-3 py-1.5 text-sm font-mono transition-colors hover:border-accent"
							>
								Switch version
								<ChevronRight
									className={`h-3 w-3 transition-transform ${
										isVersionDropdownOpen ? 'rotate-90' : ''
									}`}
								/>
							</button>

							{/* Dropdown */}
							{isVersionDropdownOpen && (
								<>
									{/* biome-ignore lint/a11y/useKeyWithClickEvents: This is an overlay backdrop that closes the dropdown */}
									{/* biome-ignore lint/a11y/noStaticElementInteractions: This is an overlay backdrop that closes the dropdown */}
									<div
										className="fixed inset-0 z-40"
										onClick={() => setIsVersionDropdownOpen(false)}
									/>
									<div className="absolute left-0 top-full z-50 mt-2 max-h-96 w-64 overflow-auto rounded-lg border border-border bg-card shadow-lg">
										{allVersions.map((v) => (
											<Link
												key={v.version}
												to="/tools/$toolSlug/releases/$version"
												params={{ toolSlug, version: v.version }}
												onClick={() => setIsVersionDropdownOpen(false)}
												className={`block border-b border-border px-4 py-3 text-sm transition-colors hover:bg-accent last:border-b-0 ${
													v.version === version
														? 'bg-secondary font-semibold'
														: ''
												}`}
											>
												<div className="font-mono">{v.version}</div>
												<div className="text-xs text-muted-foreground">
													{v.releaseDate
														? new Date(v.releaseDate).toLocaleDateString(
																'en-US',
																{
																	year: 'numeric',
																	month: 'short',
																	day: 'numeric',
																},
															)
														: 'Date unknown'}{' '}
													• {v._count.changes} changes
												</div>
											</Link>
										))}
									</div>
								</>
							)}
						</div>
					</div>

					{/* Navigation Buttons */}
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={!prevVersion}
							asChild={!!prevVersion}
							className="gap-1 font-mono text-xs"
						>
							{prevVersion ? (
								<Link
									to="/tools/$toolSlug/releases/$version"
									params={{ toolSlug, version: prevVersion }}
								>
									<ChevronLeft className="h-3 w-3" />
									Prev
								</Link>
							) : (
								<>
									<ChevronLeft className="h-3 w-3" />
									Prev
								</>
							)}
						</Button>

						<Button
							variant="outline"
							size="sm"
							disabled={!nextVersion}
							asChild={!!nextVersion}
							className="gap-1 font-mono text-xs"
						>
							{nextVersion ? (
								<Link
									to="/tools/$toolSlug/releases/$version"
									params={{ toolSlug, version: nextVersion }}
								>
									Next
									<ChevronRight className="h-3 w-3" />
								</Link>
							) : (
								<>
									Next
									<ChevronRight className="h-3 w-3" />
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
