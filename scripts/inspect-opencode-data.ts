import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
	// Find OpenCode tool
	const tool = await prisma.tool.findFirst({
		where: { slug: "opencode" },
	})

	if (!tool) {
		console.log("OpenCode tool not found")
		return
	}

	console.log("=== OpenCode Tool ===")
	console.log(`ID: ${tool.id}, Name: ${tool.name}`)

	// Get a few releases with their raw data
	const releases = await prisma.release.findMany({
		where: { toolId: tool.id },
		orderBy: { releaseDate: "desc" },
		take: 5,
		include: {
			changes: true,
		},
	})

	console.log(`\n=== Found ${releases.length} releases ===\n`)

	for (const release of releases) {
		console.log("=".repeat(80))
		console.log(`Version: ${release.version}`)
		console.log(`Release Date: ${release.releaseDate}`)
		console.log(`\n--- bodyRaw (first 2000 chars) ---`)
		console.log(release.bodyRaw?.slice(0, 2000) || "(empty)")
		console.log(`\n--- bodySummary ---`)
		console.log(release.bodySummary || "(empty)")

		console.log(`\n--- Changes (${release.changes.length} total) ---`)
		for (const change of release.changes.slice(0, 5)) {
			console.log(`  [${change.type}] ${change.title}`)
		}
		if (release.changes.length > 5) {
			console.log(`  ... and ${release.changes.length - 5} more`)
		}

		// Look for contributor-related changes
		const contributorChanges = release.changes.filter(
			(c) =>
				c.title?.toLowerCase().includes("contributor") ||
				c.title?.startsWith("@") ||
				c.title?.includes("Thanks to")
		)

		if (contributorChanges.length > 0) {
			console.log(`\n--- Contributor-related changes ---`)
			for (const c of contributorChanges) {
				console.log(`  [${c.type}] ${c.title}`)
			}
		}

		console.log("\n")
	}

	// Find all changes that might be contributor-related
	console.log("=".repeat(80))
	console.log("=== All changes mentioning contributors or @ ===")
	const allContributorChanges = await prisma.change.findMany({
		where: {
			release: { toolId: tool.id },
			OR: [
				{ title: { contains: "contributor", mode: "insensitive" } },
				{ title: { startsWith: "@" } },
				{ title: { contains: "Thanks" } },
			],
		},
		include: {
			release: { select: { version: true } },
		},
	})

	console.log(`Found ${allContributorChanges.length} contributor-related changes:`)
	for (const c of allContributorChanges) {
		console.log(`  [${c.release.version}] [${c.type}] ${c.title}`)
	}

	// Also search bodyRaw for contributor sections
	console.log("\n" + "=".repeat(80))
	console.log("=== Searching bodyRaw for contributor patterns ===")
	const releasesWithBody = await prisma.release.findMany({
		where: {
			toolId: tool.id,
			bodyRaw: { not: null },
		},
		take: 10,
		orderBy: { releaseDate: "desc" },
	})

	for (const r of releasesWithBody) {
		if (r.bodyRaw) {
			const lines = r.bodyRaw.split("\n")
			const contributorLines = lines.filter(
				(l) =>
					l.includes("@") ||
					l.toLowerCase().includes("contributor") ||
					l.toLowerCase().includes("new contributor")
			)
			if (contributorLines.length > 0) {
				console.log(`\n[${r.version}] Found ${contributorLines.length} contributor lines:`)
				for (const line of contributorLines.slice(0, 10)) {
					console.log(`  ${line}`)
				}
			}
		}
	}
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect())
