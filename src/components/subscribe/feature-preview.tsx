import { X } from 'lucide-react'
import { motion } from 'motion/react'

interface FeaturePreviewProps {
	featureId: string
	featureTitle: string
	onClose: () => void
	htmlPreview?: string
	hasReleases?: boolean
}

export function FeaturePreview({
	featureId,
	featureTitle,
	onClose,
	htmlPreview,
	hasReleases,
}: FeaturePreviewProps) {
	return (
		<motion.div
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: 'auto' }}
			exit={{ opacity: 0, height: 0 }}
			transition={{ duration: 0.4, ease: 'easeOut' }}
			className="overflow-hidden"
		>
			<div className="rounded-xl border border-green-500/20 bg-green-500/[0.02] backdrop-blur-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-green-500/10 px-4 py-3">
					<div className="flex items-center gap-2">
						<div className="flex gap-1.5">
							<div className="size-2.5 rounded-full border border-red-500/50 bg-red-500/20" />
							<div className="size-2.5 rounded-full border border-yellow-500/50 bg-yellow-500/20" />
							<div className="size-2.5 rounded-full border border-green-500/50 bg-green-500/20" />
						</div>
						<span className="ml-2 font-mono text-xs text-muted-foreground">
							preview — {featureTitle.toLowerCase()}
						</span>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
					>
						<X className="size-4" />
					</button>
				</div>

				{/* Preview content based on feature */}
				<div className="p-4">
					{featureId === 'weekly-digest' && (
						<WeeklyDigestPreview
							htmlPreview={htmlPreview}
							hasReleases={hasReleases}
						/>
					)}
				</div>
			</div>
		</motion.div>
	)
}

function WeeklyDigestPreview({
	htmlPreview,
	hasReleases,
}: {
	htmlPreview?: string
	hasReleases?: boolean
}) {
	if (!hasReleases) {
		return (
			<div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center">
				<p className="font-mono text-sm text-muted-foreground">
					<span className="text-muted-foreground/60">{'//'}</span> No releases
					this week — digest would be skipped
				</p>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{/* Real email in iframe */}
			<div className="overflow-hidden rounded-lg border border-white/10">
				<iframe
					srcDoc={htmlPreview}
					title="Weekly Digest Preview"
					className="h-[500px] w-full border-0 bg-white"
					sandbox="allow-same-origin"
				/>
			</div>

			{/* Caption */}
			<p className="text-center font-mono text-xs text-muted-foreground/60">
				<span className="text-green-500/60">{'//'}</span> Live preview with real
				data — sent every Monday
			</p>
		</div>
	)
}
