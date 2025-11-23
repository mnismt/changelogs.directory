function SkeletonBlock({ className }: { className?: string }) {
	return (
		<div
			className={`animate-pulse rounded bg-secondary/60 ${className ?? ''}`}
		/>
	)
}

export function ToolPageSkeleton() {
	return (
		<div className="container mx-auto max-w-7xl px-4 pt-20 pb-12">
			<div className="space-y-8">
				<div className="rounded border border-border/60 bg-card/60 p-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="space-y-3">
							<SkeletonBlock className="h-6 w-32" />
							<SkeletonBlock className="h-4 w-64" />
							<SkeletonBlock className="h-4 w-48" />
						</div>
						<SkeletonBlock className="h-10 w-32" />
					</div>
				</div>

				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<SkeletonBlock className="h-12 flex-1" />
					<SkeletonBlock className="h-12 w-full sm:w-56" />
				</div>

				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{TOOL_PAGE_SKELETON_KEYS.map((key) => (
						<div
							key={key}
							className="space-y-3 rounded border border-border/60 bg-card/60 p-5"
						>
							<SkeletonBlock className="h-4 w-24" />
							<SkeletonBlock className="h-6 w-40" />
							<SkeletonBlock className="h-4 w-full" />
							<SkeletonBlock className="h-4 w-3/4" />
							<div className="flex gap-2">
								<SkeletonBlock className="h-3 w-16" />
								<SkeletonBlock className="h-3 w-12" />
								<SkeletonBlock className="h-3 w-20" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

const TOOL_PAGE_SKELETON_KEYS = [
	'tool-card-1',
	'tool-card-2',
	'tool-card-3',
	'tool-card-4',
	'tool-card-5',
	'tool-card-6',
] as const
