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

	// Seed OpenAI Codex tool
	const codex = await prisma.tool.upsert({
		where: { slug: "codex" },
		update: {
			name: "Codex",
			vendor: "OpenAI",
			description:
				"OpenAI Codex CLI - AI-powered code generation and understanding tool built with Rust.",
			homepage: "https://github.com/openai/codex",
			repositoryUrl: "https://github.com/openai/codex",
			sourceType: "GITHUB_RELEASES",
			sourceUrl: "https://api.github.com/repos/openai/codex/releases",
			sourceConfig: {
				versionPrefix: "rust-v",
				includePreReleases: true,
			},
			tags: ["ai", "cli", "code-generation", "openai", "rust"],
			isActive: true,
		},
		create: {
			slug: "codex",
			name: "Codex",
			vendor: "OpenAI",
			description:
				"OpenAI Codex CLI - AI-powered code generation and understanding tool built with Rust.",
			homepage: "https://github.com/openai/codex",
			repositoryUrl: "https://github.com/openai/codex",
			sourceType: "GITHUB_RELEASES",
			sourceUrl: "https://api.github.com/repos/openai/codex/releases",
			sourceConfig: {
				versionPrefix: "rust-v",
				includePreReleases: true,
			},
			tags: ["ai", "cli", "code-generation", "openai", "rust"],
			isActive: true,
		},
	})

	console.log(`✅ Seeded tool: ${codex.name} (${codex.slug})`)

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
