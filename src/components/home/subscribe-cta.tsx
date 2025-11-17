import { useServerFn } from '@tanstack/react-start'
import { type FormEvent, useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { subscribeToWaitlist } from '@/server/waitlist'

export function SubscribeCta() {
	const subscribe = useServerFn(subscribeToWaitlist)
	const [email, setEmail] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const inputId = useId()
	const descriptionId = useId()
	const successId = useId()
	const errorId = useId()

	const feedbackId = error ? errorId : success ? successId : undefined

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError(null)
		setSuccess(null)

		const trimmedEmail = email.trim()
		if (!trimmedEmail) {
			setError('Enter an email to subscribe.')
			return
		}

		try {
			setIsSubmitting(true)
			const result = await subscribe({
				data: { email: trimmedEmail },
			})
			setSuccess(result.message ?? 'Added to the waitlist.')
			setEmail('')
		} catch (unknownError) {
			const message =
				unknownError instanceof Error
					? unknownError.message
					: 'Failed to subscribe. Please try again.'
			setError(message)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Card className="border-border bg-card/70 p-6 transition-all duration-500 hover:border-accent">
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
						Stay in the loop
					</p>
					<h3 className="font-mono text-2xl font-semibold text-foreground">
						Subscribe to updates
					</h3>
					<p
						id={descriptionId}
						className="max-w-2xl font-mono text-sm text-muted-foreground/80"
					>
						Get a single email when we add new tools, major releases, or command
						palette features. No spam, just changelog intel.
					</p>
				</div>

				<form
					className="flex flex-col gap-3 sm:flex-row sm:items-center"
					onSubmit={handleSubmit}
					noValidate
				>
					<div className="flex w-full flex-col gap-2">
						<label className="sr-only" htmlFor={inputId}>
							Email address
						</label>
						<Input
							id={inputId}
							name="email"
							type="email"
							inputMode="email"
							autoComplete="email"
							placeholder="name@protonmail.com"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							aria-describedby={
								feedbackId ? `${descriptionId} ${feedbackId}` : descriptionId
							}
							aria-invalid={Boolean(error)}
							className="font-mono text-sm text-foreground placeholder:text-muted-foreground/60"
						/>
					</div>

					<Button
						type="submit"
						variant="secondary"
						size="lg"
						disabled={isSubmitting}
						className="font-mono text-xs uppercase tracking-wide sm:w-auto"
					>
						{isSubmitting ? 'Submitting…' : 'Subscribe'}
					</Button>
				</form>

				<div className="min-h-6">
					{error && (
						<output
							id={errorId}
							aria-live="polite"
							className="font-mono text-xs text-destructive"
						>
							{error}
						</output>
					)}
					{success && !error && (
						<output
							id={successId}
							aria-live="polite"
							className="font-mono text-xs text-muted-foreground"
						>
							{success}
						</output>
					)}
				</div>
			</div>
		</Card>
	)
}
