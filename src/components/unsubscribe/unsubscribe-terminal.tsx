import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { unsubscribeFromWaitlist } from '@/server/waitlist'

interface UnsubscribeTerminalProps {
	email: string
}

type StepStatus = 'pending' | 'running' | 'success' | 'error'

interface Step {
	id: string
	label: string
	status: StepStatus
}

export function UnsubscribeTerminal({ email }: UnsubscribeTerminalProps) {
	const unsubscribe = useServerFn(unsubscribeFromWaitlist)
	const [isMounted, setIsMounted] = useState(false)
	const [bootSequence, setBootSequence] = useState<
		{ id: string; text: string }[]
	>([])
	const [showPrompt, setShowPrompt] = useState(false)
	const [typedCommand, setTypedCommand] = useState('')
	const [steps, setSteps] = useState<Step[]>([
		{
			id: 'init',
			label: 'Initializing subscription removal...',
			status: 'pending',
		},
		{
			id: 'validate',
			label: 'Validating email address...',
			status: 'pending',
		},
		{
			id: 'queue',
			label: 'Processing unsubscription request...',
			status: 'pending',
		},
		{ id: 'done', label: 'Unsubscription complete.', status: 'pending' },
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

		const bootLines = [
			'changelogs --zsh -- 80x24',
			'Last login: ' + new Date().toUTCString(),
		]

		let delay = 0
		bootLines.forEach((line, index) => {
			delay += 300
			setTimeout(() => {
				setBootSequence((prev) => [
					...prev,
					{ id: `boot-${Date.now()}-${index}`, text: line },
				])
				if (index === bootLines.length - 1) {
					setTimeout(() => setShowPrompt(true), 500)
				}
			}, delay)
		})
	}, [isMounted])

	// Typing animation
	useEffect(() => {
		if (!showPrompt) return

		const command = `unsubscribe --email=${email}`
		let index = 0
		const interval = setInterval(() => {
			if (index <= command.length) {
				setTypedCommand(command.slice(0, index))
				index++
			} else {
				clearInterval(interval)
				// Start execution after typing finishes
				setTimeout(executeUnsubscribe, 800)
			}
		}, 50)

		return () => clearInterval(interval)
	}, [showPrompt, email])

	const updateStep = (id: string, status: StepStatus) => {
		setSteps((prev) =>
			prev.map((step) => (step.id === id ? { ...step, status } : step)),
		)
	}

	const executeUnsubscribe = async () => {
		// Step 1: Init
		updateStep('init', 'running')
		await new Promise((r) => setTimeout(r, 600))
		updateStep('init', 'success')

		// Step 2: Validate
		updateStep('validate', 'running')
		await new Promise((r) => setTimeout(r, 800))

		if (!email || !email.includes('@')) {
			updateStep('validate', 'error')
			setFinalMessage({
				text: 'Error: Invalid email format provided.',
				type: 'error',
			})
			return
		}
		updateStep('validate', 'success')

		// Step 3: Queue/Process
		updateStep('queue', 'running')
		try {
			const result = await unsubscribe({ data: { email } })

			if (result.success) {
				updateStep('queue', 'success')
				await new Promise((r) => setTimeout(r, 400))
				updateStep('done', 'success')
				setFinalMessage({
					text: 'You have been successfully unsubscribed.',
					type: 'success',
				})
			} else {
				updateStep('queue', 'error')
				setFinalMessage({
					text: `Error: ${result.message}`,
					type: 'error',
				})
			}
		} catch (_error) {
			updateStep('queue', 'error')
			setFinalMessage({
				text: 'System Error: Failed to process request.',
				type: 'error',
			})
		}
	}

	return (
		<div className="w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-[#0c0c0c] shadow-2xl font-mono text-sm">
			{/* Terminal Header */}
			<div className="flex items-center gap-2 border-b border-border/40 bg-card/50 px-4 py-2">
				<div className="flex gap-1.5">
					<div className="size-3 rounded-full bg-red-500/80" />
					<div className="size-3 rounded-full bg-yellow-500/80" />
					<div className="size-3 rounded-full bg-green-500/80" />
				</div>
				<div className="flex-1 text-center text-xs text-muted-foreground/60">
					changelogs — -zsh — 80x24
				</div>
			</div>

			{/* Terminal Body */}
			<div className="min-h-[400px] p-6 text-foreground/90 font-mono">
				{/* Boot Sequence */}
				<div className="mb-6 space-y-1 text-muted-foreground/60">
					{bootSequence.map((line) => (
						<div key={line.id}>{line.text}</div>
					))}
				</div>

				{/* Prompt & Command */}
				{showPrompt && (
					<div className="mb-6">
						<div className="flex items-center gap-2">
							<span className="text-green-500">~ %</span>
							<span className="text-foreground">{typedCommand}</span>
							{typedCommand.length < `unsubscribe --email=${email}`.length && (
								<span className="animate-pulse bg-foreground/60 w-2 h-4 block" />
							)}
						</div>
					</div>
				)}

				{/* Execution Steps */}
				<div className="space-y-2">
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
					<div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
						<div className="border-t border-dashed border-border/40 pt-8 text-center">
							<div
								className={cn(
									'inline-flex items-center gap-2 rounded px-3 py-1 text-xs font-medium uppercase tracking-wider mb-6',
									finalMessage.type === 'success'
										? 'bg-green-500/10 text-green-500'
										: 'bg-red-500/10 text-red-500',
								)}
							>
								<div
									className={cn(
										'size-1.5 rounded-full animate-pulse',
										finalMessage.type === 'success'
											? 'bg-green-500'
											: 'bg-red-500',
									)}
								/>
								{finalMessage.type === 'success'
									? 'Unsubscription: Active'
									: 'Unsubscription: Failed'}
							</div>

							<h2 className="text-2xl font-bold text-foreground mb-2">
								{finalMessage.type === 'success'
									? 'You have left the directory'
									: 'Operation Aborted'}
							</h2>
							<p className="text-muted-foreground mb-8 text-sm">
								{finalMessage.type === 'success'
									? '// Your email has been removed from our notification queue'
									: '// ' + finalMessage.text}
							</p>

							{finalMessage.type === 'success' && (
								<div className="max-w-md mx-auto bg-card/30 rounded border border-border/40 p-4 mb-8 text-left">
									<div className="text-xs text-muted-foreground mb-2">
										$ cat ~/.config/notifications
									</div>
									<div className="space-y-2 text-xs">
										<div className="flex gap-2 opacity-50 line-through">
											<span className="text-green-500">→</span>
											<span className="font-bold">NEW_TOOLS</span>
											<span className="text-muted-foreground">
												Fresh additions to the directory
											</span>
										</div>
										<div className="flex gap-2 opacity-50 line-through">
											<span className="text-green-500">→</span>
											<span className="font-bold">MAJOR_RELEASES</span>
											<span className="text-muted-foreground">
												Significant version updates
											</span>
										</div>
									</div>
								</div>
							)}

							<Link
								to="/"
								className="inline-flex items-center justify-center h-10 px-8 rounded bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
							>
								[ RETURN_HOME ]
							</Link>

							<div className="mt-8 text-xs text-muted-foreground/40">
								— The changelogs.directory team
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
