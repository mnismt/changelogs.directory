// Types imported for documentation purposes - actual model data lives in models.ts

// ═══════════════════════════════════════════════════════════════════
// Metering & Pricing Types
// ═══════════════════════════════════════════════════════════════════

export type QuotaWindowId = '5h' | 'day' | 'week' | 'month' | (string & {})

export type QuotaMetricId =
	| 'interactive_prompts' // Primary headline metric
	| 'agent_tasks'
	| 'code_reviews'
	| 'other'

export type QuotaLevel = 'meaningful' | 'generous' | 'highest' | 'unknown'

export interface QuotaMetric {
	metricId: QuotaMetricId
	displayLabel: string
	unitLabel: 'prompts' | 'tasks' | 'reviews' | (string & {})
	sourceLabel?: string
	range?: { min: number; max: number }
	typical?: number
	quotaLevel?: QuotaLevel
	notes?: string[]
}

export interface QuotaWindow {
	windowId: QuotaWindowId
	metrics: QuotaMetric[]
	notes?: string[]
}

export type EntitlementId =
	| 'google_ai_pro'
	| 'google_ai_ultra'
	| 'workspace_ai_ultra_business'
	| (string & {})

export interface SharedPool {
	withToolSlugs: string[]
	note?: string
}

export type ToolMetering =
	| {
			type: 'token_metered'
			unitLabel: 'tokens'
			noHardCap: boolean
			routingModes?: {
				id: string
				label: string
				tokenRates: {
					inputPer1M: number
					outputPer1M: number
					cacheReadPer1M?: number
					cacheWritePer1M?: number
				}
				note?: string
			}[]
	  }
	| {
			type: 'credits_per_request'
			unitLabel: 'credits'
			note?: string
	  }
	| {
			type: 'quota_subscription'
			unitLabel: 'prompts'
			quotaWindows: QuotaWindow[]
			sharedPool?: SharedPool
			entitlements?: EntitlementId[]
			notes?: string[]
	  }
	| {
			type: 'byok_passthrough'
			unitLabel: 'prompts'
			supportedProviderCatalogs: ProviderCatalog[]
			notes?: string[]
	  }
	| {
			type: 'hybrid'
			unitLabel: 'prompts'
			modes: ToolMetering[]
			notes?: string[]
	  }

export interface PricingMechanism {
	description: string
}

// ═══════════════════════════════════════════════════════════════════
// Model Cost & Availability
// ═══════════════════════════════════════════════════════════════════

export type ModelCost =
	| { type: 'free' }
	| { type: 'credits'; amount: number; note?: string }
	| {
			type: 'tokens'
			inputPer1M: number
			outputPer1M: number
			cachePer1M?: number
	  }
	| { type: 'included'; note: string }
	| { type: 'byok'; note?: string }
	| { type: 'requests'; perDay: number; perMonth?: number }

export interface ToolModelVariant {
	id: string
	label: string
	limits?: {
		contextWindow?: number
		maxOutputTokens?: number
	}
	note?: string
}

export interface ModelAvailability {
	modelId: string
	cost: ModelCost
	availability: {
		free?: boolean | 'byok'
		pro?: boolean | 'byok'
		teams?: boolean | 'byok'
		enterprise?: boolean | 'byok'
	}
	variants?: ToolModelVariant[]
	note?: string
}

// ═══════════════════════════════════════════════════════════════════
// Plans & Tool Structure
// ═══════════════════════════════════════════════════════════════════

export interface PricingPlan {
	id: string
	name: string
	monthlyPrice: number | 'custom'
	yearlyPrice?: number
	includedValue?: string
	features: string[]
	targetUser?: string
	isRecommended?: boolean
}

export interface ToolPricing {
	metering: ToolMetering
	mechanism: PricingMechanism
	plans: PricingPlan[]
	models: ModelAvailability[]
	freeModels?: {
		count: number
		highlights: string[]
		note: string
	}
	byok?: {
		supported: boolean
		providers: string[]
		note?: string
	}
	realCosts: {
		light: { range: string; note: string }
		daily: { range: string; note: string }
		power: { range: string; note: string }
	}
	freeTrial?: {
		days: number
		credits?: number
		features?: string
	}
}

export interface AgentCapabilities {
	fileEdit: boolean
	terminal: 'local' | 'cloud' | 'hybrid' | 'none'
	browser: 'control' | 'mcp' | 'view-only' | 'none'
	mcp: 'native' | 'limited' | 'none'
	cloudAgents: 'cloud' | 'preview' | 'none'
	codebaseSearch: 'native-rag' | 'agentic' | 'none'
}

