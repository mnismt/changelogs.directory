import { timingSafeEqual } from 'node:crypto'

/**
 * Validates the request against `process.env.ADMIN_API_KEY`.
 * Accepts `Authorization: Bearer <key>` or `X-Admin-Api-Key: <key>`.
 * If the env var is unset or empty, no request is authorized.
 */
export function isAuthorizedAdminApiRequest(request: Request): boolean {
	const expected = process.env.ADMIN_API_KEY
	if (!expected) {
		return false
	}

	const provided = getProvidedAdminApiKey(request)
	if (!provided) {
		return false
	}

	try {
		const a = Buffer.from(provided, 'utf8')
		const b = Buffer.from(expected, 'utf8')
		if (a.length !== b.length) {
			return false
		}
		return timingSafeEqual(a, b)
	} catch {
		return false
	}
}

function getProvidedAdminApiKey(request: Request): string | null {
	const auth = request.headers.get('authorization')
	if (auth?.startsWith('Bearer ')) {
		const token = auth.slice('Bearer '.length).trim()
		if (token) {
			return token
		}
	}

	const header = request.headers.get('x-admin-api-key')
	return header?.trim() || null
}
