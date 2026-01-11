import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { promisify } from "util";
import { fileURLToPath } from "url";

const gzip = promisify(zlib.gzip);
const writeFile = promisify(fs.writeFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const OUTPUT_PATH = path.join(__dirname, "../tests/fixtures/e2e-db.snapshot.json.gz");

// All tools from the registry - must match TOOL_SLUGS in src/lib/tool-registry.tsx
const TARGET_TOOLS = [
	"claude-code",
	"codex",
	"cursor",
	"windsurf",
	"opencode",
	"antigravity",
	"gemini-cli",
];

// Tools that need deep release data for pagination tests
const DEEP_DATA_TOOLS = ["codex", "cursor"];
const DEEP_RELEASES_COUNT = 60;
const MINIMAL_RELEASES_COUNT = 3;

function getReleasesPerTool(slug: string): number {
	return DEEP_DATA_TOOLS.includes(slug) ? DEEP_RELEASES_COUNT : MINIMAL_RELEASES_COUNT;
}

async function main() {
  console.log("Starting E2E snapshot export...");
  console.log(`Target tools: ${TARGET_TOOLS.join(", ")}`);
  console.log(`Deep data tools (${DEEP_RELEASES_COUNT} non-prerelease releases): ${DEEP_DATA_TOOLS.join(", ")}`);
  console.log(`Other tools: ${MINIMAL_RELEASES_COUNT} releases each`);

  const snapshot = {
    meta: {
      createdAt: new Date().toISOString(),
      source: "production",
      tools: TARGET_TOOLS,
      releaseCounts: {} as Record<string, number>,
      schemaVersion: 1,
    },
    tools: [] as any[],
    releases: [] as any[],
    changes: [] as any[],
  };

  const missingTools: string[] = [];

  for (const slug of TARGET_TOOLS) {
    console.log(`Exporting tool: ${slug}`);
    const tool = await prisma.tool.findUnique({
      where: { slug },
    });

    if (!tool) {
      console.warn(`⚠️ Tool not found in database: ${slug}`);
      missingTools.push(slug);
      continue;
    }

    // Export tool (exclude id, createdAt, updatedAt, fetchLogs, etc.)
    snapshot.tools.push({
      slug: tool.slug,
      name: tool.name,
      vendor: tool.vendor,
      description: tool.description,
      homepage: tool.homepage,
      repositoryUrl: tool.repositoryUrl,
      sourceType: tool.sourceType,
      sourceUrl: tool.sourceUrl,
      sourceConfig: tool.sourceConfig,
      tags: tool.tags,
      isActive: tool.isActive,
      lastFetchedAt: tool.lastFetchedAt?.toISOString() || null,
      logoUrl: tool.logoUrl,
    });

    // Export releases
    // For deep data tools, exclude prereleases so pagination tests work
    // (default UI filter is showPrereleases: false)
    const releases = await prisma.release.findMany({
      where: { 
        toolId: tool.id,
        ...(DEEP_DATA_TOOLS.includes(slug) ? { isPrerelease: false } : {}),
      },
      orderBy: [
        { releaseDate: "desc" },
        { versionSort: "desc" },
      ],
      take: getReleasesPerTool(slug),
      include: {
        changes: true,
      },
    });

    console.log(`Found ${releases.length} releases for ${slug}`);
    snapshot.meta.releaseCounts[slug] = releases.length;

    for (const release of releases) {
      snapshot.releases.push({
        toolSlug: tool.slug,
        version: release.version,
        versionSort: release.versionSort,
        releaseDate: release.releaseDate?.toISOString() || null,
        publishedAt: release.publishedAt.toISOString(),
        sourceUrl: release.sourceUrl,
        rawContent: release.rawContent,
        contentHash: release.contentHash,
        title: release.title,
        summary: release.summary,
        headline: release.headline,
        isPrerelease: release.isPrerelease,
      });

      for (const change of release.changes) {
        snapshot.changes.push({
          toolSlug: tool.slug,
          version: release.version,
          type: change.type,
          title: change.title,
          description: change.description,
          platform: change.platform,
          component: change.component,
          isBreaking: change.isBreaking,
          isSecurity: change.isSecurity,
          isDeprecation: change.isDeprecation,
          impact: change.impact,
          links: change.links,
          media: change.media,
          order: change.order,
        });
      }
    }
  }

  // Fail if any target tools are missing from database
  if (missingTools.length > 0) {
    console.error(`\n❌ Export incomplete! Missing tools: ${missingTools.join(", ")}`);
    console.error("Please seed production database first: DATABASE_URL=<prod> pnpm prisma db seed");
    process.exit(1);
  }

  const jsonString = JSON.stringify(snapshot, null, 2);
  const compressed = await gzip(jsonString);

  // Ensure directory exists
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await writeFile(OUTPUT_PATH, compressed);
  console.log(`Snapshot saved to ${OUTPUT_PATH} (${(compressed.length / 1024).toFixed(2)} KB)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
