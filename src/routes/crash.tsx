import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/crash')({
	component: CrashPage,
})

function CrashPage() {
	useEffect(() => {
		throw new Error('This is a simulated system crash for testing purposes.')
	}, [])

	return (
		<div className="flex h-screen items-center justify-center">
			<p>Initiating crash sequence...</p>
		</div>
	)
}
