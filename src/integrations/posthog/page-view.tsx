import { useRouter } from '@tanstack/react-router'
import posthog from 'posthog-js'
import { useEffect } from 'react'

export function PostHogPageView() {
	const router = useRouter()

	useEffect(() => {
		if (typeof window !== 'undefined' && posthog.__loaded) {
			posthog.capture('$pageview')
		}

		const unsubscribe = router.subscribe('onLoad', () => {
			if (typeof window !== 'undefined' && posthog.__loaded) {
				posthog.capture('$pageview')
			}
		})

		return () => unsubscribe()
	}, [router])

	return null
}
