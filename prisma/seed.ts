import { PrismaClient } from "../src/generated/prisma"

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
				"Anthropic's CLI tool that unleashs Claude's raw power directly in your terminal or IDE",
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
				"Anthropic's CLI tool that unleashs Claude's raw power directly in your terminal or IDE",
			homepage: "https://claude.ai/code",
			repositoryUrl: "https://github.com/anthropics/claude-code",
			sourceType: "CHANGELOG_MD",
			sourceUrl:
				"https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md",
			tags: ["cli", "code-editor", "agent", "anthropic", "claude", "sonnet", "opus"],
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
				"OpenAI's Rust-based CLI for interacting with the Codex model.",
			homepage: "https://github.com/openai/codex",
			repositoryUrl: "https://github.com/openai/codex",
			sourceType: "GITHUB_RELEASES",
			sourceUrl: "https://api.github.com/repos/openai/codex/releases",
			sourceConfig: {
				versionPrefix: "rust-v",
				includePreReleases: true,
			},
			tags: ["cli", "code-editor", "openai", "chatgpt", "codex"],
			isActive: true,
		},
		create: {
			slug: "codex",
			name: "Codex",
			vendor: "OpenAI",
			description:
				"OpenAI's Rust-based CLI for interacting with the Codex model.",
			homepage: "https://github.com/openai/codex",
			repositoryUrl: "https://github.com/openai/codex",
			sourceType: "GITHUB_RELEASES",
			sourceUrl: "https://api.github.com/repos/openai/codex/releases",
			sourceConfig: {
				versionPrefix: "rust-v",
				includePreReleases: true,
			},
			tags: ["cli", "code-editor", "openai", "chatgpt", "codex"],
			isActive: true,
		},
	})

	console.log(`✅ Seeded tool: ${codex.name} (${codex.slug})`)

	// Seed Cursor tool
	const cursorTool = await prisma.tool.upsert({
		where: { slug: "cursor" },
		update: {
			name: "Cursor",
			vendor: "Anysphere",
			description:
				"One of the first AI-native code editors, built on a VS Code fork",
			homepage: "https://cursor.com",
			repositoryUrl: "https://cursor.com",
			sourceType: "CUSTOM_API",
			sourceUrl: "https://cursor.com/changelog",
			sourceConfig: {
				baseUrl: "https://cursor.com",
				startPath: "/changelog",
				articleSelector: "#main.section.section--longform article",
				bodySelector: ".prose",
				nextLinkSelector: "a.card--pagination",
				maxPagesPerRun: 6,
				initialPageCount: 40,
			},
			tags: ["ide", "editor", "pair-programming", "anysphere", "cursor"],
			isActive: true,
		},
		create: {
			slug: "cursor",
			name: "Cursor",
			vendor: "Anysphere",
			description:
				"One of the first AI-native code editors, built on a VS Code fork",
			homepage: "https://cursor.com",
			repositoryUrl: "https://cursor.com",
			sourceType: "CUSTOM_API",
			sourceUrl: "https://cursor.com/changelog",
			sourceConfig: {
				baseUrl: "https://cursor.com",
				startPath: "/changelog",
				articleSelector: "#main.section.section--longform article",
				bodySelector: ".prose",
				nextLinkSelector: "a.card--pagination",
				maxPagesPerRun: 6,
				initialPageCount: 40,
			},
			tags: ["ide", "editor", "pair-programming", "anysphere", "cursor"],
			isActive: true,
		},
	})

	console.log(`✅ Seeded tool: ${cursorTool.name} (${cursorTool.slug})`)

	// Seed Windsurf tool
	const windsurf = await prisma.tool.upsert({
		where: { slug: "windsurf" },
		update: {
			name: "Windsurf",
			vendor: "Cognition",
			description: "AI-powered IDE by Cognition with embedded agentic workflows",
			homepage: "https://windsurf.com",
			repositoryUrl: "https://windsurf.com",
			sourceType: "CUSTOM_API",
			sourceUrl: "https://windsurf.com/changelog",
			sourceConfig: {
				baseUrl: "https://windsurf.com",
				startPath: "/changelog",
				releaseSelector: "div[id][class*=\"scroll-mt-10\"]",
				bodySelector: ".prose",
				maxReleasesPerRun: 200,
			},
			tags: ["ide", "editor", "cognition", "windsurf", "ai"],
			isActive: true,
		},
		create: {
			slug: "windsurf",
			name: "Windsurf",
			vendor: "Cognition",
			description: "AI-powered IDE by Cognition with embedded agentic workflows",
			homepage: "https://windsurf.com",
			repositoryUrl: "https://windsurf.com",
			sourceType: "CUSTOM_API",
			sourceUrl: "https://windsurf.com/changelog",
			sourceConfig: {
				baseUrl: "https://windsurf.com",
				startPath: "/changelog",
				releaseSelector: "div[id][class*=\"scroll-mt-10\"]",
				bodySelector: ".prose",
				maxReleasesPerRun: 200,
			},
			tags: ["ide", "editor", "cognition", "windsurf", "ai"],
			isActive: true,
		},
	})

	console.log(`✅ Seeded tool: ${windsurf.name} (${windsurf.slug})`)

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
