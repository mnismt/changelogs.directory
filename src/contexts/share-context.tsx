import { type ReactNode, useCallback, useEffect, useState } from 'react'

/**
 * Share context using DOM data attributes for cross-tree communication.
 *
 * The MobileDock is rendered in RootDocument (shell), while ShareProvider
 * is in route components. They're in separate React trees, so we use
 * document.body.dataset as a communication bridge.
 *
 * - ShareProvider sets `data-share-available="true"` on body
 * - MobileDock observes this attribute via MutationObserver
 * - Share action is triggered via custom event
 */

const SHARE_AVAILABLE_ATTR = 'data-share-available'
const SHARE_EVENT = 'share-release'

/**
 * Hook for MobileDock to check if share is available and trigger share action
 */
export function useShare() {
	const [isAvailable, setIsAvailable] = useState(false)

	useEffect(() => {
		const checkShareAvailable = () => {
			setIsAvailable(document.body.dataset.shareAvailable === 'true')
		}

		// Check initially
		checkShareAvailable()

		// Watch for changes
		const observer = new MutationObserver(checkShareAvailable)
		observer.observe(document.body, {
			attributes: true,
			attributeFilter: [SHARE_AVAILABLE_ATTR],
		})

		return () => observer.disconnect()
	}, [])

	const onShare = useCallback(() => {
		document.dispatchEvent(new CustomEvent(SHARE_EVENT))
	}, [])

	return { isAvailable, onShare }
}

/**
 * Provider component that marks share as available and listens for share events
 */
export function ShareProvider({
	children,
	onShare,
}: {
	children: ReactNode
	onShare: () => void
}) {
	// Set share available on mount, clear on unmount
	useEffect(() => {
		document.body.dataset.shareAvailable = 'true'

		return () => {
			delete document.body.dataset.shareAvailable
		}
	}, [])

	// Listen for share events from MobileDock
	useEffect(() => {
		const handleShare = () => {
			onShare()
		}

		document.addEventListener(SHARE_EVENT, handleShare)
		return () => document.removeEventListener(SHARE_EVENT, handleShare)
	}, [onShare])

	return <>{children}</>
}
