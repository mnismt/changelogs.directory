import { AlertTriangle, ArrowRight, Shield } from 'lucide-react'
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
		<div className="group relative pl-4 py-3 transition-all duration-300 hover:bg-white/[0.02] border-l-2 border-transparent hover:border-white/20 rounded-r-lg">
			<div className="space-y-3">
				<div className="flex flex-col gap-2">
					<div className="flex flex-wrap items-start gap-3">
						{/* Terminal Prefix */}
						<span className="font-mono text-muted-foreground/40 group-hover:text-accent group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] transition-all duration-300 mt-0.5">
							{'>'}
						</span>

						{/* Title */}
						<span className="text-base font-mono text-foreground/80 group-hover:text-foreground transition-colors flex-1">
							{title}
						</span>

						{/* Tags */}
						{(platform || isBreaking || isSecurity || isDeprecation) && (
							<div className="flex flex-wrap gap-2">
								{platform && (
									<Badge
										variant="outline"
										className="shrink-0 rounded-sm border-white/10 bg-white/5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
									>
										--{platform}
									</Badge>
								)}
								{isBreaking && (
									<Badge
										variant="destructive"
										className="shrink-0 rounded-sm font-mono text-[10px] uppercase tracking-wider bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
									>
										<AlertTriangle className="mr-1 h-3 w-3" />
										BREAKING
									</Badge>
								)}
								{isSecurity && (
									<Badge
										variant="destructive"
										className="shrink-0 rounded-sm font-mono text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20"
									>
										<Shield className="mr-1 h-3 w-3" />
										SECURITY
									</Badge>
								)}
								{isDeprecation && (
									<Badge
										variant="outline"
										className="shrink-0 rounded-sm border-yellow-500/20 bg-yellow-500/10 font-mono text-[10px] uppercase tracking-wider text-yellow-500"
									>
										DEPRECATED
									</Badge>
								)}
							</div>
						)}
					</div>

					{/* Description */}
					{description && (
						<div className="pl-6 border-l border-white/5 ml-1.5">
							<p className="text-sm text-muted-foreground/70 leading-relaxed max-w-3xl font-sans">
								{description}
							</p>
						</div>
					)}
				</div>

				{/* Media */}
				{media && media.length > 0 && (
					<div className="pl-6 ml-1.5 mt-4 grid gap-4 sm:grid-cols-2 max-w-4xl">
						{media.map((item, index) => (
							<div
								key={`${item.type}-${index}`}
								className="overflow-hidden rounded-sm border border-white/10 bg-black/40 group/media"
							>
								{item.type === 'video' ? (
									<video
										src={item.url}
										controls
										className="w-full"
										preload="metadata"
									>
										<track kind="captions" />
									</video>
								) : (
									<div className="relative overflow-hidden">
										<img
											src={item.url}
											alt={item.alt || 'Changelog media'}
											className="w-full object-cover transition-transform duration-700 group-hover/media:scale-105"
											loading="lazy"
										/>
										<div className="absolute inset-0 bg-white/0 group-hover/media:bg-white/5 transition-colors duration-300" />
									</div>
								)}
							</div>
						))}
					</div>
				)}

				{/* Links */}
				{links && links.length > 0 && (
					<div className="pl-6 ml-1.5 flex flex-wrap gap-4 pt-1">
						{links.map((link) => (
							<a
								key={link.url}
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								className="group/link flex items-center gap-1 text-xs font-mono text-muted-foreground transition-colors hover:text-accent"
							>
								<span>[{link.text || 'LINK'}]</span>
								<ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all group-hover/link:opacity-100 group-hover/link:translate-x-0" />
							</a>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
