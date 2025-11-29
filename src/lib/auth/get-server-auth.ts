let authInstance: typeof import('./server')['auth'] | null = null

export const getServerAuth = async (): Promise<
	typeof import('./server')['auth']
> => {
	if (import.meta.env.SSR) {
		if (!authInstance) {
			const authModule = await import('./server')
			authInstance = authModule.auth
		}

		return authInstance!
	}

	throw new Error('getServerAuth should only be called on the server')
}
