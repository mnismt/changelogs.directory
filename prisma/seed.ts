import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
	console.log("Starting database seed...")

	// Seed Claude Code tool
	const claudeCode = await prisma.tool.upsert({
		where: { slug: "claude-code" },
		update: {
			name: "Claude Code",
			vendor: "Anthropic",
			description:
				"AI-powered CLI tool that helps with software engineering tasks, integrating Claude with your terminal.",
			homepage: "https://claude.ai/code",
			repositoryUrl: "https://github.com/anthropics/claude-code",
			sourceType: "CHANGELOG_MD",
			sourceUrl:
				"https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md",
			tags: ["ai", "cli", "code-editor", "agent", "anthropic"],
			isActive: true,
		},
		create: {
			slug: "claude-code",
			name: "Claude Code",
			vendor: "Anthropic",
			description:
				"AI-powered CLI tool that helps with software engineering tasks, integrating Claude with your terminal.",
			homepage: "https://claude.ai/code",
			repositoryUrl: "https://github.com/anthropics/claude-code",
			sourceType: "CHANGELOG_MD",
			sourceUrl:
				"https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md",
			tags: ["ai", "cli", "code-editor", "agent", "anthropic"],
			isActive: true,
		},
	})

	console.log(`✅ Seeded tool: ${claudeCode.name} (${claudeCode.slug})`)

	console.log("Database seed completed!")
}

main()
	.catch((error) => {
		console.error("Error seeding database:", error)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
