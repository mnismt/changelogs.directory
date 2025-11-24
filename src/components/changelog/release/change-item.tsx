import { AlertTriangle, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ChangeItemProps {
	title: string
	description?: string | null
	platform?: string | null
	isBreaking?: boolean
	isSecurity?: boolean
	isDeprecation?: boolean
	links?: Array<{ url: string; text: string; type?: string }> | null
	media?: Array<{ type: 'video' | 'image'; url: string; alt?: string }> | null
}

export function ChangeItem({
	title,
	description,
	platform,
	isBreaking,
	isSecurity,
	isDeprecation,
	links,
	media,
}: ChangeItemProps) {
	return (
		<div className="flex gap-3 text-sm">
			<span className="shrink-0 text-muted-foreground">•</span>

			<div className="flex-1 space-y-2">
				<div className="flex flex-wrap items-start gap-2">
					{/* Platform badge */}
					{platform && (
						<Badge
							variant="outline"
							className="shrink-0 bg-card font-mono text-xs uppercase"
						>
							{platform}
						</Badge>
					)}

					{/* Warning indicators */}
					{isBreaking && (
						<Badge
							variant="destructive"
							className="shrink-0 font-mono text-xs uppercase"
						>
							<AlertTriangle className="mr-1 h-3 w-3" />
							Breaking
						</Badge>
					)}
					{isSecurity && (
						<Badge
							variant="destructive"
							className="shrink-0 font-mono text-xs uppercase"
						>
							<Shield className="mr-1 h-3 w-3" />
							Security
						</Badge>
					)}
					{isDeprecation && (
						<Badge
							variant="outline"
							className="shrink-0 border-yellow-500/50 bg-yellow-500/10 font-mono text-xs uppercase text-yellow-500"
						>
							Deprecated
						</Badge>
					)}

					{/* Title */}
					<span className="text-foreground">{title}</span>
				</div>

				{/* Description */}
				{description && <p className="text-muted-foreground">{description}</p>}

				{/* Media */}
				{media && media.length > 0 && (
					<div className="space-y-3">
						{media.map((item, index) => (
							<div
								key={`${item.type}-${index}`}
								className="overflow-hidden rounded-lg border border-border"
							>
								{item.type === 'video' ? (
									<video
										src={item.url}
										controls
										className="w-full max-w-2xl"
										preload="metadata"
									>
										<track kind="captions" />
									</video>
								) : (
									<img
										src={item.url}
										alt={item.alt || 'Changelog media'}
										className="w-full max-w-2xl"
										loading="lazy"
									/>
								)}
							</div>
						))}
					</div>
				)}

				{/* Links */}
				{links && links.length > 0 && (
					<div className="flex flex-wrap gap-3">
						{links.map((link) => (
							<a
								key={link.url}
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
							>
								{link.text || link.url}
							</a>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
