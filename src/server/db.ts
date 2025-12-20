import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'
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

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export function getPrisma(): PrismaClient {
	const connectionString = process.env.DATABASE_URL

	console.log(connectionString)

	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set')
	}

	// Use a global variable to prevent creating multiple instances in both
	// development and production, which can exhaust database connections.
	// This is critical for serverless environments where many parallel requests
	// might call getPrisma() simultaneously.
	if (!globalForPrisma.prisma) {
		const isProduction = process.env.NODE_ENV === 'production'

		if (isProduction) {
			const adapter = new PrismaPg({ connectionString })
			globalForPrisma.prisma = new PrismaClient({
				adapter,
				log: ['error', 'warn'],
			})
		} else {
			globalForPrisma.prisma = new PrismaClient()
		}
	}

	return globalForPrisma.prisma
}
