// @vitest-environment jsdom
import { act, createElement, type ComponentType } from "react"
import { flushSync } from "react-dom"
import { createRoot } from "react-dom/client"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { HeroRelease } from "@/components/home/hero-release"

// Mock dependencies
vi.mock("motion/react", () => ({
	motion: {
		div: ({ children, className, ...props }: any) =>
			createElement("div", { className, ...props }, children),
		p: ({ children, className, ...props }: any) =>
			createElement("p", { className, ...props }, children),
	},
}))

vi.mock("@/lib/tool-logos", () => ({
	getToolLogo: () => createElement("svg", { "data-testid": "tool-logo" }),
	getLogoHoverClasses: () => "hover-classes",
	isMonochromeLogo: () => false,
}))

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, ...props }: any) => createElement("a", props, children),
}))

// Helper to render component (React 19 compatible)
const renderComponent = <Props extends object>(
	Component: ComponentType<Props>,
	props: Props,
) => {
	const container = document.createElement("div")
	document.body.appendChild(container)
	const root = createRoot(container)

	act(() => {
		flushSync(() => {
			root.render(createElement(Component, props))
		})
	})

	return {
		container,
		unmount: () => {
			act(() => {
				root.unmount()
			})
			container.remove()
		},
	}
}

describe("HeroRelease", () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
		document.body.innerHTML = ""
	})

	const defaultProps = {
		toolSlug: "test-tool",
		toolName: "Test Tool",
		vendor: "Test Vendor",
		version: "1.0.0",
		releaseDate: new Date("2024-01-01"),
		headline: "Test Headline",
		summary: "Test Summary",
		changeCount: 5,
		changesByType: { feature: 2, bugfix: 3 },
		hasBreaking: false,
		hasSecurity: false,
		hasDeprecation: false,
	}

	it("should use formattedVersion in simulated command prompt", () => {
		const formattedVersion = "v1.0.0-formatted"

		const { container, unmount } = renderComponent(HeroRelease, {
			...defaultProps,
			formattedVersion,
		})

		// Fast-forward timers to complete typing animation
		// startDelay (1200) + typing duration
		act(() => {
			vi.advanceTimersByTime(5000)
		})

		const textContent = container.textContent || ""
		expect(textContent).toContain(`--version=${formattedVersion}`)
		// Ensure raw version is NOT used when formatted is present
		expect(textContent).not.toContain(`--version=${defaultProps.version}`)

		unmount()
	})

	it("should fallback to raw version if formattedVersion is missing", () => {
		const { container, unmount } = renderComponent(HeroRelease, {
			...defaultProps,
			formattedVersion: undefined,
		})

		act(() => {
			vi.advanceTimersByTime(5000)
		})

		const textContent = container.textContent || ""
		expect(textContent).toContain(`--version=${defaultProps.version}`)

		unmount()
	})
})
