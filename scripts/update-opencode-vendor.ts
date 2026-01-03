import { PrismaClient } from "../src/generated/prisma"

async function main() {
	const prisma = new PrismaClient()
	const result = await prisma.tool.update({
		where: { slug: "opencode" },
		data: {
			vendor: "anoma.ly",
			repositoryUrl: "https://github.com/anomaly/opencode",
			sourceUrl: "https://api.github.com/repos/anomaly/opencode/releases",
			tags: ["cli", "ai", "agent", "anomaly", "opencode", "terminal", "open-source"],
		},
	})
	console.log("Updated:", result.name, "- Vendor:", result.vendor)
	await prisma.$disconnect()
}

main()
