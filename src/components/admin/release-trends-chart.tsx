import { Bar, BarChart, XAxis, YAxis } from 'recharts'
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

interface ReleaseTrend {
	week: string
	count: number
}

interface ReleaseTrendsChartProps {
	data: ReleaseTrend[]
}

const chartConfig: ChartConfig = {
	count: {
		label: 'Releases',
		color: '#e5e5e5',
	},
}

export function ReleaseTrendsChart({ data }: ReleaseTrendsChartProps) {
	const totalReleases = data.reduce((sum, item) => sum + item.count, 0)

	// Format week for display (MM/DD)
	const formattedData = data.map((item) => {
		const date = new Date(item.week)
		return {
			...item,
			displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
		}
	})

	return (
		<Card className="border-border bg-card h-full flex flex-col">
			<CardHeader>
				<CardTitle className="font-mono text-lg">Release Activity</CardTitle>
				<CardDescription>
					{totalReleases} releases in the last 8 weeks
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-1">
				{data.length > 0 ? (
					<ChartContainer config={chartConfig} className="h-full w-full">
						<BarChart
							data={formattedData}
							margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
						>
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
										labelFormatter={(value) => `Week of: ${value}`}
									/>
								}
							/>
							<Bar
								dataKey="count"
								fill="#e5e5e5"
								radius={[4, 4, 0, 0]}
								maxBarSize={50}
							/>
						</BarChart>
					</ChartContainer>
				) : (
					<p className="text-muted-foreground py-8 text-center text-sm">
						No releases in the last 8 weeks
					</p>
				)}
			</CardContent>
		</Card>
	)
}
