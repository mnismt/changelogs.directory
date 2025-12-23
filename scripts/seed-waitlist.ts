import { faker } from "@faker-js/faker"
import { PrismaClient } from "../src/generated/prisma"

const prisma = new PrismaClient()

const TOTAL_SIGNUPS = 73
const PROVIDERS = ["gmail.com", "outlook.com", "icloud.com", "yahoo.com"] as const

const START_DATE = "2025-10-30"
const END_DATE = "2025-11-30"

const startDate = new Date(`${START_DATE}T00:00:00Z`)
const endDate = new Date(`${END_DATE}T23:59:59Z`)

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

	console.log(`Inserted ${result.count} waitlist signups between ${START_DATE} and ${END_DATE}`)
}

main()
	.catch((error) => {
		console.error("Failed to seed waitlist:", error)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
