import {
	animate,
	motion,
	useMotionValue,
	useTransform,
	useVelocity,
} from 'motion/react'
import { useEffect } from 'react'

export function AnimatedNumber({
	value,
	className,
}: { value: number; className?: string }) {
	const count = useMotionValue(value)
	const rounded = useTransform(count, (latest) => Math.round(latest))
	const velocity = useVelocity(count)

	// Map velocity to blur amount (0 to 5px)
	// Adjust input range based on expected speed (0 to 1000 units/sec)
	const blur = useTransform(velocity, [-1000, 0, 1000], [5, 0, 5], {
		clamp: true,
	})
	const filter = useTransform(blur, (v) => `blur(${v}px)`)

	useEffect(() => {
		const controls = animate(count, value, {
			duration: 1.2,
			ease: [0.25, 0.1, 0.25, 1], // Cubic bezier for "start slow, fast, stop"
		})
		return controls.stop
	}, [value, count])

	return (
		<motion.span style={{ filter }} className={className}>
			{rounded}
		</motion.span>
	)
}
