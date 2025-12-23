import { PrismaClient } from '../src/generated/prisma'
import { auth } from '../src/lib/auth/server'

const prisma = new PrismaClient()

async function main() {
	const email = process.env.ADMIN_EMAIL || 'admin@changelogs.directory'
	const password = process.env.ADMIN_PASSWORD || 'password123'
	const name = 'Admin User'

	console.log(`Seeding admin user: ${email}`)

	try {
		const user = await auth.api.signUpEmail({
			body: {
				email,
				password,
				name,
			},
		})

		if (user) {
			console.log('Admin user created via better-auth')
			// Update role to admin directly in DB since signup doesn't allow setting role usually
			await prisma.user.update({
				where: { email },
				data: { role: 'ADMIN' },
			})
			console.log('Admin role assigned')
		}
	} catch (error) {
		console.error('Error creating admin user:', error)
	}
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
