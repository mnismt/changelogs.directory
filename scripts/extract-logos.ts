/**
 * Extract SVG logos from TSX components and convert to PNG.
 *
 * Usage: pnpm tsx scripts/extract-logos.ts
 */

import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"

const LOGO_DIR = path.join(process.cwd(), "src/components/logo")
const OUTPUT_DIR = path.join(process.cwd(), "public/images/logos")
const OUTPUT_SIZE = 256

// Map TSX filenames to output PNG names (handles naming differences)
const FILE_NAME_MAP: Record<string, string> = {
	"claude.tsx": "claude-code",
	"cursor.tsx": "cursor",
	"antigravity.tsx": "antigravity",
	"windsurf.tsx": "windsurf",
	"opencode.tsx": "opencode",
	"gemini-cli.tsx": "gemini-cli",
	"droid.tsx": "droid",
	"amp.tsx": "amp",
	"openai.tsx": "codex",
	"github.tsx": "github",
	"x.tsx": "x",
}

/**
 * Convert JSX-style SVG to valid SVG XML
 */
function jsxToSvg(jsxContent: string): string {
	let svg = jsxContent

	// Remove {...props} spread
	svg = svg.replace(/\s*\{\.\.\.props\}\s*/g, " ")

	// Convert style={{ key: 'value' }} to style="key: value"
	svg = svg.replace(/style=\{\{([^}]+)\}\}/g, (_match, styleContent: string) => {
		const styles = styleContent
			.split(",")
			.map((s: string) => {
				const [key, value] = s.split(":").map((x: string) => x.trim())
				if (!key || !value) return ""
				// Convert camelCase to kebab-case
				const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase()
				// Remove quotes from value
				const cleanValue = value.replace(/['"]/g, "")
				return `${kebabKey}: ${cleanValue}`
			})
			.filter(Boolean)
			.join("; ")
		return `style="${styles}"`
	})

	// Replace {useId()} with static ID "a" (matching the clipPath="url(#a)" reference)
	svg = svg.replace(/id=\{useId\(\)\}/g, 'id="a"')
	svg = svg.replace(/\{useId\(\)\}/g, '"a"')
	svg = svg.replace(/id=\{[^}]+\}/g, 'id="generated-id"')

	// Convert JSX boolean attributes
	svg = svg.replace(/(\w+)=\{true\}/g, "$1")
	svg = svg.replace(/(\w+)=\{false\}/g, "")

	// Convert JSX number attributes to strings
	svg = svg.replace(/(\w+)=\{(\d+)\}/g, '$1="$2"')

	// Convert JSX self-closing tags to XML self-closing tags
	// JSX: <path ... /> → XML: <path ... />  (but need to ensure proper format)
	// The issue is tabs/newlines inside tags - normalize them
	svg = svg.replace(/\n\s*/g, " ") // Normalize whitespace
	svg = svg.replace(/\t+/g, " ")

	// Fix self-closing tags: ensure they have proper XML format
	// Match tags that end with /> and ensure proper spacing
	const selfClosingTags = [
		"path",
		"rect",
		"circle",
		"ellipse",
		"line",
		"polyline",
		"polygon",
		"stop",
		"use",
		"image",
		"feFlood",
		"feBlend",
		"feGaussianBlur",
		"feMorphology",
		"feOffset",
		"feComposite",
	]
	for (const tag of selfClosingTags) {
		// Ensure self-closing tags are valid XML
		const regex = new RegExp(`<${tag}([^>]*?)\\s*/>`, "gi")
		svg = svg.replace(regex, `<${tag}$1 />`)
	}

	// Convert camelCase attributes to proper SVG attributes
	const attrMap: Record<string, string> = {
		viewBox: "viewBox", // Keep as-is
		preserveAspectRatio: "preserveAspectRatio",
		fillRule: "fill-rule",
		clipRule: "clip-rule",
		strokeWidth: "stroke-width",
		strokeLinecap: "stroke-linecap",
		strokeLinejoin: "stroke-linejoin",
		strokeMiterlimit: "stroke-miterlimit",
		clipPath: "clip-path",
		maskUnits: "maskUnits",
		filterUnits: "filterUnits",
		colorInterpolationFilters: "color-interpolation-filters",
		floodOpacity: "flood-opacity",
		stdDeviation: "stdDeviation",
	}

	for (const [jsx, svgAttr] of Object.entries(attrMap)) {
		if (jsx !== svgAttr) {
			const regex = new RegExp(`\\b${jsx}=`, "g")
			svg = svg.replace(regex, `${svgAttr}=`)
		}
	}

	// Ensure xmlns is present
	if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
		svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')
	}

	// Add XML declaration
	if (!svg.startsWith("<?xml")) {
		svg = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg
	}

	return svg
}

