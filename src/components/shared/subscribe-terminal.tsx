import { useServerFn } from '@tanstack/react-start'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { subscribeToWaitlist } from '@/server/waitlist'

interface SubscribeTerminalProps {
	email: string
	onSuccess?: () => void
	onError?: () => void
}

type StepStatus = 'pending' | 'running' | 'success' | 'error'

interface Step {
	id: string
	label: string
	status: StepStatus
}

export function SubscribeTerminal({
	email,
	onSuccess,
	onError,
}: SubscribeTerminalProps) {
	const subscribe = useServerFn(subscribeToWaitlist)
	const [isMounted, setIsMounted] = useState(false)
	const [bootSequence, setBootSequence] = useState<
		{ id: string; text: string }[]
	>([])
	const [showPrompt, setShowPrompt] = useState(false)
	const [typedCommand, setTypedCommand] = useState('')
	const [steps, setSteps] = useState<Step[]>([
		{
			id: 'init',
			label: 'Initializing secure connection...',
			status: 'pending',
		},
		{
			id: 'validate',
			label: 'Validating email syntax...',
			status: 'pending',
		},
		{
			id: 'register',
			label: 'Registering to notification queue...',
			status: 'pending',
		},
		{ id: 'done', label: 'Subscription active.', status: 'pending' },
	])
	const [finalMessage, setFinalMessage] = useState<{
		text: string
		type: 'success' | 'error'
	} | null>(null)

	// Mount effect
	useEffect(() => {
		setIsMounted(true)
	}, [])

	// Boot sequence animation
	useEffect(() => {
		if (!isMounted) return

		const bootLines = ['changelogs --subscribe --force']

		let delay = 0
		bootLines.forEach((line, index) => {
			delay += 200
			setTimeout(() => {
				setBootSequence((prev) => [
					...prev,
					{ id: `boot-${Date.now()}-${index}`, text: line },
				])
				if (index === bootLines.length - 1) {
					setTimeout(() => setShowPrompt(true), 300)
				}
			}, delay)
		})
	}, [isMounted])

	// Typing animation
	useEffect(() => {
		if (!showPrompt) return

		const command = `subscribe --email=${email}`
		let index = 0
		const interval = setInterval(() => {
			if (index <= command.length) {
				setTypedCommand(command.slice(0, index))
				index++
			} else {
				clearInterval(interval)
				// Start execution after typing finishes
				setTimeout(executeSubscribe, 600)
			}
		}, 40)

		return () => clearInterval(interval)
	}, [showPrompt, email])

	const updateStep = (id: string, status: StepStatus) => {
		setSteps((prev) =>
			prev.map((step) => (step.id === id ? { ...step, status } : step)),
		)
	}

	const executeSubscribe = async () => {
		// Step 1: Init
		updateStep('init', 'running')
		await new Promise((r) => setTimeout(r, 400))
		updateStep('init', 'success')

		// Step 2: Validate
		updateStep('validate', 'running')
		await new Promise((r) => setTimeout(r, 500))

		if (!email || !email.includes('@')) {
			updateStep('validate', 'error')
			setFinalMessage({
				text: 'Error: Invalid email format.',
				type: 'error',
			})
			onError?.()
			return
		}
		updateStep('validate', 'success')

		// Step 3: Register
		updateStep('register', 'running')
		try {
			const result = await subscribe({ data: { email } })

			if (result.success) {
				updateStep('register', 'success')
				await new Promise((r) => setTimeout(r, 300))
				updateStep('done', 'success')
				setFinalMessage({
					text: 'Welcome to the directory.',
					type: 'success',
				})
				onSuccess?.()
			} else {
				updateStep('register', 'error')
				setFinalMessage({
					text: `Error: ${result.message}`,
					type: 'error',
				})
				onError?.()
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error'
			updateStep('register', 'error')
			setFinalMessage({
				text: `System Error: ${message}`,
				type: 'error',
			})
			onError?.()
		}
	}

	return (
		<div className="w-full font-mono text-xs sm:text-sm">
			{/* Boot Sequence */}
			<div className="mb-4 space-y-1 text-muted-foreground/60">
				{bootSequence.map((line) => (
					<div key={line.id}>{line.text}</div>
				))}
			</div>

			{/* Prompt & Command */}
			{showPrompt && (
				<div className="mb-4">
					<div className="flex items-center gap-2">
						<span className="text-green-500">~ %</span>
						<span className="text-foreground">{typedCommand}</span>
						{typedCommand.length < `subscribe --email=${email}`.length && (
							<span className="animate-pulse bg-foreground/60 w-2 h-4 block" />
						)}
					</div>
				</div>
			)}

			{/* Execution Steps */}
			<div className="space-y-2 mb-6">
				{steps.map((step) => (
					<div
						key={step.id}
						className={cn(
							'flex items-center gap-3 transition-opacity duration-300',
							step.status === 'pending' ? 'opacity-0 hidden' : 'opacity-100',
						)}
					>
						<div className="w-4 flex justify-center">
							{step.status === 'running' && (
								<Loader2 className="size-3 animate-spin text-blue-500" />
							)}
							{step.status === 'success' && (
								<span className="text-green-500">[✓]</span>
							)}
							{step.status === 'error' && (
								<span className="text-red-500">[✗]</span>
							)}
						</div>
						<span
							className={cn(
								step.status === 'error'
									? 'text-red-400'
									: step.status === 'success'
										? 'text-muted-foreground'
										: 'text-foreground',
							)}
						>
							{step.label}
						</span>
					</div>
				))}
			</div>

			{/* Final Message */}
			{finalMessage && (
				<div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
					<div
						className={cn(
							'rounded border px-4 py-3',
							finalMessage.type === 'success'
								? 'border-green-500/20 bg-green-500/5 text-green-500'
								: 'border-red-500/20 bg-red-500/5 text-red-500',
						)}
					>
						<div className="flex items-center gap-2 font-bold">
							<div
								className={cn(
									'size-2 rounded-full animate-pulse',
									finalMessage.type === 'success'
										? 'bg-green-500'
										: 'bg-red-500',
								)}
							/>
							{finalMessage.type === 'success'
								? 'SUBSCRIPTION CONFIRMED'
								: 'OPERATION FAILED'}
						</div>
						<div className="mt-1 text-xs opacity-80">
							{finalMessage.type === 'success'
								? '// You will receive the next dispatch.'
								: `// ${finalMessage.text}`}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