export interface PrivacyFeatures {
	localMode: boolean
	noTrainingOnCode: boolean
	soc2?: boolean
	dataRetention?: string
}

export type Platform = 'windows' | 'macos' | 'linux' | 'web'

export type IDEIntegration =
	| 'vscode'
	| 'jetbrains'
	| 'vim'
	| 'neovim'
	| 'terminal'
	| 'native-app'

export type ToolArchetype = 'bundle' | 'router'

export type ProviderCatalog =
	| 'anthropic'
	| 'openai'
	| 'google'
	| 'xai'
	| 'deepseek'
	| 'alibaba'
	| 'github-copilot'
	| 'other'

export interface ToolComparison {
	slug: string
	archetype?: ToolArchetype
	providerCatalogs?: ProviderCatalog[]
	tagline: string
	bestFor: string
	worthIt: string
	pros: string[]
	cons: string[]
	categoryNotes: {
		models?: string
		pricing?: string
		agents?: string
		velocity?: string
	}
	capabilities: AgentCapabilities
	capabilityDetails?: {
		[K in keyof AgentCapabilities]?: string
	}
	platforms: Platform[]
	ideIntegrations: IDEIntegration[]
	privacy: PrivacyFeatures
	pricing: ToolPricing
	lastUpdated: string
	sources?: {
		pricing: string
		docs: string
	}
}

// ═══════════════════════════════════════════════════════════════════
// DATA IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════

