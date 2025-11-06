import type * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
	orientation?: "horizontal" | "vertical"
	size?: "sm" | "default" | "lg"
}

function ButtonGroup({
	className,
	orientation = "horizontal",
	size = "default",
	children,
	...props
}: ButtonGroupProps) {
	return (
		<div
			role="group"
			className={cn(
				"inline-flex",
				orientation === "horizontal" ? "flex-row flex-wrap" : "flex-col",
				orientation === "horizontal" ? "gap-2" : "gap-1",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	)
}

export { ButtonGroup }
