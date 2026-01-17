# Data Model Specification

> This document specifies the TypeScript types and data structures for the compare feature.

## File Structure

```
src/data/
├── models.ts           # Canonical model definitions
└── tool-comparison.ts  # Tool-specific comparison data + editorial
```

---

## File 1: `src/data/models.ts`

Shared model definitions used across all tools.

```typescript
// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export type ModelTier = "frontier" | "standard" | "budget" | "free";

export type ModelProvider =
	| "Anthropic"
	| "OpenAI"
	| "Google"
	| "Windsurf"
	| "xAI"
	| "DeepSeek"
	| "Alibaba"
	| "Zhipu"
	| "Moonshot"
	| "Minimax"
	| "Other";

export type ModelCapability =
	| "thinking"
	| "vision"
	| "code"
	| "fast"
	| "long-context";

export interface ModelDefinition {
	id: string;
	name: string;
	provider: ModelProvider;
	tier: ModelTier;
	contextWindow?: number;
	capabilities?: ModelCapability[];
	note?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Model Registry
// ═══════════════════════════════════════════════════════════════════

export const MODELS: Record<string, ModelDefinition> = {
	// ─── Anthropic ───
	"claude-sonnet-4.5": {
		id: "claude-sonnet-4.5",
		name: "Claude Sonnet 4.5",
		provider: "Anthropic",
		tier: "standard",
		contextWindow: 200000,
	},
	"claude-sonnet-4.5-thinking": {
		id: "claude-sonnet-4.5-thinking",
		name: "Claude Sonnet 4.5 (Thinking)",
		provider: "Anthropic",
		tier: "frontier",
		contextWindow: 200000,
		capabilities: ["thinking"],
	},
	// ... more models
};

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

export function getModel(id: string): ModelDefinition | undefined {
	return MODELS[id];
}

export function getModelsByTier(tier: ModelTier): ModelDefinition[] {
	return Object.values(MODELS).filter((m) => m.tier === tier);
}

export function getModelsByProvider(provider: ModelProvider): ModelDefinition[] {
	return Object.values(MODELS).filter((m) => m.provider === provider);
}

export function getFreeModels(): ModelDefinition[] {
	return getModelsByTier("free");
}
```

---

## Architecture: 3 Layers (Built for Chaos)

Pricing across modern AI coding tools is chaotic:

- Some are token-metered (Cursor): you can do the math.
- Some are credits-per-request (Windsurf): more predictable than tokens, but not universal.
- Some are subscription quotas (Claude Code, Codex): prompts per time window, sometimes shared with another product.
- Some are intentionally vague (Antigravity): qualitative quotas, capacity-based throttles.
- Some are routers (Opencode): provider-dependent model menus.

To keep `/compare` maintainable, split the data model into three independent layers:

1. **Canonical model identity** (`src/data/models.ts`)
2. **Tool offerings + variants** (`src/data/tool-comparison.ts`): overrides/caps are not new models
3. **Metering + quotas** (`src/data/tool-comparison.ts`): how users actually get billed/throttled

**Rule**: Never convert subscription quotas to tokens. Quote vendor ranges and caveats.

---

## File 2: `src/data/tool-comparison.ts`

Tool-specific comparison data with editorial content, tool packaging, and metering/quotas.

---

## Normalization Rules (So This Doesn’t Rot)

These rules are here to keep `/compare` from turning into a pricing fanfic page.

1. **Canonical models live in exactly one place**: `src/data/models.ts`.
	- Tools reference canonical `modelId`s.
	- If a tool claims “Claude Sonnet 4.5 1M”, that is a tool-level **variant**, not a new canonical model.

2. **Do not convert units**.
	- Never convert “prompts” or “requests” to tokens.
	- Never convert credits-per-request to tokens.
	- If vendors don’t publish numbers, keep it qualitative.

3. **UI standard label = `prompts`** for quota systems.
	- Use `QuotaMetric.unitLabel = "prompts"` even if the vendor says “model requests”.
	- Preserve the vendor wording in `QuotaMetric.sourceLabel`.

4. **Unknown is allowed**.
	- If context windows / output limits / quotas are not published or are inconsistent, omit the number and add a note.

5. **Shared pools are explicit only**.
	- Use `sharedPool` only when the vendor directly states the quota is shared (Claude Code  claude.ai, Codex  ChatGPT).
	- Don’t assume Google “entitlements” share a single pool; model those via `entitlements` instead.

