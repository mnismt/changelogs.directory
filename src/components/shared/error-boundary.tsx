import { Link } from '@tanstack/react-router'
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
	title?: string
	message?: string
	detail?: string
	onRetry?: () => void
	homeLabel?: string
	retryLabel?: string
}

export function ErrorBoundaryCard({
	title = 'Something went wrong',
	message = 'An unexpected error occurred while loading this view.',
	detail,
	onRetry,
	homeLabel = 'Go home',
	retryLabel = 'Try again',
}: ErrorBoundaryProps) {
	const [showDetails, setShowDetails] = useState(false)

	return (
		<div className="mx-auto w-full max-w-3xl rounded border border-border bg-card/80 p-8 text-center">
			<div className="space-y-4">
				<div className="space-y-2">
					<p className="font-mono text-xs uppercase tracking-wide text-muted-foreground/80">
						System status
					</p>
					<h2 className="font-mono text-2xl text-foreground">{title}</h2>
					<p className="text-sm text-muted-foreground">{message}</p>
				</div>

				{detail ? (
					<div className="text-left">
						<button
							type="button"
							className="text-xs font-mono uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
							onClick={() => setShowDetails((prev) => !prev)}
						>
							{showDetails ? 'Hide details' : 'Show details'}
						</button>
						{showDetails ? (
							<pre className="mt-2 overflow-x-auto rounded border border-border/60 bg-secondary/60 p-3 text-left text-xs text-muted-foreground">
								{detail}
							</pre>
						) : null}
					</div>
				) : null}

				<div className="flex flex-col justify-center gap-3 sm:flex-row">
					<Button
						asChild
						variant="outline"
						className="border-border bg-card font-mono text-xs uppercase tracking-wide text-foreground hover:bg-card/80"
					>
						<Link to="/">{homeLabel}</Link>
					</Button>
					{onRetry ? (
						<Button
							type="button"
							onClick={onRetry}
							className="border border-border bg-foreground text-background hover:bg-foreground/90"
						>
							<RotateCcw className="mr-2 size-4" />
							<span className="font-mono text-xs uppercase tracking-wide">
								{retryLabel}
							</span>
						</Button>
					) : null}
				</div>
			</div>
		</div>
	)
}
