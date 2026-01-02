import type { SVGProps } from 'react'
import { useId } from 'react'

export const OpenCode = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={32}
		height={40}
		fill="none"
		{...props}
	>
		<g clipPath="url(#a)">
			<path fill="#4B4646" d="M24 32H8V16h16v16Z" />
			<path fill="#F1ECEC" d="M24 8H8v24h16V8Zm8 32H0V0h32v40Z" />
		</g>
		<defs>
			<clipPath id={useId()}>
				<path fill="#fff" d="M0 0h32v40H0z" />
			</clipPath>
		</defs>
	</svg>
)
