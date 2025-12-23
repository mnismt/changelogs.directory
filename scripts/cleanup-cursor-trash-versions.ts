/**
 * Cleanup script for removing fingerprint-based "trash" Cursor releases.
 *
 * These releases were created when the parser couldn't extract a valid slug
 * from the changelog page, falling back to a content fingerprint.
 *
 * Valid Cursor versions follow the pattern: cursor-<major>-<minor> (e.g., cursor-2-1)
 * Trash versions look like: cursor-6408027c8713 (12-char hex fingerprint)
 *
 * Usage:
 *   DATABASE_URL="..." pnpm tsx scripts/cleanup-cursor-trash-versions.ts --dry-run
 *   DATABASE_URL="..." pnpm tsx scripts/cleanup-cursor-trash-versions.ts
 */

import { PrismaClient } from "../src/generated/prisma"

const prisma = new PrismaClient()

const VALID_CURSOR_VERSION_PATTERN = /^cursor-\d+-\d+$/

async function main() {
	const isDryRun = process.argv.includes('--dry-run')

	console.log('🔍 Cursor Trash Version Cleanup Script')
	console.log(`   Mode: ${isDryRun ? 'DRY RUN (no changes)' : '⚠️  LIVE (will delete)'}`)
	console.log('')

	const cursorTool = await prisma.tool.findUnique({
		where: { slug: 'cursor' },
	})

	if (!cursorTool) {
		console.error('❌ Cursor tool not found in database')
		process.exit(1)
	}

	console.log(`📦 Tool: ${cursorTool.name} (${cursorTool.id})`)

	const allReleases = await prisma.release.findMany({
		where: { toolId: cursorTool.id },
		select: {
			id: true,
			version: true,
			releaseDate: true,
			headline: true,
			_count: { select: { changes: true } },
		},
		orderBy: { releaseDate: 'desc' },
	})

	const validReleases = allReleases.filter((r) =>
		VALID_CURSOR_VERSION_PATTERN.test(r.version),
	)
	const trashReleases = allReleases.filter(
		(r) => !VALID_CURSOR_VERSION_PATTERN.test(r.version),
	)

	console.log('')
	console.log('📊 Summary:')
	console.log(`   Total releases: ${allReleases.length}`)
	console.log(`   Valid releases: ${validReleases.length}`)
	console.log(`   Trash releases: ${trashReleases.length}`)
	console.log('')

	if (trashReleases.length === 0) {
		console.log('✅ No trash releases found. Database is clean!')
		return
	}

	console.log('🗑️  Trash releases to delete:')
	for (const release of trashReleases.slice(0, 10)) {
		console.log(
			`   - ${release.version} | ${release.releaseDate?.toISOString().slice(0, 10) ?? 'no date'} | ${release._count.changes} changes | "${release.headline?.slice(0, 40)}..."`,
		)
	}
	if (trashReleases.length > 10) {
		console.log(`   ... and ${trashReleases.length - 10} more`)
	}
	console.log('')

	console.log('✅ Valid releases (keeping):')
	for (const release of validReleases) {
		console.log(
			`   - ${release.version} | ${release.releaseDate?.toISOString().slice(0, 10) ?? 'no date'} | ${release._count.changes} changes`,
		)
	}
	console.log('')

	if (isDryRun) {
		console.log('🔒 DRY RUN: No changes made. Run without --dry-run to delete.')
		return
	}

	console.log('⏳ Deleting trash releases and their changes...')

	const trashReleaseIds = trashReleases.map((r) => r.id)

	const deletedChanges = await prisma.change.deleteMany({
		where: { releaseId: { in: trashReleaseIds } },
	})
	console.log(`   Deleted ${deletedChanges.count} changes`)

	const deletedReleases = await prisma.release.deleteMany({
		where: { id: { in: trashReleaseIds } },
	})
	console.log(`   Deleted ${deletedReleases.count} releases`)

	console.log('')
	console.log('✅ Cleanup complete!')
}

main()
	.catch((error) => {
		console.error('❌ Error:', error)
		process.exit(1)
	})
	.finally(() => prisma.$disconnect())
