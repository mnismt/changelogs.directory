import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'

interface CompareDialogProps {
	open: boolean
	onClose: () => void
}

export function CompareDialog({ open, onClose }: CompareDialogProps) {
	const [isMounted, setIsMounted] = useState(false)
	const [isVisible, setIsVisible] = useState(open)
	const [phase, setPhase] = useState<'enter' | 'exit' | null>(null)

	useEffect(() => {
		setIsMounted(true)
	}, [])

	useEffect(() => {
		function handleKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		if (open) {
			window.addEventListener('keydown', handleKeydown)
			return () => window.removeEventListener('keydown', handleKeydown)
		}
	}, [open, onClose])

	useEffect(() => {
		let raf: number | null = null
		let timeout: number | null = null

		if (open) {
			setIsVisible(true)
			setPhase('enter')
			raf = window.requestAnimationFrame(() => setPhase(null))
		} else {
			setPhase('exit')
			timeout = window.setTimeout(() => {
				setIsVisible(false)
				setPhase(null)
			}, 300)
		}

		return () => {
			if (raf) window.cancelAnimationFrame(raf)
			if (timeout) window.clearTimeout(timeout)
		}
	}, [open])

	if (!isMounted || !isVisible) {
		return null
	}

	return createPortal(
		<div
			className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10"
			role="dialog"
			aria-modal="true"
		>
			<button
				type="button"
				className={`absolute inset-0 bg-background/80 backdrop-blur transition-opacity duration-300 ${
					phase === 'enter' || phase === 'exit' ? 'opacity-0' : 'opacity-100'
				}`}
				onClick={onClose}
				aria-label="Close compare dialog"
			/>
			<div
				className={`relative z-10 w-full max-w-xl transition-all duration-300 ${
					phase === 'enter' || phase === 'exit'
						? 'translate-y-2 opacity-0'
						: 'translate-y-0 opacity-100'
				}`}
			>
				<div className="relative overflow-hidden rounded border border-border bg-card px-6 py-8">
					<div className="absolute -top-8 right-4 font-mono text-[120px] text-muted-foreground/5">
						{`//`}
					</div>
					<div className="absolute -bottom-10 left-6 font-mono text-[160px] text-muted-foreground/5">
						vs
					</div>
					<div className="absolute -right-3 -top-3">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="rounded-full border border-border bg-card font-mono text-xs uppercase transition-colors hover:text-foreground"
							onClick={onClose}
							aria-label="Close dialog"
						>
							<X className="size-4" />
						</Button>
					</div>

					<div className="space-y-4">
						<p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
							coming soon
						</p>
						<h2 className="font-mono text-3xl text-foreground">
							Compare mode is still in the lab.
						</h2>
						<p className="font-mono text-sm text-muted-foreground">
							We're cooking a split-screen diff viewer that lets you pit editor
							releases against one another, feature by feature. Think
							side-by-side commits with a UI worthy of your caffeine habit.
						</p>
						<div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase text-muted-foreground/80">
							<span className="rounded border border-border px-3 py-1">
								grid overlays
							</span>
							<span className="rounded border border-border px-3 py-1">
								diff summaries
							</span>
							<span className="rounded border border-border px-3 py-1">
								keybinding heatmaps
							</span>
						</div>
						<p className="font-mono text-xs text-muted-foreground">
							Ping us if you want early access—we'll pull you into the private
							build as soon as it's spicy enough.
						</p>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	)
}
