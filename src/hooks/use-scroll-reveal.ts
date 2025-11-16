import { useEffect, useRef, useState } from 'react'

interface UseScrollRevealOptions {
	threshold?: number
	rootMargin?: string
	triggerOnce?: boolean
}

/**
 * Hook for scroll-triggered reveal animations using Intersection Observer
 * Returns a ref to attach to the element and an isVisible state
 *
 * @param options - Intersection Observer options
 * @param options.threshold - Percentage of element visibility to trigger (default: 0.1)
 * @param options.rootMargin - Margin around root (default: '-50px')
 * @param options.triggerOnce - Only trigger once (default: true)
 *
 * @example
 * const { ref, isVisible } = useScrollReveal()
 * return <div ref={ref} className={isVisible ? 'opacity-100' : 'opacity-0'}>{content}</div>
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
	options: UseScrollRevealOptions = {},
) {
	const { threshold = 0.1, rootMargin = '-50px', triggerOnce = true } = options

	const ref = useRef<T>(null)
	const [isVisible, setIsVisible] = useState(false)
	const hasTriggered = useRef(false)

	useEffect(() => {
		const element = ref.current
		if (!element) return

		// Check if Intersection Observer is supported
		if (typeof IntersectionObserver === 'undefined') {
			// Fallback for browsers that don't support Intersection Observer
			setIsVisible(true)
			return
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setIsVisible(true)

						if (triggerOnce) {
							hasTriggered.current = true
							observer.unobserve(element)
						}
					} else if (!triggerOnce) {
						setIsVisible(false)
					}
				})
			},
			{
				threshold,
				rootMargin,
			},
		)

		// Only observe if we haven't triggered yet (when triggerOnce is true)
		if (!triggerOnce || !hasTriggered.current) {
			observer.observe(element)
		}

		return () => {
			observer.disconnect()
		}
	}, [threshold, rootMargin, triggerOnce])

	return { ref, isVisible }
}
