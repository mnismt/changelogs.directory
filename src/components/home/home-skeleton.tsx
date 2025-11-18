function SkeletonBlock({ className }: { className?: string }) {
	return (
		<div
			className={`animate-pulse rounded bg-secondary/60 ${className ?? ''}`}
		/>
	)
}

export function HomePageSkeleton() {
	return (
		<div className="flex flex-col">
			<main className="flex-1">
				<section className="border-b border-border px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
					<div className="mx-auto max-w-4xl space-y-8">
						<div className="text-center">
							<SkeletonBlock className="mx-auto mb-4 h-10 w-64" />
							<SkeletonBlock className="mx-auto h-4 w-80" />
						</div>
						<SkeletonBlock className="h-24 rounded-sm border border-border/60 bg-secondary/40" />
						<div className="grid gap-6 md:grid-cols-[1fr,300px]">
							<SkeletonBlock className="h-72 border border-border/60 bg-secondary/40" />
							<SkeletonBlock className="h-72 border border-border/60 bg-secondary/40" />
						</div>
					</div>
				</section>

				<section className="px-4 py-12 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-7xl space-y-6 rounded-none border border-border/60 bg-card/40 p-6 md:rounded-sm">
						<SkeletonBlock className="h-12" />
						<SkeletonBlock className="h-10" />
						<SkeletonBlock className="h-8" />
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{HOME_FEED_SKELETON_KEYS.map((key) => (
								<div
									key={key}
									className="space-y-4 rounded border border-border/60 bg-card/60 p-4"
								>
									<SkeletonBlock className="h-4 w-24" />
									<SkeletonBlock className="h-6 w-40" />
									<SkeletonBlock className="h-4 w-full" />
									<SkeletonBlock className="h-4 w-3/4" />
									<div className="flex gap-2">
										<SkeletonBlock className="h-3 w-12" />
										<SkeletonBlock className="h-3 w-16" />
									</div>
								</div>
							))}
						</div>
						<SkeletonBlock className="mx-auto h-4 w-48" />
					</div>
				</section>
			</main>
		</div>
	)
}

const HOME_FEED_SKELETON_KEYS = [
	'home-feed-1',
	'home-feed-2',
	'home-feed-3',
	'home-feed-4',
	'home-feed-5',
	'home-feed-6',
] as const
