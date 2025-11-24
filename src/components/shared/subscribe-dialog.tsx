import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SubscribeCta } from '@/components/home/subscribe-cta'
import { Button } from '@/components/ui/button'

interface SubscribeDialogProps {
	open: boolean
	onClose: () => void
}

export function SubscribeDialog({ open, onClose }: SubscribeDialogProps) {
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
				aria-label="Close subscribe dialog"
			/>
			<div
				className={`relative z-10 w-full max-w-2xl transition-all duration-300 ${
					phase === 'enter' || phase === 'exit'
						? 'translate-y-2 opacity-0'
						: 'translate-y-0 opacity-100'
				}`}
			>
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
				<SubscribeCta showStats />
			</div>
		</div>,
		document.body,
	)
}