export const toolComparisons: ToolComparison[] = [
	{
		slug: 'cursor',
		tagline: 'The polished one',
		bestFor: 'IDE lovers who want everything integrated',
		worthIt:
			"Yes, if you code 4+ hours/day. Tab completion alone saves 30min daily. At $20/mo, that's a no-brainer. But that $20 is just the starting point - daily agent users should budget $60-100/mo.",
		pros: [
			'Tab completion is addictive - Feels like it reads your mind.',
			"Background agents - Queue up work while you're in meetings.",
			'Polished UX - It just works. No config rabbit holes.',
		],
		cons: [
			'Another Electron app - RAM usage is... noticeable.',
			"Token burn adds up - The '$20/mo' headline is misleading for heavy users.",
			'Locked in - No terminal-only mode.',
		],
		categoryNotes: {
			models:
				'Access to all frontier models (Claude 4.5, GPT-5.2), but Claude Sonnet 4.5 is the default for a reason.',
			pricing:
				'The $20 → $60 jump is rough. Most devs are fine on Pro, but daily agent users need Pro+.',
			agents:
				'Background agents are the killer feature - set it and forget it.',
		},
		capabilities: {
			fileEdit: true,
			terminal: 'hybrid', // Local + SSH Remote
			browser: 'control', // Native browser agent
			mcp: 'native',
			cloudAgents: 'cloud',
			codebaseSearch: 'native-rag',
		},
		capabilityDetails: {
			codebaseSearch:
				'Native implementation. Chunks code locally using Tree-sitter (AST-aware) and syncs to a remote Turbopuffer vector DB. Embeddings are fine-tuned on user traces.',
			cloudAgents:
				'Runs in AWS containers. Can execute terminal commands and edit files asynchronously while you continue working in the IDE.',
			mcp: 'Full support for Model Context Protocol servers to connect external data and tools.',
		},
		platforms: ['windows', 'macos', 'linux'],
		ideIntegrations: ['native-app'],
		privacy: {
			localMode: false,
			noTrainingOnCode: true,
			soc2: true,
		},
		pricing: {
			metering: {
				type: 'token_metered',
				unitLabel: 'tokens',
				noHardCap: true,
				routingModes: [
					{
						id: 'auto',
						label: 'Auto',
						tokenRates: { inputPer1M: 1.25, outputPer1M: 6.0 },
						note: 'Cursor routing picks the best model (usually Sonnet/GPT-5).',
					},
				],
			},
			mechanism: {
				description:
					'Pay for every token. Pro includes $20 of usage. Usage beyond that is billed at cost.',
			},
			plans: [
				{
					id: 'hobby',
					name: 'Hobby',
					monthlyPrice: 0,
					includedValue: 'Limited',
					features: ['Basic completion', 'Community support'],
				},
				{
					id: 'pro',
					name: 'Pro',
					monthlyPrice: 20,
					includedValue: '$20 of tokens',
					features: ['Unlimited completions', 'Fast premium models'],
					isRecommended: true,
				},
				{
					id: 'pro_plus',
					name: 'Pro+',
					monthlyPrice: 60,
					includedValue: '$60 of tokens',
					features: ['Priority support', 'More fast usage'],
				},
				{
					id: 'ultra',
					name: 'Ultra',
					monthlyPrice: 200,
					includedValue: '$200 of tokens',
					features: ['Maximum velocity', 'Priority support'],
				},
				{
					id: 'teams',
					name: 'Teams',
					monthlyPrice: 40,
					features: [
						'Shared billing',
						'Admin dashboard',
						'Privacy mode enforcement',
					],
				},
			],
			models: [
				{
					modelId: 'claude-sonnet-4-5',
					cost: {
						type: 'tokens',
						inputPer1M: 3,
						outputPer1M: 15,
						cachePer1M: 0.3,
					},
					availability: { pro: true },
					variants: [
						{ id: 'default', label: 'Default' },
						{ id: 'max', label: 'Max Mode (1M Context)', note: 'Higher cost' },
					],
				},
				{
					modelId: 'claude-opus-4-5',
					cost: {
						type: 'tokens',
						inputPer1M: 5,
						outputPer1M: 25,
					},
					availability: { pro: true },
				},
				{
					modelId: 'gpt-5-2',
					cost: { type: 'tokens', inputPer1M: 1.75, outputPer1M: 14 },
					availability: { pro: true },
				},
				{
					modelId: 'gemini-3-pro',
					cost: { type: 'tokens', inputPer1M: 2, outputPer1M: 12 },
					availability: { pro: true },
				},
			],
			freeModels: {
				count: 1,
				highlights: ['cursor-small', 'claude-haiku-4-5'],
				note: 'Limited free usage of premium models (2 weeks trial).',
			},
			realCosts: {
				light: { range: '$0-20', note: 'Hobby or basic Pro usage' },
				daily: {
					range: '$60-100',
					note: 'Daily agent usage usually exceeds Pro',
				},
				power: {
					range: '$200+',
					note: 'Heavy automation consumes credits fast',
				},
			},
			freeTrial: {
				days: 14,
				features: 'Pro features',
			},
		},
		lastUpdated: '2026-01-24',
		sources: {
			pricing: 'https://cursor.com/pricing',
			docs: 'https://cursor.com/docs',
		},
	},
	{
		slug: 'codex',
		tagline: 'The ChatGPT tax',
		bestFor:
			'People already paying for ChatGPT who want agent tasks + code reviews',
		worthIt:
			"If you already have ChatGPT Pro, Codex is basically free power. If you're on Plus, you'll feel the ceiling fast.",
		pros: [
			'Cloud tasks - The right abstraction for longer-running agent work.',
			'Code reviews - A distinct quota bucket makes reviews feel safe.',
			'Works with ChatGPT ecosystem - Same account, familiar UX.',
		],
		cons: [
			'Shared quota with ChatGPT - Your chat usage competes with your coding usage.',
			"Limits are ranges - You won't know the real cap until you hit it.",
			'Not token-transparent - Hard to predict throughput.',
		],
		categoryNotes: {
			pricing:
				'Subscription-shaped, quota-behaved. Ranges, time windows, shared pool.',
			agents: "Cloud tasks are great for long jobs, but they're quota-gated.",
			models:
				'GPT-5.2 Codex is highly capable, but 5.1 Codex Mini is the workhorse.',
		},
		capabilities: {
			fileEdit: true,
			terminal: 'hybrid', // CLI (local) + Cloud Tasks (cloud)
			browser: 'mcp', // via MCP/Plugins
			mcp: 'native',
			cloudAgents: 'cloud', // "Cloud tasks"
			codebaseSearch: 'agentic',
		},
		capabilityDetails: {
			codebaseSearch:
				'Agentic traversal. Uses iterative grep/glob/read tools to explore code. No persistent vector index by default.',
			cloudAgents:
				'Cloud tasks run in isolated sandboxes. Good for long-running scripts but constrained by quota ranges.',
			browser:
				'Via MCP plugins (e.g. Puppeteer). Not a native "Computer Use" vision model capability.',
		},
		platforms: ['web', 'windows', 'macos', 'linux'], // CLI available
		ideIntegrations: ['vscode', 'jetbrains'], // "Work with Apps"
		privacy: {
			localMode: false,
			noTrainingOnCode: false, // Default is opt-out for Team/Ent
		},
		pricing: {
			metering: {
				type: 'quota_subscription',
				unitLabel: 'prompts',
				sharedPool: {
					withToolSlugs: ['chatgpt'],
					note: 'OpenAI states Codex usage shares limits with ChatGPT.',
				},
				quotaWindows: [
					{
						windowId: '5h',
						metrics: [
							{
								metricId: 'interactive_prompts',
								displayLabel: 'Interactive prompts per 5 hours',
								unitLabel: 'prompts',
								sourceLabel: 'messages',
								range: { min: 45, max: 225 }, // Plus plan baseline
								notes: ['Varies by plan and task complexity.'],
							},
							{
								metricId: 'agent_tasks',
								displayLabel: 'Agent tasks per 5 hours',
								unitLabel: 'tasks',
								range: { min: 10, max: 60 }, // Plus plan
								notes: ['Cloud tasks use separate but related quota.'],
							},
						],
					},
					{
						windowId: 'week',
						metrics: [
							{
								metricId: 'code_reviews',
								displayLabel: 'Code reviews per week',
								unitLabel: 'reviews',
								range: { min: 10, max: 25 },
								notes: ['Distinct quota from prompts.'],
							},
						],
					},
				],
			},
			mechanism: {
				description:
					'Included in ChatGPT subscription. Usage limits are shared with ChatGPT.',
			},
			plans: [
				{
					id: 'plus',
					name: 'ChatGPT Plus',
					monthlyPrice: 20,
					features: ['Standard Codex limits'],
				},
				{
					id: 'pro',
					name: 'ChatGPT Pro',
					monthlyPrice: 200,
					features: ['Higher limits', 'More cloud tasks', 'GPT-5.2 Codex'],
				},
				{
					id: 'business',
					name: 'ChatGPT Business',
					monthlyPrice: 30, // Per user
					features: ['Team management', 'Standard limits'],
				},
				{
					id: 'enterprise',
					name: 'Enterprise',
					monthlyPrice: 'custom',
					features: ['Unlimited (flexible)', 'SSO', 'Compliance'],
				},
			],
			models: [
				{
					modelId: 'gpt-5-1-codex',
					cost: { type: 'included', note: 'Within quota' },
					availability: { pro: true, free: false },
				},
				{
					modelId: 'gpt-5-2-codex',
					cost: { type: 'included', note: 'Within quota (stricter)' },
					availability: { pro: true, free: false },
				},
				{
					modelId: 'gpt-5-1-codex-mini',
					cost: { type: 'included', note: 'Within quota' },
					availability: { pro: true, free: true },
				},
			],
			realCosts: {
				light: { range: '$20', note: 'ChatGPT Plus' },
				daily: {
					range: '$100-200',
					note: 'Heavy users need Pro ($200) to avoid caps',
				},
				power: {
					range: '$200',
					note: 'ChatGPT Pro required for heavy agent usage',
				},
			},
		},
		lastUpdated: '2026-01-24',
		sources: {
			pricing: 'https://developers.openai.com/codex/pricing/',
			docs: 'https://developers.openai.com/codex/docs',
		},
	},
	{
		slug: 'claude-code',
		tagline: 'The raw power',
		bestFor: "Terminal hackers who want Claude's brain without the IDE wrapper",
		worthIt:
			"Only if you're already paying for Claude Pro. Then it's included and amazing. Otherwise, BYOK is cheaper for heavy use.",
		pros: [
			'Raw Claude power - No UI getting in the way.',
			'Terminal-native - SSH into a server and go.',
			'Browser control - Computer use capabilities for E2E testing.',
		],
		cons: [
			'Cloud agents in preview - Not as mature as Cursor/Codex yet.',
			'Requires subscription OR API - No real free tier.',
			'Windows experience - Can feel janky compared to macOS.',
		],
		categoryNotes: {
			models:
				"It's Claude all the way down. Sonnet 4.5 is the sweet spot. Opus 4.5 for hard problems.",
			pricing:
				"Simplest if you're already on Claude Pro. Otherwise, BYOK is more cost-effective.",
			agents:
				'Cloud agents (preview) + browser control + terminal = full automation stack.',
		},
		capabilities: {
			fileEdit: true,
			terminal: 'hybrid', // Native CLI (local) + SSH (cloud/remote)
			browser: 'mcp', // Computer Use via MCP
			mcp: 'native',
			cloudAgents: 'preview',
			codebaseSearch: 'agentic',
		},
		capabilityDetails: {
			codebaseSearch:
				'Agentic Grep. Does not maintain a persistent index. Iteratively uses `glob` and `grep` tools to explore the codebase in real-time.',
			browser:
				'Native "Computer Use" capability. Can view screenshots and click elements naturally, rather than just parsing DOM text.',
			cloudAgents:
				'Research preview ("Claude Code on the Web"). Runs in Anthropic VMs but is less mature than Cursor/Codex implementations.',
			terminal:
				'The entire tool is a terminal agent. Can SSH into remote servers and operate exactly like a human engineer.',
		},
		platforms: ['macos', 'linux', 'windows'],
		ideIntegrations: ['terminal', 'vscode'], // VS Code extension exists
		privacy: {
			localMode: false,
			noTrainingOnCode: true,
			soc2: true,
		},
		pricing: {
			metering: {
				type: 'hybrid',
				unitLabel: 'prompts',
				modes: [
					{
						type: 'quota_subscription',
						unitLabel: 'prompts',
						quotaWindows: [
							{
								windowId: '5h',
								metrics: [
									{
										metricId: 'interactive_prompts',
										displayLabel: 'Prompts per 5 hours (Pro)',
										unitLabel: 'prompts',
										range: { min: 10, max: 40 },
										notes: ['Shared with claude.ai'],
									},
								],
							},
						],
						sharedPool: {
							withToolSlugs: ['claude'],
							note: 'Shared with claude.ai',
						},
					},
					{
						type: 'token_metered',
						unitLabel: 'tokens',
						noHardCap: true,
					},
				],
			},
			mechanism: {
				description:
					'Included in Claude Pro ($20/mo) OR Pay-as-you-go via API key.',
			},
			plans: [
				{
					id: 'pro',
					name: 'Claude Pro',
					monthlyPrice: 20,
					features: ['Included usage', 'Shared quota'],
				},
				{
					id: 'max_5x',
					name: 'Claude Max 5x',
					monthlyPrice: 100,
					features: ['5x quota', 'Priority access'],
				},
				{
					id: 'max_20x',
					name: 'Claude Max 20x',
					monthlyPrice: 200,
					features: ['20x quota', 'Highest priority'],
				},
				{
					id: 'api',
					name: 'API (BYOK)',
					monthlyPrice: 0,
					includedValue: 'None',
					features: ['Pay per token', 'No shared limits'],
				},
			],
			models: [
				{
					modelId: 'claude-sonnet-4-5',
					cost: { type: 'included', note: 'Or $3/$15 per 1M tokens' },
					availability: { pro: true },
				},
				{
					modelId: 'claude-opus-4-5',
					cost: { type: 'included', note: 'Or $5/$25 per 1M tokens' },
					availability: { pro: true },
				},
				{
					modelId: 'claude-haiku-4-5',
					cost: { type: 'included', note: 'Or $1/$5 per 1M tokens' },
					availability: { pro: true },
				},
			],
			byok: {
				supported: true,
				providers: ['anthropic'],
				note: 'Direct API key support',
			},
			realCosts: {
				light: { range: '$5-20', note: 'API key or Pro subscription' },
				daily: {
					range: '$20-100',
					note: 'Pro works for most, but heavy users might need Max 5x',
				},
				power: {
					range: '$100-200',
					note: 'Max 20x or heavy API usage',
				},
			},
		},
		lastUpdated: '2026-01-24',
		sources: {
			pricing: 'https://www.anthropic.com/pricing',
			docs: 'https://docs.anthropic.com/claude/docs',
		},
	},
]

// ═══════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════

export function getToolComparison(slug: string): ToolComparison | undefined {
	return toolComparisons.find((t) => t.slug === slug)
}

export function getToolComparisons(slugs: string[]): ToolComparison[] {
	return slugs
		.map((slug) => getToolComparison(slug))
		.filter((t): t is ToolComparison => t !== undefined)
}

export function getAllToolSlugs(): string[] {
	return toolComparisons.map((t) => t.slug)
}

export function getToolsWithFreeModels(): ToolComparison[] {
	return toolComparisons.filter(
		(t) => t.pricing.freeModels && t.pricing.freeModels.count > 0,
	)
}
