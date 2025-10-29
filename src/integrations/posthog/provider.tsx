import posthog from 'posthog-js'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
			const apiHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST

			if (apiKey && apiHost) {
				posthog.init(apiKey, {
					api_host: apiHost,
					person_profiles: 'identified_only',
					capture_pageview: true,
					capture_pageleave: true,
					defaults: '2025-05-24',
				})

				console.log('Posthog initialized!')
			}
		}
	}, [])

	return <>{children}</>
}
