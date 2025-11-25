import { faker } from "@faker-js/faker"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const TOTAL_SIGNUPS = 74
const PROVIDERS = ["gmail.com", "outlook.com", "icloud.com", "yahoo.com"] as const

const currentYear = new Date().getFullYear()
const startDate = new Date(Date.UTC(currentYear, 9, 30, 0, 0, 0))
const endDate = new Date(Date.UTC(currentYear, 10, 24, 23, 59, 59))

function getRandomDate(): Date {
	return faker.date.between({ from: startDate, to: endDate })
}

function generateEmail(suffix: number): string {
	const first = faker.person.firstName().toLowerCase()
	const last = faker.person.lastName().toLowerCase()
	const provider = faker.helpers.arrayElement(PROVIDERS)
	const numeric = faker.number.int({ min: 1, max: 9999 })
	return `${first}.${last}${numeric + suffix}@${provider}`
}

async function main() {
	console.log("Generating waitlist signups...")
	const emails = new Set<string>()

	while (emails.size < TOTAL_SIGNUPS) {
		emails.add(generateEmail(emails.size))
	}

	const waitlistEntries = Array.from(emails).map((email, index) => {
		// Ensure we have at least one entry on the start and end dates
		let createdAt: Date
		if (index === 0) {
			createdAt = startDate
		} else if (index === 1) {
			createdAt = endDate
		} else {
			createdAt = getRandomDate()
		}

		return {
			email,
			createdAt,
		}
	})

	// Optional wipe: set CLEAR_WAITLIST=true when running if you want a clean slate
	if (process.env.CLEAR_WAITLIST === "true") {
		await prisma.waitlist.deleteMany()
		console.log("Cleared existing waitlist entries")
	}

	const result = await prisma.waitlist.createMany({
		data: waitlistEntries,
		skipDuplicates: true,
	})

	console.log(`Inserted ${result.count} waitlist signups between 10/30 and 11/24 (year: ${currentYear})`)
}

main()
	.catch((error) => {
		console.error("Failed to seed waitlist:", error)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