6. **Plans describe what users buy**.
	- The pricing plan table is for humans.
	- The metering object is for the UI + comparisons.

---

## Required Fields by Metering Type

The TS types are flexible; these rules are not.

- `token_metered`
	- Required: `noHardCap`, and at least one of:
		- `ToolPricing.models[].cost.type = "tokens"` (per-model), or
		- `ToolMetering.routingModes[]` (router pricing like Cursor Auto)
	- Optional: `routingModes`.

- `credits_per_request`
	- Required: at least one `PricingPlan` with included credits in `includedValue`.
	- Required: `ToolPricing.models[].cost.type = "credits" | "free" | "byok"`.

- `quota_subscription`
	- Required: `quotaWindows` must include *at least* one window.
	- Required: include a headline `QuotaMetric` with `metricId: "interactive_prompts"`.
	- Optional: `sharedPool`, `entitlements`.
	- If numeric limits are unknown: use `quotaLevel` + `notes`, not made-up numbers.

- `byok_passthrough`
	- Required: `supportedProviderCatalogs`.
	- Required: in `ToolPricing.byok.supported = true`.
	- Use when the tool’s cost is almost entirely “whatever your provider charges”.

- `hybrid`
	- Required: `modes` should list the concrete metering modes the user can be in.
	- Example: Gemini CLI auth method mode, with “Google login” vs “API key” vs “subscription”.

---

## Golden Examples (Copy-Paste Templates)

These are intentionally incomplete on model lists. They exist to show structure, not to enumerate the universe.

```typescript
// Cursor  token metered (+ routing modes)
const cursorMetering: ToolMetering = {
	type: "token_metered",
	unitLabel: "tokens",
	noHardCap: true,
	routingModes: [
		{
			id: "auto",
			label: "Auto",
			tokenRates: { inputPer1M: 0, outputPer1M: 0 },
			note: "Cursor sets the token rates per Auto tier; keep as data, not math.",
		},
	],
};

// Windsurf  credits per request
const windsurfMetering: ToolMetering = {
	type: "credits_per_request",
	unitLabel: "credits",
	note: "Each request costs a fixed number of credits per model.",
};

// Claude Code  quota subscription (shared pool)
const claudeCodeMetering: ToolMetering = {
	type: "quota_subscription",
	unitLabel: "prompts",
	quotaWindows: [
		{
			windowId: "5h",
			metrics: [
				{
					metricId: "interactive_prompts",
					displayLabel: "Interactive prompts per 5 hours",
					unitLabel: "prompts",
					range: { min: 10, max: 40 },
					notes: ["Actual limits vary by model + capacity."],
				},
			],
		},
	],
	sharedPool: {
		withToolSlugs: ["claude"],
		note: "Anthropic states Claude Code shares usage/limits with Claude (claude.ai).",
	},
};

// Codex  quota subscription (shared pool)
const codexMetering: ToolMetering = {
	type: "quota_subscription",
	unitLabel: "prompts",
	quotaWindows: [
		{
			windowId: "5h",
			metrics: [
				{
					metricId: "interactive_prompts",
					displayLabel: "Interactive prompts per 5 hours",
					unitLabel: "prompts",
					sourceLabel: "messages",
					quotaLevel: "unknown",
					notes: [
						"Codex limits vary by plan and capacity.",
						"Prefer ranges (min/max) only when the vendor publishes numbers.",
					],
				},
			],
		},
		{
			windowId: "week",
			metrics: [
				{
					metricId: "code_reviews",
					displayLabel: "Code reviews per week",
					unitLabel: "reviews",
					quotaLevel: "unknown",
					notes: ["Codex also has weekly caps; use published numbers when known."],
				},
			],
		},
	],
	sharedPool: {
		withToolSlugs: ["chatgpt"],
		note: "OpenAI states Codex usage shares limits with ChatGPT.",
	},
};

// Gemini CLI  hybrid (auth-method modes)
const geminiCliMetering: ToolMetering = {
	type: "hybrid",
	unitLabel: "prompts",
	modes: [
		{
			type: "quota_subscription",
			unitLabel: "prompts",
			entitlements: ["google_ai_pro"],
			quotaWindows: [
				{
					windowId: "day",
					metrics: [
						{
							metricId: "interactive_prompts",
							displayLabel: "Interactive prompts per day",
							unitLabel: "prompts",
							sourceLabel: "model requests",
							range: { min: 0, max: 0 },
							notes: ["Use published quotas per auth method."],
						},
					],
				},
			],
		},
		{
			type: "token_metered",
			unitLabel: "tokens",
			noHardCap: false,
			note: "API key + PAYG uses provider billing; include if we surface it.",
		},
	],
};

// Antigravity  quota subscription (qualitative)
const antigravityMetering: ToolMetering = {
	type: "quota_subscription",
	unitLabel: "prompts",
	quotaWindows: [
		{
			windowId: "5h",
			metrics: [
				{
					metricId: "interactive_prompts",
					displayLabel: "Interactive prompts per 5 hours",
					unitLabel: "prompts",
					quotaLevel: "generous",
					notes: ["Vendor does not publish numeric limits."],
				},
			],
		},
	],
	notes: ["Model access and quota tiers are plan-dependent."],
};
```

