import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

/**
 * Creates a Prisma Client instance.
 * - In production: Uses Neon's serverless driver adapter for edge runtimes
 * - In local/dev: Uses standard PostgreSQL connection
 *
 * @returns A configured PrismaClient instance
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

	const isProduction = process.env.NODE_ENV === 'production'

	if (isProduction) {
		const adapter = new PrismaNeon({ connectionString })
		return new PrismaClient({ adapter })
	}

	return new PrismaClient()
}
