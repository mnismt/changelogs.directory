import { describe, expect, it } from "vitest";
import { TOOL_REGISTRY } from "@/lib/tool-registry";

describe("Logo Showcase Sync", () => {
	it("should have all registry tools enabled for showcase", () => {
		const nonShowcasedTools = TOOL_REGISTRY.filter((t) => !t.showInShowcase);
		
		expect(
			nonShowcasedTools, 
			`The following tools are missing from the showcase: ${nonShowcasedTools.map(t => t.slug).join(", ")}`
		).toHaveLength(0);
	});

	it("should have all registry tools enabled for feed filter", () => {
		// Since we are checking showcase, might as well check feed filter consistency if that's a requirement.
		// The prompt specifically asked for "show full tools", implying showcase.
		// I'll stick to showcase primarily but this is a good safety check too.
		const nonFilterTools = TOOL_REGISTRY.filter((t) => !t.showInFeedFilter);
		
		expect(
			nonFilterTools,
			`The following tools are missing from feed filters: ${nonFilterTools.map(t => t.slug).join(", ")}`
		).toHaveLength(0);
	});
});
