import { logger } from '@trigger.dev/sdk'
import { enrichReleaseWithLLM } from '@/lib/enrichment/llm'
import type { ParsedRelease } from '@/lib/parsers/changelog-md'
import type { EnrichResult, FilterResult, IngestionContext } from '../types'

export async function enrichStep(
	ctx: IngestionContext,
	filterResult: FilterResult,
): Promise<EnrichResult> {
	logger.info('Phase 5: Enrich Windsurf releases with LLM', {
		totalReleases: filterResult.releases.length,
	})

	if (filterResult.releases.length === 0) {
		return { enrichedReleases: [] }
	}

	const fallbackContext = buildFallbackMap(filterResult.releases)

	const enrichedReleases = await Promise.all(
		filterResult.releases.map(async (release) => {
			const previousRelease =
				(await findPreviousRelease(ctx, release)) ??
				buildParsedReleaseContext(fallbackContext.get(release.version))

			const enriched = await enrichReleaseWithLLM(release, {
				previousRelease: previousRelease ?? undefined,
				telemetry: {
					toolSlug: ctx.toolSlug,
					runId: ctx.fetchLog.id,
					source: `trigger.enrich.${ctx.toolSlug}`,
				},
			})
			logger.debug('Release enriched', {
				version: enriched.version,
				changes: enriched.changes.length,
			})
			return enriched
		}),
	)

	return {
		enrichedReleases,
	}
}

type PreviousReleaseSummary = {
	version: string
	headline?: string | null
	summary?: string | null
}

function buildFallbackMap(
	releases: ParsedRelease[],
): Map<string, ParsedRelease | undefined> {
	const sorted = [...releases].sort((a, b) =>
		a.versionSort.localeCompare(b.versionSort),
	)
	const map = new Map<string, ParsedRelease | undefined>()

	for (let i = 1; i < sorted.length; i++) {
		map.set(sorted[i].version, sorted[i - 1])
	}

	return map
}

async function findPreviousRelease(
	ctx: IngestionContext,
	release: ParsedRelease,
): Promise<PreviousReleaseSummary | undefined> {
	const previous = await ctx.prisma.release.findFirst({
		where: {
			toolId: ctx.tool.id,
			versionSort: { lt: release.versionSort },
		},
		orderBy: { versionSort: 'desc' },
	})

	if (!previous) {
		return undefined
	}

	return {
		version: previous.version,
		headline: previous.headline ?? null,
		summary: previous.summary,
	}
}

function buildParsedReleaseContext(
	release?: ParsedRelease,
): PreviousReleaseSummary | undefined {
	if (!release) return undefined
	return {
		version: release.version,
		headline: release.headline,
		summary: release.summary,
	}
}
