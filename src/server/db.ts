import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '@/generated/prisma/client'

/**
 * Creates a Prisma Client instance.
 * - In production: Uses pg driver adapter with connection pooling for Supabase
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

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient
	pool: Pool
}

export function getPrisma(): PrismaClient {
	const connectionString = process.env.DATABASE_URL

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
			// Create a connection pool for Supabase
			// Using ?pgbouncer=true in DATABASE_URL for Supavisor connection pooling
			const pool = new Pool({ connectionString })
			globalForPrisma.pool = pool

			const adapter = new PrismaPg(pool)
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
