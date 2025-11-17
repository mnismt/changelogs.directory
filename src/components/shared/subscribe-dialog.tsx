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

	useEffect(() => {
		setIsMounted(true)
	}, [])

	useEffect(() => {
		if (!open) return

		function handleKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		window.addEventListener('keydown', handleKeydown)
		return () => window.removeEventListener('keydown', handleKeydown)
	}, [open, onClose])

	if (!isMounted || !open) {
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
				className="absolute inset-0 bg-background/80 backdrop-blur"
				onClick={onClose}
				aria-label="Close subscribe dialog"
			/>
			<div className="relative z-10 w-full max-w-2xl animate-in fade-in duration-300">
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
				<SubscribeCta />
			</div>
		</div>,
		document.body,
	)
}
