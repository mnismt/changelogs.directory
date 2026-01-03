import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
	console.log("Cleaning up contributor changes for OpenCode...")

	// Find changes that are contributor mentions (start with @)
	const contributorChanges = await prisma.change.findMany({
		where: {
			release: {
				tool: { slug: "opencode" },
			},
			title: { startsWith: "@" },
		},
		select: {
			id: true,
			title: true,
			release: { select: { version: true } },
		},
	})

	console.log(`Found ${contributorChanges.length} contributor changes to delete`)

	if (contributorChanges.length > 0) {
		console.log("\nSample changes to be deleted:")
		for (const change of contributorChanges.slice(0, 5)) {
			console.log(`  [${change.release.version}] ${change.title}`)
		}
		if (contributorChanges.length > 5) {
			console.log(`  ... and ${contributorChanges.length - 5} more`)
		}

		// Delete the changes
		const deleted = await prisma.change.deleteMany({
			where: {
				release: {
					tool: { slug: "opencode" },
				},
				title: { startsWith: "@" },
			},
		})

		console.log(`\n✅ Deleted ${deleted.count} contributor changes`)
	} else {
		console.log("No contributor changes found to delete")
	}
}

main()
	.catch((error) => {
		console.error("Error cleaning up contributor changes:", error)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
