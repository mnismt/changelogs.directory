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

interface IngestionStatsChartProps {
	successCount: number
	failedCount: number
	totalJobs: number
}

const chartConfig: ChartConfig = {
	success: {
		label: 'Success',
		color: '#e5e5e5', // Light gray for success
	},
	failed: {
		label: 'Failed',
		color: '#595959', // Dark gray for failed
	},
}

export function IngestionStatsChart({
	successCount,
	failedCount,
	totalJobs,
}: IngestionStatsChartProps) {
	const chartData = [
		{
			status: 'Success',
			count: successCount,
			fill: 'var(--color-success)',
		},
		{
			status: 'Failed',
			count: failedCount,
			fill: 'var(--color-failed)',
		},
	]

	return (
		<Card className="border-border bg-card">
			<CardHeader>
				<CardTitle className="font-mono text-lg">
					Ingestion Results (7d)
				</CardTitle>
				<CardDescription>
					{totalJobs} total jobs in the last 7 days
				</CardDescription>
			</CardHeader>
			<CardContent>
				{totalJobs > 0 ? (
					<ChartContainer config={chartConfig} className="h-[200px] w-full">
						<BarChart
							data={chartData}
							layout="vertical"
							margin={{ left: 0, right: 20 }}
						>
							<XAxis type="number" hide />
							<YAxis
								dataKey="status"
								type="category"
								tickLine={false}
								axisLine={false}
								width={60}
								tick={{ fontSize: 12, fill: '#808080' }}
							/>
							<ChartTooltip
								content={<ChartTooltipContent hideLabel />}
								cursor={false}
							/>
							<Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32} />
						</BarChart>
					</ChartContainer>
				) : (
					<p className="text-muted-foreground py-8 text-center text-sm">
						No ingestion jobs in the last 7 days
					</p>
				)}
			</CardContent>
		</Card>
	)
}
