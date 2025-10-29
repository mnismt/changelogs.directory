import { createServerFn } from '@tanstack/react-start'

export const subscribeToWaitlist = createServerFn({ method: 'POST' })
	.inputValidator((data: unknown) => {
		if (!data || typeof data !== 'object' || !('email' in data)) {
			throw new Error('Email is required')
		}

		const email = (data as { email: unknown }).email

		if (typeof email !== 'string') {
			throw new Error('Email must be a string')
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(email)) {
			throw new Error('Invalid email format')
		}

		return { email: email.toLowerCase().trim() }
	})
	.handler(async ({ data }) => {
		// Get MongoDB Data API credentials from environment
		const apiUrl = process.env.MONGODB_DATA_API_URL
		const apiKey = process.env.MONGODB_DATA_API_KEY

		if (!apiUrl || !apiKey) {
			console.error('MongoDB Data API credentials not found in environment')
			throw new Error('Database not configured')
		}

		try {
			// Check if email already exists
			const findResponse = await fetch(`${apiUrl}/action/findOne`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'api-key': apiKey,
				},
				body: JSON.stringify({
					dataSource: 'Cluster0', // Default cluster name, adjust if different
					database: 'changelogs-directory',
					collection: 'waitlist',
					filter: { email: data.email },
				}),
			})

			const findResult = await findResponse.json()

			if (findResult.document) {
				throw new Error('Email already registered')
			}

			// Insert email into database
			const insertResponse = await fetch(`${apiUrl}/action/insertOne`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'api-key': apiKey,
				},
				body: JSON.stringify({
					dataSource: 'Cluster0', // Default cluster name, adjust if different
					database: 'changelogs-directory',
					collection: 'waitlist',
					document: {
						email: data.email,
						createdAt: new Date().toISOString(),
					},
				}),
			})

			const insertResult = await insertResponse.json()

			if (!insertResponse.ok || !insertResult.insertedId) {
				console.error('Insert failed:', insertResult)
				throw new Error('Failed to save email')
			}

			return {
				success: true,
				message: 'Successfully added to waitlist!',
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				// Re-throw known errors (like "Email already registered")
				if (error.message === 'Email already registered') {
					throw error
				}
				console.error('Database error:', error)
			}
			throw new Error('Failed to save email')
		}
	})
