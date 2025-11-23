function SkeletonBlock({ className }: { className?: string }) {
	return (
		<div
			className={`animate-pulse rounded bg-secondary/60 ${className ?? ''}`}
		/>
	)
}

export function ReleaseDetailSkeleton() {
	return (
		<div className="container mx-auto max-w-7xl px-4 py-12">
			<div className="space-y-6">
				<SkeletonBlock className="h-6 w-40" />
				<SkeletonBlock className="h-12 w-80" />
				<SkeletonBlock className="h-4 w-64" />
				<SkeletonBlock className="h-4 w-56" />

				<div className="space-y-4 rounded border border-border/60 bg-card/60 p-6">
					<SkeletonBlock className="h-5 w-48" />
					<SkeletonBlock className="h-4 w-full" />
					<SkeletonBlock className="h-4 w-5/6" />
				</div>

				<div className="space-y-3">
					{RELEASE_DETAIL_SKELETON_KEYS.map((key) => (
						<div
							key={key}
							className="rounded border border-border/60 bg-card/60 p-4"
						>
							<SkeletonBlock className="mb-3 h-4 w-32" />
							<SkeletonBlock className="h-4 w-full" />
							<SkeletonBlock className="mt-2 h-4 w-5/6" />
							<SkeletonBlock className="mt-2 h-4 w-2/3" />
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

const RELEASE_DETAIL_SKELETON_KEYS = [
	'release-skeleton-1',
	'release-skeleton-2',
	'release-skeleton-3',
] as const