### Metering & Pricing Types

```typescript
// ═══════════════════════════════════════════════════════════════════
// Metering & Quotas (First-class)
// ═══════════════════════════════════════════════════════════════════

// `/compare` should always display the primary unit as "prompts".
// Preserve vendor terminology via `sourceLabel` and `notes`.

export type QuotaWindowId = "5h" | "day" | "week" | "month" | (string & {});

export type QuotaMetricId =
	| "interactive_prompts" // Primary headline metric
	| "agent_tasks"
	| "code_reviews"
	| "other";

export type QuotaLevel = "meaningful" | "generous" | "highest" | "unknown";

export interface QuotaMetric {
	metricId: QuotaMetricId;

	// UI label (we standardize the unit as prompts).
	displayLabel: string;
	unitLabel: "prompts" | "tasks" | "reviews" | (string & {});

	// Vendor wording, e.g. "model requests" (Gemini CLI) or "local messages" (Codex).
	sourceLabel?: string;

	// Numeric quotas (preferred when published)
	range?: { min: number; max: number };
	typical?: number;

	// Qualitative quotas (when vendors refuse to publish numbers)
	quotaLevel?: QuotaLevel;

	notes?: string[];
}

export interface QuotaWindow {
	windowId: QuotaWindowId;
	metrics: QuotaMetric[];
	notes?: string[];
}

export type EntitlementId =
	| "google_ai_pro"
	| "google_ai_ultra"
	| "workspace_ai_ultra_business"
	| (string & {});

// Soft modeling: an "entitlement" affects quota tiers, but does not imply shared usage.
// Example: Google AI Pro/Ultra influences multiple Google products, but we do not claim they share a single pool.

export interface SharedPool {
	// Only use when explicitly stated by the vendor.
	// Examples:
	// - Claude Code shares limits with Claude (claude.ai)
	// - Codex shares limits with ChatGPT
	withToolSlugs: string[];
	note?: string;
}

export type ToolMetering =
	| {
			type: "token_metered";
			unitLabel: "tokens";
			noHardCap: boolean;
			routingModes?: {
				id: string;
				label: string;
				// Token rates for routing modes (e.g. Cursor Auto)
				tokenRates: {
					inputPer1M: number;
					outputPer1M: number;
					cacheReadPer1M?: number;
					cacheWritePer1M?: number;
				};
				note?: string;
			}[];
		}
	| {
			type: "credits_per_request";
			unitLabel: "credits";
			note?: string;
		}
	| {
			type: "quota_subscription";
			unitLabel: "prompts";
			quotaWindows: QuotaWindow[];
			sharedPool?: SharedPool;
			entitlements?: EntitlementId[];
			notes?: string[];
		}
	| {
			type: "byok_passthrough";
			unitLabel: "prompts";
			supportedProviderCatalogs: ProviderCatalog[];
			notes?: string[];
		}
	| {
			type: "hybrid";
			unitLabel: "prompts";
			modes: ToolMetering[];
			notes?: string[];
		};

export interface PricingMechanism {
	// Keep the existing human-readable description for UI copy.
	description: string;
}

// ═══════════════════════════════════════════════════════════════════
// Model Cost Types
// ═══════════════════════════════════════════════════════════════════

export type ModelCost =
	| { type: "free" }
	| { type: "credits"; amount: number; note?: string }
	| {
			type: "tokens";
			inputPer1M: number;
			outputPer1M: number;
			cachePer1M?: number;
	  }
	| { type: "included"; note: string }
	| { type: "byok"; note?: string }
	| { type: "requests"; perDay: number; perMonth?: number };

export interface ToolModelVariant {
	id: string; // "default" | "max" | tool-specific
	label: string;
	limits?: {
		contextWindow?: number;
		maxOutputTokens?: number;
	};
	note?: string;
}

export interface ModelAvailability {
	modelId: string;
	cost: ModelCost;
	availability: {
		free?: boolean | "byok";
		pro?: boolean | "byok";
		teams?: boolean | "byok";
		enterprise?: boolean | "byok";
	};

	// Some tools expose variants of the same underlying model.
	// Example: Cursor "Max Mode" is a higher context limit, not a new model.
	variants?: ToolModelVariant[];

	note?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Plan Types
// ═══════════════════════════════════════════════════════════════════

export interface PricingPlan {
	id: string;
	name: string;
	monthlyPrice: number;
	yearlyPrice?: number;
	includedValue?: string; // "$20 of tokens" | "500 credits" | "~10-40 prompts/5h"
	features: string[];
	targetUser?: string;
	isRecommended?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Complete Pricing Structure
// ═══════════════════════════════════════════════════════════════════

export interface ToolPricing {
	metering: ToolMetering;
	mechanism: PricingMechanism;
	plans: PricingPlan[];
	models: ModelAvailability[];

	// Highlighted free options
	freeModels?: {
		count: number;
		highlights: string[];
		note: string;
	};

	// BYOK support
	byok?: {
		supported: boolean;
		providers: string[];
		note?: string;
	};

	// Real-world cost estimates by persona
	realCosts: {
		light: { range: string; note: string };
		daily: { range: string; note: string };
		power: { range: string; note: string };
	};

	// Free trial info
	freeTrial?: {
		days: number;
		credits?: number;
		features?: string;
	};
}
```