/**
 * Extract SVG content from TSX file
 */
function extractSvgFromTsx(content: string): string | null {
	// First, find the JSX return statement - look for the SVG inside the component
	// Remove TypeScript type annotations first
	const withoutTypes = content
		.replace(/:\s*SVGProps<SVGSVGElement>/g, "")
		.replace(/import\s+.*from\s+['"]react['"]/g, "")

	// Match the SVG element (handles multi-line)
	const svgMatch = withoutTypes.match(/<svg[\s\S]*?<\/svg>/i)
	if (!svgMatch) {
		return null
	}

	return jsxToSvg(svgMatch[0])
}

/**
 * Convert SVG string to PNG buffer using sharp
 */
async function svgToPng(svgContent: string, size: number): Promise<Buffer> {
	// Get the viewBox to determine aspect ratio
	const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/)
	let width = size
	let height = size

	if (viewBoxMatch) {
		const [, , vbWidth, vbHeight] = viewBoxMatch[1].split(/\s+/).map(Number)
		if (vbWidth && vbHeight) {
			const aspectRatio = vbWidth / vbHeight
			if (aspectRatio > 1) {
				height = Math.round(size / aspectRatio)
			} else {
				width = Math.round(size * aspectRatio)
			}
		}
	}

	// Use sharp to convert SVG to PNG
	const pngBuffer = await sharp(Buffer.from(svgContent))
		.resize(width, height, {
			fit: "contain",
			background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent
		})
		.png()
		.toBuffer()

	return pngBuffer
}

async function main() {
	console.log("Extracting logos from TSX → PNG...\n")

	// Ensure output directory exists
	if (!fs.existsSync(OUTPUT_DIR)) {
		fs.mkdirSync(OUTPUT_DIR, { recursive: true })
	}

	const files = fs.readdirSync(LOGO_DIR).filter((f) => f.endsWith(".tsx"))
	let successCount = 0
	let skipCount = 0

	for (const file of files) {
		const outputName = FILE_NAME_MAP[file]
		if (!outputName) {
			console.log(`⊘ ${file} → skipped (not in mapping)`)
			skipCount++
			continue
		}

		const filePath = path.join(LOGO_DIR, file)
		const content = fs.readFileSync(filePath, "utf-8")

		const svgContent = extractSvgFromTsx(content)
		if (!svgContent) {
			console.log(`✗ ${file} → failed (no SVG found)`)
			continue
		}

		try {
			const pngBuffer = await svgToPng(svgContent, OUTPUT_SIZE)
			const outputPath = path.join(OUTPUT_DIR, `${outputName}.png`)
			fs.writeFileSync(outputPath, pngBuffer)
			console.log(`✓ ${file} → ${outputName}.png`)
			successCount++
		} catch (error) {
			console.log(`✗ ${file} → failed (${(error as Error).message})`)
		}
	}

	console.log(`\nDone! ${successCount} logos extracted, ${skipCount} skipped.`)
	console.log(`Output: ${OUTPUT_DIR}`)
}

main().catch(console.error)
