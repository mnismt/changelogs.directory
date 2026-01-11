import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { promisify } from "util";
import { fileURLToPath } from "url";

const gunzip = promisify(zlib.gunzip);
const readFile = promisify(fs.readFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const SNAPSHOT_PATH = path.join(__dirname, "../tests/fixtures/e2e-db.snapshot.json.gz");

async function main() {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    console.error(`Snapshot not found at ${SNAPSHOT_PATH}`);
    process.exit(1);
  }

  console.log("Reading snapshot...");
  const buffer = await readFile(SNAPSHOT_PATH);
  const jsonString = (await gunzip(buffer)).toString();
  const snapshot = JSON.parse(jsonString);

  console.log(`Snapshot loaded. Source: ${snapshot.meta.source}, Created: ${snapshot.meta.createdAt}`);
  console.log(`Tools to import: ${snapshot.meta.tools.join(", ")}`);

  const toolsToImport = snapshot.meta.tools;

  await prisma.$transaction(
    async (tx) => {
      // 1. Clean up existing data for these tools
      console.log("Cleaning up existing data...");
      
      // Find IDs of tools to remove
      const tools = await tx.tool.findMany({
        where: { slug: { in: toolsToImport } },
        select: { id: true },
      });
      const toolIds = tools.map(t => t.id);

      if (toolIds.length > 0) {
        await tx.change.deleteMany({
          where: { release: { toolId: { in: toolIds } } }
        });
        await tx.release.deleteMany({
          where: { toolId: { in: toolIds } }
        });
        await tx.fetchLog.deleteMany({
          where: { toolId: { in: toolIds } }
        });
        await tx.tool.deleteMany({
          where: { id: { in: toolIds } }
        });
      }

      // 2. Insert Tools
      console.log(`Inserting ${snapshot.tools.length} tools...`);
      const toolIdMap = new Map<string, string>(); // slug -> id

      for (const t of snapshot.tools) {
        const created = await tx.tool.create({
          data: {
            slug: t.slug,
            name: t.name,
            vendor: t.vendor,
            description: t.description,
            homepage: t.homepage,
            repositoryUrl: t.repositoryUrl,
            sourceType: t.sourceType,
            sourceUrl: t.sourceUrl,
            sourceConfig: t.sourceConfig as any,
            tags: t.tags,
            isActive: t.isActive,
            lastFetchedAt: t.lastFetchedAt ? new Date(t.lastFetchedAt) : null,
            logoUrl: t.logoUrl,
          }
        });
        toolIdMap.set(t.slug, created.id);
      }

      // 3. Insert Releases
      console.log(`Inserting ${snapshot.releases.length} releases...`);
      const releaseIdMap = new Map<string, string>(); // "slug:version" -> id

      // Process in chunks to avoid overwhelming the DB if large
      const releaseChunks = chunkArray(snapshot.releases, 50);
      for (const chunk of releaseChunks) {
          // We can't use createMany easily if we need the IDs back for changes.
          // But we can use create and loop.
          for (const r of chunk) {
              const toolId = toolIdMap.get(r.toolSlug);
              if (!toolId) continue;

              const created = await tx.release.create({
                  data: {
                      toolId,
                      version: r.version,
                      versionSort: r.versionSort,
                      releaseDate: r.releaseDate ? new Date(r.releaseDate) : null,
                      publishedAt: new Date(r.publishedAt),
                      sourceUrl: r.sourceUrl,
                      rawContent: r.rawContent,
                      contentHash: r.contentHash,
                      title: r.title,
                      summary: r.summary,
                      headline: r.headline,
                      isPrerelease: r.isPrerelease,
                  }
              });
              releaseIdMap.set(`${r.toolSlug}:${r.version}`, created.id);
          }
      }

      // 4. Insert Changes
      console.log(`Inserting ${snapshot.changes.length} changes...`);
      
      // We can use createMany for changes as we don't need their IDs later
      const changesToInsert = snapshot.changes.map((c: any) => {
          const releaseId = releaseIdMap.get(`${c.toolSlug}:${c.version}`);
          if (!releaseId) return null;

          return {
              releaseId,
              type: c.type,
              title: c.title,
              description: c.description,
              platform: c.platform,
              component: c.component,
              isBreaking: c.isBreaking,
              isSecurity: c.isSecurity,
              isDeprecation: c.isDeprecation,
              impact: c.impact,
              links: c.links,
              media: c.media,
              order: c.order,
          };
      }).filter((c: any) => c !== null);

      if (changesToInsert.length > 0) {
          // createMany is restricted in some environments/adapters, but standard PG supports it.
          // Doing in chunks.
          const changeChunks = chunkArray(changesToInsert, 100);
          for (const chunk of changeChunks) {
              await tx.change.createMany({
                  data: chunk
              });
          }
      }
    },
    { timeout: 60000 }
  );

  console.log("Snapshot import completed successfully.");
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunked: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
