import { useServerFn } from '@tanstack/react-start'
import { AnimatePresence, motion } from 'motion/react'
import { type FormEvent, useEffect, useId, useState } from 'react'
import { Area, AreaChart, XAxis } from 'recharts'
import { SubscribeTerminal } from '@/components/shared/subscribe-terminal'
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
import { maskEmail } from '@/lib/utils'
import { getWaitlistDailySignups, getWaitlistStats } from '@/server/admin'

interface SubscribeCtaProps {
	showStats?: boolean
}

const chartConfig: ChartConfig = {
	count: {
		label: 'Signups',
		color: 'hsl(var(--foreground))',
	},
}

export function SubscribeCta({ showStats = false }: SubscribeCtaProps) {
	const fetchStats = useServerFn(getWaitlistStats)
	const fetchDailySignups = useServerFn(getWaitlistDailySignups)
	const [email, setEmail] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const [showTerminal, setShowTerminal] = useState(false)

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

		// Switch to terminal view
		setShowTerminal(true)
	}

	return (
		<Card className="border-border bg-card/70 p-6 transition-all duration-500 hover:border-accent overflow-hidden">
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

				<AnimatePresence mode="wait">
					{showTerminal ? (
						<motion.div
							key="terminal"
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.4, ease: 'circOut' }}
							className="min-h-[150px] rounded-md border border-border/50 bg-black/40 p-4"
						>
							<SubscribeTerminal
								email={email}
								onSuccess={() => setSuccess('Subscribed')}
								onError={() => {
									// Optional: Allow resetting after delay or button click
									// For now, terminal shows error state
								}}
							/>
						</motion.div>
					) : (
						<motion.form
							key="form"
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.3 }}
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
										feedbackId
											? `${descriptionId} ${feedbackId}`
											: descriptionId
									}
									aria-invalid={Boolean(error)}
									className="font-mono text-sm text-foreground placeholder:text-muted-foreground/60"
								/>
							</div>

							<Button
								type="submit"
								variant="secondary"
								size="lg"
								className="font-mono text-xs uppercase tracking-wide sm:w-auto"
							>
								Subscribe
							</Button>
						</motion.form>
					)}
				</AnimatePresence>

				{!showTerminal && (
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
					</div>
				)}

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
				<AnimatePresence>
					{showStats && statsData && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.5, ease: 'circOut' }}
							className="overflow-hidden border-t border-border"
						>
							<div className="pt-4">
								<div className="mb-3 flex items-center justify-between">
									<p className="font-mono text-xs text-muted-foreground">
										<span className="text-foreground font-semibold">
											{statsData.totalCount}
										</span>{' '}
										subscribers
									</p>
									<p className="font-mono text-xs text-muted-foreground">
										Last 30 days
									</p>
								</div>

								{/* Chart */}
								{chartData.length > 0 && (
									<div className="mb-6">
										<ChartContainer
											config={chartConfig}
											className="h-[100px] w-full"
										>
											<AreaChart
												data={chartData}
												margin={{
													left: 0,
													right: 0,
													top: 4,
													bottom: 0,
												}}
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
															stopColor="currentColor"
															stopOpacity={0.2}
														/>
														<stop
															offset="100%"
															stopColor="currentColor"
															stopOpacity={0}
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
													stroke="currentColor"
													strokeWidth={2}
													fill={`url(#${gradientId})`}
													animationDuration={1500}
													className="text-foreground"
												/>
											</AreaChart>
										</ChartContainer>
									</div>
								)}

								{/* Recent signups */}
								{statsData.recentSignups.length > 0 && (
									<div>
										<p className="mb-3 font-mono text-xs text-muted-foreground/60 uppercase tracking-wider">
											Latest Access Grants
										</p>
										<ul className="space-y-2">
											{statsData.recentSignups
												.slice(0, 5)
												.map((signup, index) => (
													<motion.li
														key={signup.id}
														initial={{ opacity: 0, x: -10 }}
														animate={{ opacity: 1, x: 0 }}
														transition={{
															delay: index * 0.1,
															duration: 0.3,
														}}
														className="flex items-center justify-between group"
													>
														<div className="flex items-center gap-2">
															<div className="h-1.5 w-1.5 rounded-full bg-green-500/50 group-hover:bg-green-500 transition-colors" />
															<EncryptedText
																text={maskEmail(signup.email)}
																className="font-mono text-xs text-foreground/80 group-hover:text-foreground transition-colors"
																revealDelayMs={80 + index * 50}
																flipDelayMs={60}
															/>
														</div>
														<span className="font-mono text-[10px] text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
															{new Date(signup.createdAt).toLocaleDateString(
																'en-US',
																{
																	month: 'short',
																	day: 'numeric',
																	hour: '2-digit',
																	minute: '2-digit',
																},
															)}
														</span>
													</motion.li>
												))}
										</ul>
									</div>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</Card>
	)
}