### Capability Types

```typescript
// ═══════════════════════════════════════════════════════════════════
// Agent Capabilities
// ═══════════════════════════════════════════════════════════════════

export interface AgentCapabilities {
	fileEdit: boolean;
	terminal: boolean;
	browser: boolean;
	mcp: boolean;
	backgroundAgents: boolean;
	codebaseSearch: boolean;
}

export interface PrivacyFeatures {
	localMode: boolean;
	noTrainingOnCode: boolean;
	soc2?: boolean;
	dataRetention?: string;
}

export type Platform = "windows" | "macos" | "linux" | "web";

export type IDEIntegration =
	| "vscode"
	| "jetbrains"
	| "vim"
	| "neovim"
	| "terminal"
	| "native-app";
```

### Tool Comparison Type

```typescript
// ═══════════════════════════════════════════════════════════════════
// Complete Tool Comparison
// ═══════════════════════════════════════════════════════════════════

export type ToolArchetype = "bundle" | "router";

export type ProviderCatalog =
	| "anthropic"
	| "openai"
	| "google"
	| "xai"
	| "deepseek"
	| "alibaba"
	| "github-copilot"
	| "other";

export interface ToolComparison {
	slug: string;

	// Router/client tools (e.g. Opencode) can connect to multiple providers.
	// Bundle tools (e.g. Cursor) usually have a fixed curated menu.
	archetype?: ToolArchetype;
	providerCatalogs?: ProviderCatalog[];

	// ─── Editorial (the personality) ───
	tagline: string;
	bestFor: string;
	worthIt: string;
	pros: string[];
	cons: string[];

	categoryNotes: {
		models?: string;
		pricing?: string;
		agents?: string;
		velocity?: string;
	};

	// ─── Structured Data ───
	capabilities: AgentCapabilities;
	platforms: Platform[];
	ideIntegrations: IDEIntegration[];
	privacy: PrivacyFeatures;
	pricing: ToolPricing;

	// ─── Metadata ───
	lastUpdated: string; // ISO date
}
```

### Global Editorial

```typescript
// ═══════════════════════════════════════════════════════════════════
// Global Editorial Content
// ═══════════════════════════════════════════════════════════════════

export interface PersonaVerdict {
	winner: string;
	reason: string;
}

export interface ComparisonEditorial {
	// Section introductions
	sections: {
		hero: string;
		models: string;
		pricing: string;
		agents: string;
		velocity: string;
		verdict: string;
	};

	// Persona-based recommendations
	verdicts: {
		soloDev: PersonaVerdict;
		team: PersonaVerdict;
		enterprise: PersonaVerdict;
		budget: PersonaVerdict;
		terminal: PersonaVerdict;
		ide: PersonaVerdict;
		privacy: PersonaVerdict;
	};

	// Category winners (computed based on selected tools)
	categoryWinnerReasons: {
		[category: string]: {
			[toolSlug: string]: string;
		};
	};
}
```

