import { useId } from 'react'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'

interface DailySignup {
	date: string
	count: number
}

interface WaitlistChartProps {
	data: DailySignup[]
}

const chartConfig: ChartConfig = {
	count: {
		label: 'Signups',
		color: '#e5e5e5',
	},
}

export function WaitlistChart({ data }: WaitlistChartProps) {
	const gradientId = useId()
	const totalSignups = data.reduce((sum, item) => sum + item.count, 0)

	// Format date for display (MM/DD)
	const formattedData = data.map((item) => {
		const date = new Date(item.date)
		return {
			...item,
			displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
		}
	})

	return (
		<Card className="border-border bg-card">
			<CardHeader>
				<CardTitle className="font-mono text-lg">Daily Signups (30d)</CardTitle>
				<CardDescription>
					{totalSignups} new subscribers in the last 30 days
				</CardDescription>
			</CardHeader>
			<CardContent>
				{data.length > 0 ? (
					<ChartContainer config={chartConfig} className="h-[200px] w-full">
						<AreaChart
							data={formattedData}
							margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
						>
							<defs>
								<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#e5e5e5" stopOpacity={0.3} />
									<stop offset="100%" stopColor="#e5e5e5" stopOpacity={0.05} />
								</linearGradient>
							</defs>
							<XAxis
								dataKey="displayDate"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tick={{ fontSize: 10, fill: '#808080' }}
								interval="preserveStartEnd"
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								width={30}
								tick={{ fontSize: 10, fill: '#808080' }}
								allowDecimals={false}
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										labelFormatter={(value) => `Date: ${value}`}
									/>
								}
							/>
							<Area
								type="monotone"
								dataKey="count"
								stroke="#e5e5e5"
								strokeWidth={2}
								fill={`url(#${gradientId})`}
							/>
						</AreaChart>
					</ChartContainer>
				) : (
					<p className="text-muted-foreground py-8 text-center text-sm">
						No signups in the last 30 days
					</p>
				)}
			</CardContent>
		</Card>
	)
}
