import { AnimatePresence, motion } from 'motion/react'
import { type FormEvent, useState } from 'react'
import { SubscribeTerminal } from '@/components/shared/subscribe-terminal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SubscribeFormProps {
	delay?: number
}

export function SubscribeForm({ delay = 0 }: SubscribeFormProps) {
	const [email, setEmail] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [showTerminal, setShowTerminal] = useState(false)

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError(null)

		const trimmedEmail = email.trim()
		if (!trimmedEmail) {
			setError('Enter an email to subscribe.')
			return
		}

		// Basic email validation
		if (!trimmedEmail.includes('@')) {
			setError('Please enter a valid email address.')
			return
		}

		// Switch to terminal view
		setShowTerminal(true)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
			className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-xl"
		>
			{/* Terminal header */}
			<div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-3">
				<div className="flex gap-1.5">
					<div className="size-3 rounded-full border border-red-500/50 bg-red-500/20" />
					<div className="size-3 rounded-full border border-yellow-500/50 bg-yellow-500/20" />
					<div className="size-3 rounded-full border border-green-500/50 bg-green-500/20" />
				</div>
				<span className="ml-2 font-mono text-xs text-muted-foreground">
					subscribe.sh
				</span>
			</div>

			<div className="p-6">
				<AnimatePresence mode="wait">
					{showTerminal ? (
						<motion.div
							key="terminal"
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.4, ease: 'circOut' }}
							className="min-h-[180px]"
						>
							<SubscribeTerminal
								email={email}
								onSuccess={() => {
									// Could redirect or show success state
								}}
								onError={() => {
									// Could reset or show retry option
								}}
							/>
						</motion.div>
					) : (
						<motion.div
							key="form"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3 }}
						>
							{/* Prompt */}
							<div className="mb-4 font-mono text-sm text-muted-foreground">
								<span className="text-green-500">~ %</span> Enter your email to
								join the feed
							</div>

							<form onSubmit={handleSubmit} noValidate>
								<div className="flex flex-col gap-3 sm:flex-row">
									<Input
										type="email"
										name="email"
										inputMode="email"
										autoComplete="email"
										placeholder="vibecoder@gmail.com"
										value={email}
										onChange={(e) => {
											setEmail(e.target.value)
											if (error) setError(null)
										}}
										className="h-12 flex-1 border-white/10 bg-white/5 px-4 font-mono text-base text-foreground placeholder:text-muted-foreground/60 focus:border-green-500/50 focus:ring-green-500/20 md:h-10 md:text-sm"
									/>
									<Button
										type="submit"
										variant="secondary"
										size="lg"
										className="h-12 font-mono text-xs uppercase tracking-wide sm:w-auto md:h-10"
									>
										<span className="relative flex h-2 w-2 mr-2">
											<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
											<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
										</span>
										Subscribe
									</Button>
								</div>

								{error && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										className="mt-3 font-mono text-xs text-red-500"
									>
										{error}
									</motion.div>
								)}
							</form>

							{/* Features hint */}
							<div className="mt-4 flex flex-wrap gap-2">
								{['Weekly digest', 'No spam', 'Unsubscribe anytime'].map(
									(feature) => (
										<span
											key={feature}
											className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-muted-foreground"
										>
											{feature}
										</span>
									),
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</motion.div>
	)
}
