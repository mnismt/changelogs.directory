import { type ReactNode, useEffect } from 'react'
import { initSentry } from '@/integrations/sentry'

export function SentryProvider({ children }: { children: ReactNode }) {
	useEffect(() => {
		initSentry()
	}, [])

	return children
}
