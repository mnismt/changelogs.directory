import { describe, expect, it } from "vitest"
import { isValidElement, type ReactElement } from "react"
import { parseMarkdownLinks } from "@/lib/markdown-utils"

// Helper to assert and extract props from React elements
function getElementProps(
	element: unknown,
): Record<string, unknown> | undefined {
	if (isValidElement(element)) {
		return (element as ReactElement<Record<string, unknown>>).props
	}
	return undefined
}

function getElementType(element: unknown): unknown {
	if (isValidElement(element)) {
		return (element as ReactElement).type
	}
	return undefined
}

describe("parseMarkdownLinks", () => {
	describe("plain text", () => {
		it("should return original text when no links present", () => {
			const result = parseMarkdownLinks("Hello world")

			expect(result).toHaveLength(1)
			expect(result[0]).toBe("Hello world")
		})

		it("should handle empty string", () => {
			const result = parseMarkdownLinks("")

			expect(result).toHaveLength(1)
			expect(result[0]).toBe("")
		})

		it("should handle text with brackets but no valid link syntax", () => {
			const result = parseMarkdownLinks("Check [this] out (here)")

			expect(result).toHaveLength(1)
			expect(result[0]).toBe("Check [this] out (here)")
		})
	})

	describe("internal links", () => {
		it("should create Link component for absolute paths", () => {
			const result = parseMarkdownLinks("[Home](/)")

			expect(result).toHaveLength(1)
			expect(isValidElement(result[0])).toBe(true)

			const props = getElementProps(result[0])
			expect(props?.to).toBe("/")
			expect(props?.children).toBe("Home")
		})

		it("should handle internal link with path segments", () => {
			const result = parseMarkdownLinks("[Gemini CLI](/tools/gemini-cli)")

			expect(result).toHaveLength(1)
			expect(isValidElement(result[0])).toBe(true)

			const props = getElementProps(result[0])
			expect(props?.to).toBe("/tools/gemini-cli")
			expect(props?.children).toBe("Gemini CLI")
		})

		it("should preserve text before and after link", () => {
			const result = parseMarkdownLinks(
				"Check out [Gemini CLI](/tools/gemini-cli) for more",
			)

			expect(result).toHaveLength(3)
			expect(result[0]).toBe("Check out ")
			expect(isValidElement(result[1])).toBe(true)
			expect(result[2]).toBe(" for more")
		})
	})

	describe("external links", () => {
		it("should create anchor element for https URLs", () => {
			const result = parseMarkdownLinks("[GitHub](https://github.com)")

			expect(result).toHaveLength(1)
			expect(isValidElement(result[0])).toBe(true)
			expect(getElementType(result[0])).toBe("a")

			const props = getElementProps(result[0])
			expect(props?.href).toBe("https://github.com")
			expect(props?.children).toBe("GitHub")
		})

		it("should create anchor element for http URLs", () => {
			const result = parseMarkdownLinks("[Example](http://example.com)")

			expect(result).toHaveLength(1)
			expect(isValidElement(result[0])).toBe(true)
			expect(getElementType(result[0])).toBe("a")

			const props = getElementProps(result[0])
			expect(props?.href).toBe("http://example.com")
		})

		it("should add target=_blank and rel attributes", () => {
			const result = parseMarkdownLinks("[Link](https://example.com)")

			expect(isValidElement(result[0])).toBe(true)

			const props = getElementProps(result[0])
			expect(props?.target).toBe("_blank")
			expect(props?.rel).toBe("noopener noreferrer")
		})
	})

	describe("relative links", () => {
		it("should normalize ./path to /path", () => {
			const result = parseMarkdownLinks("[Tool](./tools/cursor)")

			expect(result).toHaveLength(1)
			expect(isValidElement(result[0])).toBe(true)

			const props = getElementProps(result[0])
			expect(props?.to).toBe("/tools/cursor")
		})

		it("should add leading slash to bare paths", () => {
			const result = parseMarkdownLinks("[Tool](tools/cursor)")

			expect(result).toHaveLength(1)
			expect(isValidElement(result[0])).toBe(true)

			const props = getElementProps(result[0])
			expect(props?.to).toBe("/tools/cursor")
		})
	})

	describe("multiple links", () => {
		it("should handle multiple links with text between", () => {
			const result = parseMarkdownLinks("[A](/a) and [B](/b)")

			expect(result).toHaveLength(3)
			expect(isValidElement(result[0])).toBe(true)
			expect(result[1]).toBe(" and ")
			expect(isValidElement(result[2])).toBe(true)

			const propsA = getElementProps(result[0])
			const propsB = getElementProps(result[2])
			expect(propsA?.to).toBe("/a")
			expect(propsB?.to).toBe("/b")
		})

		it("should handle consecutive links without spacing", () => {
			const result = parseMarkdownLinks("[A](/a)[B](/b)")

			expect(result).toHaveLength(2)
			expect(isValidElement(result[0])).toBe(true)
			expect(isValidElement(result[1])).toBe(true)
		})

		it("should handle mixed internal and external links", () => {
			const result = parseMarkdownLinks(
				"[Local](/path) and [Remote](https://example.com)",
			)

			expect(result).toHaveLength(3)
			expect(isValidElement(result[0])).toBe(true)
			expect(isValidElement(result[2])).toBe(true)

			const localProps = getElementProps(result[0])
			const externalProps = getElementProps(result[2])

			expect(localProps?.to).toBe("/path")
			expect(getElementType(result[2])).toBe("a")
			expect(externalProps?.href).toBe("https://example.com")
		})
	})

	describe("edge cases", () => {
		it("should handle link at start of text", () => {
			const result = parseMarkdownLinks("[Start](/start) followed by text")

			expect(result).toHaveLength(2)
			expect(isValidElement(result[0])).toBe(true)
			expect(result[1]).toBe(" followed by text")
		})

		it("should handle link at end of text", () => {
			const result = parseMarkdownLinks("Text followed by [End](/end)")

			expect(result).toHaveLength(2)
			expect(result[0]).toBe("Text followed by ")
			expect(isValidElement(result[1])).toBe(true)
		})

		it("should handle link with special characters in text", () => {
			const result = parseMarkdownLinks("[What's New?](/changelog)")

			expect(result).toHaveLength(1)
			expect(isValidElement(result[0])).toBe(true)

			const props = getElementProps(result[0])
			expect(props?.children).toBe("What's New?")
		})

		it("should handle link with query params", () => {
			const result = parseMarkdownLinks("[Search](/search?q=test&page=1)")

			expect(result).toHaveLength(1)
			expect(isValidElement(result[0])).toBe(true)

			const props = getElementProps(result[0])
			expect(props?.to).toBe("/search?q=test&page=1")
		})

		it("should handle link with hash fragment", () => {
			const result = parseMarkdownLinks("[Section](/page#section)")

			expect(result).toHaveLength(1)
			expect(isValidElement(result[0])).toBe(true)

			const props = getElementProps(result[0])
			expect(props?.to).toBe("/page#section")
		})
	})

	describe("styling", () => {
		it("should apply correct className to internal links", () => {
			const result = parseMarkdownLinks("[Test](/path)")

			expect(isValidElement(result[0])).toBe(true)

			const props = getElementProps(result[0])
			expect(props?.className).toBe("text-primary hover:underline")
		})

		it("should apply correct className to external links", () => {
			const result = parseMarkdownLinks("[Test](https://example.com)")

			expect(isValidElement(result[0])).toBe(true)

			const props = getElementProps(result[0])
			expect(props?.className).toBe("text-primary hover:underline")
		})

		it("should apply correct className to relative links", () => {
			const result = parseMarkdownLinks("[Test](./path)")

			expect(isValidElement(result[0])).toBe(true)

			const props = getElementProps(result[0])
			expect(props?.className).toBe("text-primary hover:underline")
		})
	})
})