### Helper Functions

```typescript
// ═══════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════

export function getToolComparison(slug: string): ToolComparison | undefined {
	return toolComparisons.find((t) => t.slug === slug);
}

export function getToolComparisons(slugs: string[]): ToolComparison[] {
	return slugs
		.map((slug) => getToolComparison(slug))
		.filter((t): t is ToolComparison => t !== undefined);
}

export function getAllToolSlugs(): string[] {
	return toolComparisons.map((t) => t.slug);
}

export function getToolsWithFreeModels(): ToolComparison[] {
	return toolComparisons.filter(
		(t) => t.pricing.freeModels && t.pricing.freeModels.count > 0
	);
}
```

---

## Data Validation

When adding or updating tool data, ensure:

### Required Fields

- [ ] `slug` matches database Tool.slug
- [ ] `tagline` is ≤5 words
- [ ] `bestFor` describes target user
- [ ] `worthIt` gives pricing verdict
- [ ] `pros` has 2-4 items
- [ ] `cons` has 2-4 items
- [ ] `lastUpdated` is current ISO date

### Pricing Accuracy

- [ ] Plan prices verified against official source
- [ ] Model costs verified (credits/tokens)
- [ ] Free models accurately identified
- [ ] BYOK options correctly noted
- [ ] `realCosts` estimates are realistic

### Editorial Quality

- [ ] Voice is consistent (snarky dev)
- [ ] Opinions are defensible
- [ ] No marketing language
- [ ] Honest about limitations

---

## Example: Windsurf Entry

```typescript
{
  slug: 'windsurf',
  tagline: 'The free lunch',
  bestFor: 'Budget-conscious devs who want premium capabilities',
  worthIt: 'If budget is your concern, start here. SWE-1.5 is free and actually good.',

  pros: [
    'Free models that work - SWE-1.5, DeepSeek-R1, Grok Code Fast',
    'Predictable pricing - credits per prompt, not tokens',
    'Aggressive pricing - Pro at $15/mo is cheapest in market',
  ],

  cons: [
    'Newer, less mature than Cursor',
    'Cognition\'s track record (Devin)',
    'Claude Opus at 20 credits/prompt burns fast',
  ],

  categoryNotes: {
    models: 'SWE-1.5 is the sleeper hit. Free, fast, genuinely good.',
    pricing: 'Free model strategy is brilliant. Use SWE-1.5 for most work.',
  },

  pricing: {
    mechanism: {
      type: 'credits',
      description: 'Fixed credits per prompt. Conversation length doesn\'t matter.',
      unit: 'credits per prompt',
    },
    plans: [
      { id: 'free', name: 'Free', monthlyPrice: 0, includedValue: '25 credits' },
      { id: 'pro', name: 'Pro', monthlyPrice: 15, includedValue: '500 credits', isRecommended: true },
      { id: 'teams', name: 'Teams', monthlyPrice: 30, includedValue: '500/user' },
      { id: 'enterprise', name: 'Enterprise', monthlyPrice: 60, includedValue: '1000/user' },
    ],
    freeModels: {
      count: 7,
      highlights: ['SWE-1.5', 'DeepSeek-R1', 'Grok Code Fast', 'GPT-5.1-Codex'],
      note: 'SWE-1.5 is near Claude 4.5-level. Actually usable for production.',
    },
    realCosts: {
      light: { range: '$0-15', note: 'Free models or within included credits' },
      daily: { range: '$15-55', note: 'Pro plan + add-on credits' },
      power: { range: '$55-150+', note: 'Heavy premium model usage' },
    },
  },

  capabilities: {
    fileEdit: true,
    terminal: true,
    browser: false,
    mcp: true,
    backgroundAgents: false,
    codebaseSearch: true,
  },

  platforms: ['windows', 'macos', 'linux'],
  ideIntegrations: ['native-app', 'jetbrains'],

  privacy: {
    localMode: false,
    noTrainingOnCode: true,
  },

  lastUpdated: '2026-01-16',
}
```
