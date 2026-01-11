import { vi } from "vitest"

type IntersectionCallback = (entries: IntersectionObserverEntry[]) => void

type ObserverRecord = {
	callback: IntersectionCallback
	options?: IntersectionObserverInit
}

export const mockObservers = new Map<Element, ObserverRecord>()

export function createMockIntersectionObserver() {
	return vi.fn().mockImplementation(
		(callback: IntersectionCallback, options?: IntersectionObserverInit) => {
			const observed = new Set<Element>()

			return {
				observe: vi.fn((element: Element) => {
					observed.add(element)
					mockObservers.set(element, { callback, options })
				}),
				unobserve: vi.fn((element: Element) => {
					observed.delete(element)
					mockObservers.delete(element)
				}),
				disconnect: vi.fn(() => {
					for (const element of observed) {
						mockObservers.delete(element)
					}
					observed.clear()
				}),
				takeRecords: vi.fn(() => []),
				root: null,
				rootMargin: options?.rootMargin ?? "",
				thresholds: Array.isArray(options?.threshold)
					? options.threshold
					: [options?.threshold ?? 0],
			}
		},
	)
}

export function triggerIntersection(element: Element, isIntersecting: boolean) {
	const observer = mockObservers.get(element)
	if (!observer) {
		return
	}

	observer.callback([
		{
			target: element,
			isIntersecting,
			intersectionRatio: isIntersecting ? 1 : 0,
			boundingClientRect: element.getBoundingClientRect(),
			intersectionRect: element.getBoundingClientRect(),
			rootBounds: null,
			time: Date.now(),
		} as IntersectionObserverEntry,
	])
}

export function clearMockObservers() {
	mockObservers.clear()
}
