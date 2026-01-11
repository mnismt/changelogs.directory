// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import { useSectionObserver } from "@/hooks/use-section-observer"
import type { ChangeType } from "@/generated/prisma/client"
import "./setup"
import {
	clearMockObservers,
	createMockIntersectionObserver,
	triggerIntersection,
} from "./mocks/intersection-observer"

describe("useSectionObserver", () => {
	let mockObserver: ReturnType<typeof createMockIntersectionObserver>

	beforeEach(() => {
		mockObserver = createMockIntersectionObserver()
		vi.stubGlobal("IntersectionObserver", mockObserver)
		Object.defineProperty(window, "scrollTo", {
			value: vi.fn(),
			writable: true,
		})
		Object.defineProperty(window, "pageYOffset", {
			value: 0,
			writable: true,
		})
	})

	afterEach(() => {
		clearMockObservers()
		vi.unstubAllGlobals()
	})

	it("initializes with null activeSection and empty visibleSections", () => {
		const sectionRefs = new Map<ChangeType, HTMLDivElement | null>()

		const { result } = renderHook(() =>
			useSectionObserver(sectionRefs, {}, "v1.0.0"),
		)

		expect(result.current.activeSection).toBeNull()
		expect(result.current.visibleSections.size).toBe(0)
	})

	it("tracks visible sections when they intersect", async () => {
		const sectionRefs = new Map<ChangeType, HTMLDivElement | null>()
		const featureElement = document.createElement("div")
		const bugfixElement = document.createElement("div")
		document.body.appendChild(featureElement)
		document.body.appendChild(bugfixElement)

		const { result } = renderHook(() =>
			useSectionObserver(sectionRefs, {}, "v1.0.0"),
		)

		sectionRefs.set("FEATURE", featureElement)
		sectionRefs.set("BUGFIX", bugfixElement)

		await waitFor(
			() => {
				expect(mockObserver).toHaveBeenCalled()
			},
			{ timeout: 1000 },
		)

		act(() => {
			triggerIntersection(featureElement, true)
		})

		expect(result.current.visibleSections.has("FEATURE")).toBe(true)
		expect(result.current.activeSection).toBe("FEATURE")
	})

	it("selects the topmost visible section as active", async () => {
		const sectionRefs = new Map<ChangeType, HTMLDivElement | null>()
		const featureElement = document.createElement("div")
		const bugfixElement = document.createElement("div")
		document.body.appendChild(featureElement)
		document.body.appendChild(bugfixElement)

		const { result } = renderHook(() =>
			useSectionObserver(sectionRefs, {}, "v1.0.0"),
		)

		sectionRefs.set("FEATURE", featureElement)
		sectionRefs.set("BUGFIX", bugfixElement)

		await waitFor(
			() => {
				expect(mockObserver).toHaveBeenCalled()
			},
			{ timeout: 1000 },
		)

		act(() => {
			triggerIntersection(featureElement, true)
			triggerIntersection(bugfixElement, true)
		})

		expect(result.current.activeSection).toBe("FEATURE")

		act(() => {
			triggerIntersection(featureElement, false)
		})

		expect(result.current.activeSection).toBe("BUGFIX")
	})

	it("resets state and clears refs when version changes", async () => {
		const sectionRefs = new Map<ChangeType, HTMLDivElement | null>()
		const featureElement = document.createElement("div")
		document.body.appendChild(featureElement)

		const { result, rerender } = renderHook(
			({ version }) => useSectionObserver(sectionRefs, {}, version),
			{ initialProps: { version: "v1.0.0" } },
		)

		sectionRefs.set("FEATURE", featureElement)

		await waitFor(
			() => {
				expect(mockObserver).toHaveBeenCalled()
			},
			{ timeout: 1000 },
		)

		act(() => {
			triggerIntersection(featureElement, true)
		})

		expect(result.current.activeSection).toBe("FEATURE")

		rerender({ version: "v2.0.0" })

		await waitFor(() => {
			expect(result.current.activeSection).toBeNull()
			expect(result.current.visibleSections.size).toBe(0)
			expect(sectionRefs.size).toBe(0)
		})
	})

	it("handles multiple visibility changes", async () => {
		const sectionRefs = new Map<ChangeType, HTMLDivElement | null>()
		const featureElement = document.createElement("div")
		const improvementElement = document.createElement("div")
		const bugfixElement = document.createElement("div")
		document.body.appendChild(featureElement)
		document.body.appendChild(improvementElement)
		document.body.appendChild(bugfixElement)

		const { result } = renderHook(() =>
			useSectionObserver(sectionRefs, {}, "v1.0.0"),
		)

		sectionRefs.set("FEATURE", featureElement)
		sectionRefs.set("IMPROVEMENT", improvementElement)
		sectionRefs.set("BUGFIX", bugfixElement)

		await waitFor(
			() => {
				expect(mockObserver).toHaveBeenCalled()
			},
			{ timeout: 1000 },
		)

		act(() => {
			triggerIntersection(featureElement, true)
		})

		expect(result.current.activeSection).toBe("FEATURE")

		act(() => {
			triggerIntersection(improvementElement, true)
		})

		expect(result.current.activeSection).toBe("FEATURE")
		expect(result.current.visibleSections.size).toBe(2)

		act(() => {
			triggerIntersection(featureElement, false)
			triggerIntersection(bugfixElement, true)
		})

		expect(result.current.activeSection).toBe("IMPROVEMENT")
		expect(result.current.visibleSections.has("FEATURE")).toBe(false)
		expect(result.current.visibleSections.has("IMPROVEMENT")).toBe(true)
		expect(result.current.visibleSections.has("BUGFIX")).toBe(true)
	})

	it("scrolls to the requested section", async () => {
		const sectionRefs = new Map<ChangeType, HTMLDivElement | null>()
		const featureElement = document.createElement("div")
		document.body.appendChild(featureElement)

		const scrollToSpy = vi.spyOn(window, "scrollTo")
		vi.spyOn(featureElement, "getBoundingClientRect").mockReturnValue({
			top: 200,
			bottom: 0,
			left: 0,
			right: 0,
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		} as DOMRect)

		const { result } = renderHook(() =>
			useSectionObserver(sectionRefs, {}, "v1.0.0"),
		)

		sectionRefs.set("FEATURE", featureElement)

		await waitFor(
			() => {
				expect(mockObserver).toHaveBeenCalled()
			},
			{ timeout: 1000 },
		)

		act(() => {
			result.current.scrollToSection("FEATURE")
		})

		expect(scrollToSpy).toHaveBeenCalled()
	})

	it("handles empty refs without crashing", () => {
		const sectionRefs = new Map<ChangeType, HTMLDivElement | null>()

		const { result } = renderHook(() =>
			useSectionObserver(sectionRefs, {}, "v1.0.0"),
		)

		expect(result.current.activeSection).toBeNull()
		expect(result.current.visibleSections.size).toBe(0)
	})
})
