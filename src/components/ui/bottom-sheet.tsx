import { AnimatePresence, motion, useDragControls } from "framer-motion"
import { X } from "lucide-react"
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
} from "react"
import { cn } from "@/lib/utils"

interface BottomSheetProps {
	open: boolean
	onClose: () => void
	children: ReactNode
	title?: string
	maxHeight?: string
	className?: string
}

const DRAG_THRESHOLD = 100

export function BottomSheet({
	open,
	onClose,
	children,
	title,
	maxHeight = "60vh",
	className,
}: BottomSheetProps) {
	const dragControls = useDragControls()
	const sheetRef = useRef<HTMLDivElement>(null)

	const handleDragEnd = useCallback(
		(_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
			if (info.offset.y > DRAG_THRESHOLD || info.velocity.y > 500) {
				onClose()
			}
		},
		[onClose],
	)

	useEffect(() => {
		if (!open) return

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose()
			}
		}

		document.addEventListener("keydown", handleEscape)
		document.body.style.overflow = "hidden"
		document.body.dataset.bottomSheetOpen = "true"

		return () => {
			document.removeEventListener("keydown", handleEscape)
			document.body.style.overflow = ""
			delete document.body.dataset.bottomSheetOpen
		}
	}, [open, onClose])

	useEffect(() => {
		if (open && sheetRef.current) {
			sheetRef.current.focus()
		}
	}, [open])

	return (
		<AnimatePresence>
			{open && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
						onClick={onClose}
						aria-hidden="true"
					/>

					{/* Sheet */}
					<motion.div
						ref={sheetRef}
						role="dialog"
						aria-modal="true"
						aria-label={title || "Bottom sheet"}
						tabIndex={-1}
						initial={{ y: "100%" }}
						animate={{ y: 0 }}
						exit={{ y: "100%" }}
						transition={{
							type: "spring",
							stiffness: 300,
							damping: 30,
						}}
						drag="y"
						dragControls={dragControls}
						dragConstraints={{ top: 0, bottom: 0 }}
						dragElastic={{ top: 0, bottom: 0.5 }}
						onDragEnd={handleDragEnd}
						className={cn(
							"fixed inset-x-0 bottom-0 z-50",
							"rounded-t-2xl border-t border-white/10",
							"bg-black/90 backdrop-blur-xl",
							"pb-[env(safe-area-inset-bottom)]",
							"focus:outline-none",
							className,
						)}
						style={{ maxHeight }}
					>
						{/* Drag Handle */}
						<div
							className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
							onPointerDown={(e) => dragControls.start(e)}
						>
							<div className="h-1 w-10 rounded-full bg-white/20" />
						</div>

						{/* Header */}
						{title && (
							<div className="flex items-center justify-between px-4 pb-3 border-b border-white/5">
								<h2 className="font-mono text-sm font-bold uppercase tracking-wider text-muted-foreground">
									{title}
								</h2>
								<button
									type="button"
									onClick={onClose}
									className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
									aria-label="Close"
								>
									<X className="size-4" />
								</button>
							</div>
						)}

						{/* Content */}
						<div className="overflow-y-auto overscroll-contain">
							{children}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}
