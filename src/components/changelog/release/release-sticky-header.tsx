import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/date-utils'
import { formatVersionForDisplay } from '@/lib/version-formatter'

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
	return (
		<div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
			<div className="container mx-auto max-w-7xl px-4">
				<div className="flex h-14 items-center justify-between gap-4">
					{/* Version Display */}
					<div className="flex items-center gap-4">
						{logo && (
							<Link to="/tools/$slug" params={{ slug: toolSlug }}>
								<div className="[&>svg]:h-6 [&>svg]:w-6 [&>svg]:fill-foreground [&>svg_path]:fill-foreground">
									{logo}
								</div>
							</Link>
						)}
						<span className="font-mono text-sm font-semibold">
							{formatVersionForDisplay(version, toolSlug)}
						</span>

						{/* Version Switcher */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="cursor-pointer flex items-center gap-2 rounded border border-border bg-card px-3 py-1.5 text-sm font-mono transition-colors hover:border-accent"
								>
									Switch version
									<ChevronRight className="h-3 w-3" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="start"
								className="max-h-96 w-64 overflow-auto"
							>
								{allVersions.map((v) => (
									<DropdownMenuItem key={v.version} asChild>
										<Link
											to="/tools/$slug/releases/$version"
											params={{ slug: toolSlug, version: v.version }}
											className={`flex flex-col items-start gap-1 px-4 py-3 ${
												v.version === version
													? 'bg-secondary font-semibold'
													: ''
											}`}
										>
											<div className="font-mono">
												{formatVersionForDisplay(v.version, toolSlug)}
											</div>
											<div className="text-xs text-muted-foreground">
												{formatDate(v.releaseDate, 'MMM d, yyyy')} •{' '}
												{v._count.changes} changes
											</div>
										</Link>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
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
									to="/tools/$slug/releases/$version"
									params={{ slug: toolSlug, version: prevVersion }}
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
									to="/tools/$slug/releases/$version"
									params={{ slug: toolSlug, version: nextVersion }}
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
