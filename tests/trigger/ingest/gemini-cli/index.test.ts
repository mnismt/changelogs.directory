import { beforeEach, describe, expect, it, vi } from "vitest"
import {
	createMockFetchLog,
	createMockParsedRelease,
	createMockRelease,
	createMockTool,
} from "tests/helpers/fixtures"
import { createMockPrisma } from "tests/helpers/prisma-mock"
import type { SourceType } from "@/generated/prisma/client"

vi.mock("@trigger.dev/sdk", () => ({
	logger: {
		info: vi.fn(),
		debug: vi.fn(),
		error: vi.fn(),
	},
	task: vi.fn((config) => config),
	schedules: {
		task: vi.fn((config) => config),
	},
}))

vi.mock("@prisma/adapter-pg", () => ({
	PrismaPg: vi.fn(() => ({})),
}))

const mockPrismaInstance = createMockPrisma()

vi.mock("@/generated/prisma/client", () => {
	const MockPrismaClient = vi.fn(() => mockPrismaInstance)
	return {
		PrismaClient: MockPrismaClient,
	}
})

vi.mock("@/trigger/ingest/gemini-cli/steps/fetch", () => ({
	fetchStep: vi.fn().mockResolvedValue({ releases: [] }),
}))

const mockParsedRelease = createMockParsedRelease({
	version: "1.0.0",
	versionSort: "0001.0000.0000.0000",
	contentHash: "same-hash",
})

vi.mock("@/trigger/ingest/gemini-cli/steps/parse", () => ({
	parseStep: vi.fn(() => ({ releases: [mockParsedRelease] })),
}))

vi.mock("@/trigger/shared/steps/enrich", () => ({
	enrichStep: vi.fn((_ctx, filterResult) => ({
		enrichedReleases: filterResult.releases,
	})),
}))

describe("ingestGeminiCli", () => {
	let mockTool: ReturnType<typeof createMockTool>
	let mockFetchLog: ReturnType<typeof createMockFetchLog>
	let mockRelease: ReturnType<typeof createMockRelease>

	beforeEach(() => {
		vi.clearAllMocks()

		mockTool = createMockTool({
			slug: "gemini-cli",
			name: "Gemini CLI",
			repositoryUrl: "https://github.com/octo/repo",
			sourceType: "GITHUB_RELEASES" as SourceType,
			sourceUrl: "https://api.github.com/repos/octo/repo/releases",
			sourceConfig: {
				versionPrefix: "v",
				includePreReleases: true,
			},
		})

		mockFetchLog = createMockFetchLog({
			toolId: mockTool.id,
			sourceUrl: mockTool.sourceUrl,
		})

		mockRelease = createMockRelease({
			toolId: mockTool.id,
			version: mockParsedRelease.version,
			contentHash: mockParsedRelease.contentHash,
		})

		mockPrismaInstance.tool.findUnique = vi.fn().mockResolvedValue(mockTool as any)
		mockPrismaInstance.fetchLog.create = vi.fn().mockResolvedValue(mockFetchLog as any)
		mockPrismaInstance.fetchLog.update = vi.fn().mockResolvedValue(mockFetchLog as any)
		mockPrismaInstance.tool.update = vi.fn().mockResolvedValue(mockTool as any)
		mockPrismaInstance.release.findMany = vi.fn().mockResolvedValue([mockRelease as any])
		mockPrismaInstance.release.findUnique = vi.fn().mockResolvedValue(mockRelease as any)
		mockPrismaInstance.release.update = vi.fn().mockResolvedValue(mockRelease as any)
		mockPrismaInstance.change.deleteMany = vi.fn().mockResolvedValue({ count: 0 })
		mockPrismaInstance.fetchLog.findFirst = vi.fn().mockResolvedValue({
			...mockFetchLog,
			tool: mockTool,
		} as any)
	})

	it("forces full rescan to reprocess unchanged releases", async () => {
		const { ingestGeminiCli } = await import("@/trigger/ingest/gemini-cli")

		const result = await ingestGeminiCli.run({
			toolSlug: "gemini-cli",
			forceFullRescan: true,
		})

		expect(result.success).toBe(true)
		expect(result.releasesSkipped).toBe(0)
		expect(result.releasesUpdated).toBe(1)
		expect(mockPrismaInstance.release.findMany).not.toHaveBeenCalled()
		expect(mockPrismaInstance.release.update).toHaveBeenCalledOnce()
	})
})
