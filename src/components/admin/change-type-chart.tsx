import { Cell, Pie, PieChart } from 'recharts'
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

interface ChangeTypeData {
	type: string
	count: number
}

interface ChangeTypeChartProps {
	data: ChangeTypeData[]
}

// Monochrome grayscale colors for the pie chart
const COLORS = [
	'#e5e5e5', // Lightest gray
	'#b3b3b3', // Light gray
	'#808080', // Medium gray
	'#595959', // Dark gray
	'#404040', // Darkest gray
]

export function ChangeTypeChart({ data }: ChangeTypeChartProps) {
	// Build chart config dynamically from data
	const chartConfig: ChartConfig = data.reduce((acc, item, index) => {
		acc[item.type] = {
			label: item.type,
			color: COLORS[index % COLORS.length],
		}
		return acc
	}, {} as ChartConfig)

	// Transform data for pie chart
	const chartData = data.map((item, index) => ({
		name: item.type,
		value: item.count,
		fill: COLORS[index % COLORS.length],
	}))

	const totalChanges = data.reduce((sum, item) => sum + item.count, 0)

	return (
		<Card className="border-border bg-card">
			<CardHeader>
				<CardTitle className="font-mono text-lg">
					Change Type Distribution
				</CardTitle>
				<CardDescription>
					Breakdown of {totalChanges} total changes by type
				</CardDescription>
			</CardHeader>
			<CardContent>
				{data.length > 0 ? (
					<ChartContainer
						config={chartConfig}
						className="mx-auto aspect-square h-[300px]"
					>
						<PieChart>
							<ChartTooltip
								content={<ChartTooltipContent labelKey="name" nameKey="name" />}
							/>
							<Pie
								data={chartData}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								innerRadius={60}
								outerRadius={100}
								paddingAngle={2}
								strokeWidth={0}
							>
								{chartData.map((entry, _index) => (
									<Cell key={`cell-${entry.name}`} fill={entry.fill} />
								))}
							</Pie>
						</PieChart>
					</ChartContainer>
				) : (
					<p className="text-muted-foreground py-8 text-center text-sm">
						No changes recorded yet
					</p>
				)}

				{/* Legend */}
				{data.length > 0 && (
					<div className="mt-4 flex flex-wrap justify-center gap-4">
						{data.map((item, index) => (
							<div key={item.type} className="flex items-center gap-2">
								<div
									className="size-3 rounded-sm"
									style={{
										backgroundColor: COLORS[index % COLORS.length],
									}}
								/>
								<span className="font-mono text-xs uppercase">{item.type}</span>
								<span className="text-muted-foreground font-mono text-xs">
									({item.count})
								</span>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
