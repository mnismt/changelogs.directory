import { useServerFn } from '@tanstack/react-start'
import { type FormEvent, useEffect, useId, useState } from 'react'
import { Area, AreaChart, XAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'
import { EncryptedText } from '@/components/ui/encrypted-text'
import { Input } from '@/components/ui/input'
import { getWaitlistDailySignups, getWaitlistStats } from '@/server/admin'
import { subscribeToWaitlist } from '@/server/waitlist'

interface SubscribeCtaProps {
	showStats?: boolean
}

const chartConfig: ChartConfig = {
	count: {
		label: 'Signups',
		color: '#e5e5e5',
	},
}

export function SubscribeCta({ showStats = false }: SubscribeCtaProps) {
	const subscribe = useServerFn(subscribeToWaitlist)
	const fetchStats = useServerFn(getWaitlistStats)
	const fetchDailySignups = useServerFn(getWaitlistDailySignups)
	const [email, setEmail] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Stats state
	const [statsData, setStatsData] = useState<{
		totalCount: number
		recentSignups: Array<{ id: number; email: string; createdAt: Date }>
	} | null>(null)
	const [chartData, setChartData] = useState<
		Array<{ date: string; count: number; displayDate: string }>
	>([])

	const inputId = useId()
	const descriptionId = useId()
	const successId = useId()
	const errorId = useId()
	const gradientId = useId()

	// Fetch stats when showStats is true
	useEffect(() => {
		if (!showStats) return

		async function loadStats() {
			try {
				const [stats, dailySignups] = await Promise.all([
					fetchStats(),
					fetchDailySignups(),
				])
				setStatsData(stats)
				setChartData(
					dailySignups.map((item) => {
						const date = new Date(item.date)
						return {
							...item,
							displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
						}
					}),
				)
			} catch {
				// Silently fail - stats are optional
			}
		}

		loadStats()
	}, [showStats, fetchStats, fetchDailySignups])

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
							placeholder="vibecoder@gmail.com"
							value={email}
							onChange={(event) => {
								setEmail(event.target.value)
								if (error) setError(null)
							}}
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

				<div className="-mt-1 min-h-5">
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

				{/* Stats section */}
				{showStats && statsData && (
					<div className="mt-4 border-t border-border pt-4">
						<div className="mb-3 flex items-center justify-between">
							<p className="font-mono text-xs text-muted-foreground">
								{statsData.totalCount} subscribers
							</p>
							<p className="font-mono text-xs text-muted-foreground">
								Last 30 days
							</p>
						</div>

						{/* Chart */}
						{chartData.length > 0 && (
							<div className="mb-4">
								<ChartContainer
									config={chartConfig}
									className="h-[100px] w-full"
								>
									<AreaChart
										data={chartData}
										margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
									>
										<defs>
											<linearGradient
												id={gradientId}
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="0%"
													stopColor="#e5e5e5"
													stopOpacity={0.3}
												/>
												<stop
													offset="100%"
													stopColor="#e5e5e5"
													stopOpacity={0.05}
												/>
											</linearGradient>
										</defs>
										<XAxis
											dataKey="displayDate"
											tickLine={false}
											axisLine={false}
											tick={false}
										/>
										<ChartTooltip
											content={
												<ChartTooltipContent
													labelFormatter={(value) => `${value}`}
												/>
											}
										/>
										<Area
											type="monotone"
											dataKey="count"
											stroke="#e5e5e5"
											strokeWidth={1.5}
											fill={`url(#${gradientId})`}
										/>
									</AreaChart>
								</ChartContainer>
							</div>
						)}

						{/* Recent signups */}
						{statsData.recentSignups.length > 0 && (
							<div>
								<p className="mb-2 font-mono text-xs text-muted-foreground">
									Recent signups
								</p>
								<ul className="space-y-1">
									{statsData.recentSignups.slice(0, 5).map((signup) => (
										<li
											key={signup.id}
											className="flex items-center justify-between"
										>
											<EncryptedText
												text={signup.email}
												className="font-mono text-xs text-foreground/80"
												revealDelayMs={80}
												flipDelayMs={60}
											/>
											<span className="font-mono text-xs text-muted-foreground">
												{new Date(signup.createdAt).toLocaleDateString(
													'en-US',
													{ month: 'short', day: 'numeric' },
												)}
											</span>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}
			</div>
		</Card>
	)
}
