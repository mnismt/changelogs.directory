import type { SVGProps } from 'react'

export const Ampcode = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 10 11"
		width="1em"
		height="1em"
		{...props}
	>
		<path
			fill="#000"
			d="m2.377 9.235 1.97-1.998.717 2.722 1.041-.285-1.038-3.952L1.178 4.67.901 5.733l2.676.727-1.961 1.995.76.78ZM8.057 6.919 9.1 6.634 8.06 2.682 4.172 1.63l-.277 1.064 3.284.892.878 3.334Z"
		/>
		<path
			fill="#000"
			d="m6.562 8.438 1.042-.285-1.038-3.952-3.89-1.053L2.4 4.212l3.284.892.878 3.334Z"
		/>
	</svg>
)
