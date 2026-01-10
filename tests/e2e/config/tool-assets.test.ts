import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TOOL_REGISTRY, TOOL_SLUGS } from "@/lib/tool-registry";

const srcDir = path.resolve(__dirname, "../../../src");
const publicDir = path.resolve(__dirname, "../../../public");

/**
 * Maps tool slugs to their logo component filenames.
 * Not all tools have a 1:1 mapping with their slug.
 */
const LOGO_COMPONENT_MAP: Record<string, string> = {
  "claude-code": "claude.tsx",
  codex: "openai.tsx",
  cursor: "cursor.tsx",
  windsurf: "windsurf.tsx",
  opencode: "opencode.tsx",
  antigravity: "antigravity.tsx",
};

const toolSlugs = TOOL_SLUGS;

describe("Tool Assets Configuration", () => {
  describe("Logo Components", () => {
    it.each(toolSlugs)("tool '%s' has a logo component file", (slug) => {
      const logoFile = LOGO_COMPONENT_MAP[slug];
      expect(logoFile).toBeDefined();

      const logoPath = path.join(srcDir, "components/logo", logoFile);
      expect(
        fs.existsSync(logoPath),
        `Logo component not found: ${logoPath}`,
      ).toBe(true);
    });

    it("all tools have a logo component mapping", () => {
      for (const slug of toolSlugs) {
        expect(
          LOGO_COMPONENT_MAP[slug],
          `Missing logo component mapping for tool: ${slug}`,
        ).toBeDefined();
      }
    });
  });

  describe("Background Images", () => {
    it.each(toolSlugs)(
      "tool '%s' has a background image in public/images/tools/",
      (slug) => {
        const imagePath = path.join(publicDir, "images/tools", `${slug}.png`);
        expect(
          fs.existsSync(imagePath),
          `Background image not found: ${imagePath}`,
        ).toBe(true);
      },
    );
  });

  describe("No Orphaned Background Images", () => {
    it("all images in public/images/tools/ correspond to a registered tool", () => {
      const imagesDir = path.join(publicDir, "images/tools");
      const imageFiles = fs
        .readdirSync(imagesDir)
        .filter((file) => file.endsWith(".png"));

      const orphanedImages: string[] = [];

      for (const imageFile of imageFiles) {
        const slug = imageFile.replace(".png", "");
        if (!toolSlugs.includes(slug)) {
          orphanedImages.push(imageFile);
        }
      }

      expect(
        orphanedImages,
        `Orphaned images found (no matching tool in registry): ${orphanedImages.join(", ")}`,
      ).toHaveLength(0);
    });
  });

  describe("OG Image SVGs", () => {
    it.each(toolSlugs)(
      "tool '%s' has a case in getToolLogoSVG() switch statement",
      (slug) => {
        const ogUtilsPath = path.join(srcDir, "lib/og-utils.tsx");
        const ogUtilsContent = fs.readFileSync(ogUtilsPath, "utf-8");

        // Check for the case statement pattern for this tool
        const casePattern = new RegExp(`case\\s+["']${slug}["']\\s*:`);
        expect(
          casePattern.test(ogUtilsContent),
          `Missing case for '${slug}' in getToolLogoSVG() switch statement in og-utils.tsx`,
        ).toBe(true);
      },
    );
  });

  describe("Ingestion Pipelines", () => {
    it.each(toolSlugs)(
      "tool '%s' has an ingestion pipeline directory with index.ts",
      (slug) => {
        const pipelineDir = path.join(srcDir, "trigger/ingest", slug);
        const indexPath = path.join(pipelineDir, "index.ts");

        expect(
          fs.existsSync(pipelineDir),
          `Ingestion pipeline directory not found: ${pipelineDir}`,
        ).toBe(true);

        expect(
          fs.existsSync(indexPath),
          `Ingestion pipeline index.ts not found: ${indexPath}`,
        ).toBe(true);
      },
    );
  });

  describe("Registry Completeness", () => {
    it("has the expected number of tools registered", () => {
      // Update this count when adding new tools
      expect(toolSlugs.length).toBeGreaterThanOrEqual(6);
    });

    it("all registered tools have required properties", () => {
      for (const tool of TOOL_REGISTRY) {
        expect(tool.name, `Tool '${tool.slug}' missing name`).toBeDefined();
        expect(tool.slug, `Tool '${tool.slug}' missing slug`).toBeDefined();
      }
    });
  });
});
