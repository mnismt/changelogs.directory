import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

/**
 * Creates a Prisma Client instance with Neon's serverless driver adapter.
 * This enables low-latency queries over HTTP/WebSockets instead of TCP,
 * making it perfect for edge runtimes like Cloudflare Workers.
 *
 * @returns A configured PrismaClient instance ready to use with Neon
 *
 * @example
 * ```typescript
 * import { getPrisma } from './db'
 *
 * // In a server function
 * export const getWaitlist = createServerFn({ method: 'GET' })
 *   .handler(async () => {
 *     const prisma = getPrisma()
 *     const users = await prisma.waitlist.findMany()
 *     return users
 *   })
 * ```
 */
export function getPrisma(): PrismaClient {
	const connectionString = process.env.DATABASE_URL

	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set')
	}

	// Create Neon adapter with connection string
	const adapter = new PrismaNeon({ connectionString })

	// Return new PrismaClient with the Neon adapter
	return new PrismaClient({ adapter })
}
