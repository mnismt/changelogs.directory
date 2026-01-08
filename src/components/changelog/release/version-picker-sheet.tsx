import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { formatDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface VersionPickerSheetProps {
	open: boolean
	onClose: () => void
	currentVersion: string
	versions: Array<{
		version: string
		formattedVersion?: string
		releaseDate: Date | null
		_count: { changes: number }
	}>
	toolSlug: string
}

export function VersionPickerSheet({
	open,
	onClose,
	currentVersion,
	versions,
	toolSlug,
}: VersionPickerSheetProps) {
	const [search, setSearch] = useState('')
	const listRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	// Fuzzy filter (matches anywhere in version string)
	const filteredVersions = useMemo(() => {
		if (!search.trim()) return versions
		const query = search.toLowerCase()
		return versions.filter(
			(v) =>
				(v.formattedVersion || v.version).toLowerCase().includes(query) ||
				v.version.toLowerCase().includes(query),
		)
	}, [versions, search])

	// Group by month
	const groupedVersions = useMemo(() => {
		const groups: Record<string, typeof filteredVersions> = {}
		for (const v of filteredVersions) {
			const key = v.releaseDate
				? format(new Date(v.releaseDate), 'MMMM yyyy').toUpperCase()
				: 'UNKNOWN'
			if (!groups[key]) groups[key] = []
			groups[key].push(v)
		}
		return groups
	}, [filteredVersions])

	// Auto-scroll to current on open
	useEffect(() => {
		if (open && listRef.current) {
			requestAnimationFrame(() => {
				const current = listRef.current?.querySelector('[data-current="true"]')
				current?.scrollIntoView({ block: 'center', behavior: 'instant' })
			})
		}
	}, [open])

	// Clear search on close
	useEffect(() => {
		if (!open) {
			setSearch('')
		}
	}, [open])

	// Focus input on open
	useEffect(() => {
		if (open) {
			requestAnimationFrame(() => {
				inputRef.current?.focus()
			})
		}
	}, [open])

	return (
		<BottomSheet open={open} onClose={onClose} title="// SELECT_VERSION">
			{/* Search input - sticky */}
			<div className="sticky top-0 z-10 px-4 py-3 bg-black/90 backdrop-blur-xl border-b border-white/5">
				<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
					<Search className="size-4 text-muted-foreground shrink-0" />
					<input
						ref={inputRef}
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="search version..."
						className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
					/>
					{search && (
						<button
							type="button"
							onClick={() => setSearch('')}
							className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
						>
							<X className="size-4 text-muted-foreground" />
						</button>
					)}
				</div>
			</div>

			{/* Version list with month groups */}
			<div ref={listRef} className="max-h-[50vh] overflow-y-auto pb-6">
				{Object.entries(groupedVersions).length > 0 ? (
					Object.entries(groupedVersions).map(([month, monthVersions]) => (
						<div key={month}>
							{/* Month header */}
							<div className="sticky top-0 px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-white/5">
								<span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
									{`// ${month}`}
								</span>
							</div>

							{/* Versions in this month */}
							{monthVersions.map((version) => {
								const isCurrent = version.version === currentVersion

								const content = (
									<>
										<div className="flex items-center gap-3">
											{isCurrent ? (
												<span className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
											) : (
												<span className="size-2" />
											)}
											<span className="font-mono text-sm font-bold">
												{version.formattedVersion || version.version}
											</span>
										</div>
										<div className="flex items-center gap-4 text-muted-foreground">
											<span className="text-xs font-mono">
												{formatDate(version.releaseDate, 'MMM d')}
											</span>
											<span className="text-xs font-mono text-foreground/60">
												{version._count.changes} changes
											</span>
										</div>
									</>
								)

								if (isCurrent) {
									return (
										<div
											key={version.version}
											data-current="true"
											className={cn(
												'flex items-center justify-between p-4',
												'border-b border-white/5',
												'bg-white/[0.02]',
											)}
										>
											{content}
										</div>
									)
								}

								return (
									<Link
										key={version.version}
										to="/tools/$slug/releases/$version"
										params={{ slug: toolSlug, version: version.version }}
										onClick={onClose}
										className={cn(
											'flex items-center justify-between p-4',
											'border-b border-white/5',
											'hover:bg-white/5 transition-colors',
										)}
									>
										{content}
									</Link>
								)
							})}
						</div>
					))
				) : (
					<div className="px-4 py-12 text-center">
						<p className="font-mono text-sm text-muted-foreground">
							No versions matching "{search}"
						</p>
					</div>
				)}
			</div>
		</BottomSheet>
	)
}
