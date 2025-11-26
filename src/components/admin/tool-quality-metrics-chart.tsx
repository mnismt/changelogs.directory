import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
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

interface ToolQualityMetric {
	toolId: string
	toolName: string
	toolSlug: string
	avgChangesPerRelease: number
	breakingChangeRatio: number
	securityFixRatio: number
	deprecationRatio: number
}

interface ToolQualityMetricsChartProps {
	data: ToolQualityMetric[]
}

const chartConfig: ChartConfig = {
	avgChangesPerRelease: {
		label: 'Avg Changes/Release',
		color: '#e5e5e5',
	},
	breakingChangeRatio: {
		label: 'Breaking %',
		color: '#ef4444',
	},
	securityFixRatio: {
		label: 'Security %',
		color: '#22c55e',
	},
}

export function ToolQualityMetricsChart({
	data,
}: ToolQualityMetricsChartProps) {
	const transformedData = data.map((tool) => ({
		name: tool.toolName,
		avgChanges: tool.avgChangesPerRelease,
		breaking: tool.breakingChangeRatio,
		security: tool.securityFixRatio,
	}))

	return (
		<Card className="border-border bg-card h-full">
			<CardHeader>
				<CardTitle className="font-mono text-lg">Quality Metrics</CardTitle>
				<CardDescription>
					Average changes per release and ratios of critical change types
				</CardDescription>
			</CardHeader>
			<CardContent>
				{data.length > 0 ? (
					<ChartContainer config={chartConfig} className="h-[320px] w-full">
						<BarChart
							data={transformedData}
							margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke="#404040" />
							<XAxis
								dataKey="name"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tick={{ fontSize: 10, fill: '#808080' }}
								angle={-45}
								textAnchor="end"
								height={80}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								width={30}
								tick={{ fontSize: 10, fill: '#808080' }}
							/>
							<ChartTooltip content={<ChartTooltipContent />} />
							<Bar
								dataKey="avgChanges"
								fill="#e5e5e5"
								radius={[4, 4, 0, 0]}
								maxBarSize={40}
							/>
							<Bar
								dataKey="breaking"
								fill="#ef4444"
								radius={[4, 4, 0, 0]}
								maxBarSize={40}
							/>
							<Bar
								dataKey="security"
								fill="#22c55e"
								radius={[4, 4, 0, 0]}
								maxBarSize={40}
							/>
						</BarChart>
					</ChartContainer>
				) : (
					<p className="text-muted-foreground py-8 text-center text-sm">
						No data available
					</p>
				)}
			</CardContent>
		</Card>
	)
}
