/**
 * Utility functions for OG Image Response handling
 * Provides consistent response creation and error handling
 */

/**
 * Creates a Response object for OG images with proper headers
 */
export function createOGImageResponse(imageBody: ReadableStream | null) {
	return new Response(imageBody, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control':
				'public, max-age=3600, s-maxage=86400, stale-while-revalidate=31536000',
		},
	})
}

/**
 * Creates an error Response for failed OG image generation
 */
export function createOGErrorResponse(error: unknown, context: string) {
	console.error(`Error generating ${context} OG image:`, error)
	return new Response('Failed to generate OG image', { status: 500 })
}
