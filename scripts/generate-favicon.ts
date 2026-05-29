/**
 * Generate favicon PNG/ICO assets from public/favicon.svg.
 *
 * Usage: pnpm generate-favicon
 */

import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"

const PUBLIC_DIR = path.join(process.cwd(), "public")
const SVG_PATH = path.join(PUBLIC_DIR, "favicon.svg")

const SIZES = [
	{ name: "favicon-16x16.png", size: 16 },
	{ name: "favicon-32x32.png", size: 32 },
	{ name: "apple-touch-icon.png", size: 180 },
	{ name: "android-chrome-192x192.png", size: 192 },
	{ name: "android-chrome-512x512.png", size: 512 },
] as const

async function main() {
	const svg = fs.readFileSync(SVG_PATH)

	for (const { name, size } of SIZES) {
		await sharp(svg).resize(size, size).png().toFile(path.join(PUBLIC_DIR, name))
		console.log(`Generated ${name}`)
	}

	const icoSizes = [16, 32, 48]
	const pngBuffers = await Promise.all(
		icoSizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()),
	)

	const { default: pngToIco } = await import("png-to-ico")
	const icoBuffer = await pngToIco(pngBuffers)
	fs.writeFileSync(path.join(PUBLIC_DIR, "favicon.ico"), icoBuffer)
	console.log("Generated favicon.ico")
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
