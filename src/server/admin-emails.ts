import { createServerFn } from '@tanstack/react-start'
import { getPrisma } from './db'

export const getEmailLogs = createServerFn({ method: 'GET' }).handler(
	async () => {
		const prisma = getPrisma()
		const logs = await prisma.emailLog.findMany({
			orderBy: {
				createdAt: 'desc',
			},
			take: 100, // Limit to last 100 emails for now
		})
		return logs
	},
)
