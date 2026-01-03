import path from 'node:path'
import type { PrismaConfig } from 'prisma'
import { defineConfig } from 'prisma/config'

type PrismaConfigWithUrl = PrismaConfig & {
	datasource: { url: string }
}

export default defineConfig({
	experimental: {
		// @ts-expect-error - adapter is missing in type definition
		adapter: true,
	},
	schema: path.join(import.meta.dirname, 'prisma/schema.prisma'),
	datasource: {
		url: process.env.DATABASE_URL!,
	},
	async adapter() {
		const { PrismaPg } = await import('@prisma/adapter-pg')
		const pg = await import('pg')
		const pool = new pg.default.Pool({
			connectionString: process.env.DATABASE_URL,
		})
		return new PrismaPg(pool)
	},
}) as PrismaConfigWithUrl
