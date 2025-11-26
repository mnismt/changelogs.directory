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

interface ToolChangeProfile {
	toolId: string
	toolName: string
	toolSlug: string
	feature: number
	bugfix: number
	improvement: number
	breaking: number
	security: number
	deprecation: number
	performance: number
	documentation: number
	other: number
}

interface ToolChangeProfilesChartProps {
	data: ToolChangeProfile[]
}

const chartConfig: ChartConfig = {
	feature: {
		label: 'Feature',
		color: '#e5e5e5',
	},
	improvement: {
		label: 'Improvement',
		color: '#a3a3a3',
	},
	bugfix: {
		label: 'Bugfix',
		color: '#737373',
	},
	performance: {
		label: 'Performance',
		color: '#525252',
	},
	documentation: {
		label: 'Documentation',
		color: '#404040',
	},
	other: {
		label: 'Other',
		color: '#262626',
	},
}

export function ToolChangeProfilesChart({
	data,
}: ToolChangeProfilesChartProps) {
	// Transform data to show only non-zero categories for better visualization
	const transformedData = data.map((tool) => ({
		name: tool.toolName,
		Feature: tool.feature,
		Improvement: tool.improvement,
		Bugfix: tool.bugfix,
		Performance: tool.performance,
		Documentation: tool.documentation,
		Other: tool.other,
	}))

	return (
		<Card className="border-border bg-card h-full">
			<CardHeader>
				<CardTitle className="font-mono text-lg">
					Change Type Distribution
				</CardTitle>
				<CardDescription>
					Compare the nature of changes across tools
				</CardDescription>
			</CardHeader>
			<CardContent>
				{data.length > 0 ? (
					<ChartContainer config={chartConfig} className="h-[320px] w-full">
						<BarChart
							data={transformedData}
							margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
						>
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
							<Bar dataKey="Feature" stackId="a" fill="#e5e5e5" radius={0} />
							<Bar
								dataKey="Improvement"
								stackId="a"
								fill="#a3a3a3"
								radius={0}
							/>
							<Bar dataKey="Bugfix" stackId="a" fill="#737373" radius={0} />
							<Bar
								dataKey="Performance"
								stackId="a"
								fill="#525252"
								radius={0}
							/>
							<Bar
								dataKey="Documentation"
								stackId="a"
								fill="#404040"
								radius={0}
							/>
							<Bar
								dataKey="Other"
								stackId="a"
								fill="#262626"
								radius={[4, 4, 0, 0]}
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
