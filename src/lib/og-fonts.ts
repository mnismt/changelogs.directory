// In-memory cache for loaded fonts (caches for lifetime of the process)
const fontCache = new Map<string, ArrayBuffer>()

/**
 * Load a font from Google Fonts API with caching
 * @param font - Font family and weight (e.g., 'Fira+Code:wght@400')
 * @param text - Text to include in the font (for optimization)
 * @returns ArrayBuffer containing the font data
 */
async function loadGoogleFont(
	font: string,
	text: string,
): Promise<ArrayBuffer> {
	// Create cache key from font family and text
	const cacheKey = `${font}:${text}`

	// Return cached font if available
	const cachedFont = fontCache.get(cacheKey)
	if (cachedFont) {
		return cachedFont
	}

	const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`
	const css = await (await fetch(url)).text()
	const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/)

	if (resource) {
		const response = await fetch(resource[1])
		if (response.status === 200) {
			const fontData = await response.arrayBuffer()
			// Cache the font data
			fontCache.set(cacheKey, fontData)
			return fontData
		}
	}
	throw new Error(`Failed to load font: ${font}`)
}

/**
 * Load OG image fonts from Google Fonts API
 * @param text - Optional text to optimize font loading (only includes required glyphs)
 * @returns Array of font configurations for @vercel/og
 */
export async function loadOGFonts(text?: string) {
	// Use default character set if no text provided
	// Include special characters used in OG images (like the bullet ●)
	const defaultText =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~` ●'
	const textToLoad = text || defaultText

	try {
		const [firaCode, inter, interBold] = await Promise.all([
			loadGoogleFont('Fira+Code:wght@400', textToLoad),
			loadGoogleFont('Inter:wght@400', textToLoad),
			loadGoogleFont('Inter:wght@600', textToLoad),
		])

		return [
			{
				name: 'Fira Code',
				data: firaCode,
				weight: 400 as const,
				style: 'normal' as const,
			},
			{
				name: 'Inter',
				data: inter,
				weight: 400 as const,
				style: 'normal' as const,
			},
			{
				name: 'Inter',
				data: interBold,
				weight: 600 as const,
				style: 'normal' as const,
			},
		]
	} catch (error) {
		console.error('Failed to load OG fonts:', error)
		// Return empty array - @vercel/og will fall back to Noto Sans
		return []
	}
}
