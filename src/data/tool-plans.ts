export type ApiValueRange = [low: number, high: number]

export type ApiValueEstimate = {
	typical: ApiValueRange
	heavy: ApiValueRange
}

export type ToolPlan = {
	name: string
	priceUSD: number | 'custom'
	period?: 'month' | 'year' | 'one-time'
	quota?: string
	notes?: string
	apiValueUSD?: ApiValueEstimate
	subsidyNote?: string
}

export type ToolPlanGroup = {
	slug: string
	name: string
	vendor: string
	bucket: 'official' | 'harness'
	tagline: string
	plans: ToolPlan[]
	models: string[]
	sourceUrl: string
	lastVerified: string
	gotchas?: string[]
	/**
	 * Token efficiency relative to a Claude Code baseline of 1.
	 * Codex is ~4× more token-efficient per task — multiply raw $ subsidy by this
	 * factor for an apples-to-apples cross-tool comparison.
	 */
	tokenEfficiency?: number
	/** 90-day uptime percentage from the vendor's public status page. */
	uptime90d?: number
	/** ISO date string for when uptime was sampled. */
	uptimeAsOf?: string
	/**
	 * Opinionated "best deal" pick. Overrides the auto-computed best-by-score
	 * when the editorial call differs from the raw heavy-end ratio.
	 */
	bestPlan?: string
	/**
	 * Marks a tool that is being sunset. Renders a deprecation badge and, when
	 * present, points users at the successor product.
	 */
	deprecated?: {
		/** ISO date the tool stops serving the tracked plans. */
		sunsetDate: string
		/** Human-readable successor, e.g. "Antigravity CLI". */
		successor?: string
		/** Link to the official sunset/transition announcement. */
		announcementUrl?: string
	}
}

export const TOOL_PLANS: ToolPlanGroup[] = [
	{
		slug: 'claude-code',
		name: 'Claude Code',
		vendor: 'Anthropic',
		bucket: 'official',
		tagline: "Anthropic's terminal-native CLI for Claude.",
		plans: [
			{
				name: 'Pro',
				priceUSD: 20,
				period: 'month',
				apiValueUSD: { typical: [25, 80], heavy: [100, 150] },
			},
			{
				name: 'Max 5x',
				priceUSD: 100,
				period: 'month',
				apiValueUSD: { typical: [300, 600], heavy: [1500, 3000] },
			},
			{
				name: 'Max 20x',
				priceUSD: 200,
				period: 'month',
				apiValueUSD: { typical: [800, 1500], heavy: [3500, 5500] },
				subsidyNote: 'Highest raw-$ subsidy of any plan tracked.',
			},
			{
				name: 'Team Premium',
				priceUSD: 100,
				period: 'month',
				notes: 'Per seat, 5 seat minimum',
				apiValueUSD: { typical: [250, 500], heavy: [1000, 2000] },
			},
		],
		models: ['Claude Sonnet 4.6', 'Claude Opus 4.8', 'Claude Haiku 4.5'],
		sourceUrl: 'https://claude.com/pricing',
		lastVerified: '2026-05-29',
		tokenEfficiency: 1,
		uptime90d: 99.08,
		uptimeAsOf: '2026-05-29',
		gotchas: [
			'5h rolling usage window plus a weekly active-compute cap.',
			'Quota is shared with claude.ai web/desktop.',
			'Team Standard ($20/seat) does NOT include Claude Code — only Premium does.',
			'Opus 4.8 (May 28) shipped at the same price; new "fast mode" runs ~2.5× faster on a separate API rate.',
			'Dynamic workflows (research preview, Team/Max/Enterprise) can fan out hundreds of parallel subagents in one session.',
			'Subsidy multipliers are inflated by cache-read accounting; raw output tokens are closer to 2–4×.',
		],
	},
	{
		slug: 'codex',
		name: 'Codex',
		vendor: 'OpenAI',
		bucket: 'official',
		tagline: "OpenAI's CLI/cloud agent, billed via your ChatGPT plan.",
		plans: [
			{
				name: 'ChatGPT Plus',
				priceUSD: 20,
				period: 'month',
				apiValueUSD: { typical: [25, 60], heavy: [80, 150] },
			},
			{
				name: 'ChatGPT Pro (April 2026)',
				priceUSD: 100,
				period: 'month',
				notes:
					'5× Plus · ~10× through May 31 promo · incl. GPT-5.3-Codex-Spark',
				apiValueUSD: { typical: [200, 400], heavy: [700, 1200] },
			},
			{
				name: 'ChatGPT Pro',
				priceUSD: 200,
				period: 'month',
				notes: '20× Plus (25× on 5h limits through May 31)',
				apiValueUSD: { typical: [500, 900], heavy: [1500, 2500] },
				subsidyNote:
					'Best heavy-user deal after 4× token-efficiency adjustment (~30–50× effective).',
			},
			{
				name: 'Business',
				priceUSD: 25,
				period: 'month',
				notes: 'Per seat · $20 annual · 2 seat min (+ usage-based Codex seat)',
				apiValueUSD: { typical: [50, 120], heavy: [200, 400] },
			},
		],
		models: [
			'GPT-5.5 (default, all tiers)',
			'GPT-5.4',
			'GPT-5.4-mini',
			'GPT-5.3-Codex',
			'GPT-5.3-Codex-Spark (research preview, Pro tiers)',
		],
		sourceUrl: 'https://developers.openai.com/codex/pricing',
		lastVerified: '2026-05-29',
		tokenEfficiency: 4,
		uptime90d: 99.98,
		uptimeAsOf: '2026-05-29',
		bestPlan: 'ChatGPT Pro',
		gotchas: [
			'Token-based credits (per 1M in/cached/out tokens) since April 2, 2026 — replaced per-message billing.',
			'Limits reset on a 5h rolling window; Plus/Pro can buy extra credits to continue past the cap.',
			'Codex is ~4× more token-efficient than Claude Code per task — apply efficiency multiplier for fair $ comparison.',
			'Pro promos (Pro $100 ~10×, Pro $200 25× on 5h limits) expire May 31, 2026.',
		],
	},
	{
		slug: 'gemini-cli',
		name: 'Gemini CLI',
		vendor: 'Google',
		bucket: 'official',
		tagline: "Google's open-source CLI with the most generous free tier.",
		plans: [
			{
				name: 'Free (Google login)',
				priceUSD: 0,
				quota: '~1k requests/day',
				apiValueUSD: { typical: [0, 10], heavy: [0, 20] },
			},
			{
				name: 'Free (API key)',
				priceUSD: 0,
				notes: '250 req/day, Flash only',
				apiValueUSD: { typical: [0, 5], heavy: [0, 10] },
			},
			{
				name: 'Google AI Plus',
				priceUSD: 7.99,
				period: 'month',
				apiValueUSD: { typical: [10, 25], heavy: [40, 80] },
			},
			{
				name: 'Google AI Pro',
				priceUSD: 19.99,
				period: 'month',
				apiValueUSD: { typical: [30, 80], heavy: [150, 300] },
			},
			{
				name: 'Google AI Ultra (Dev)',
				priceUSD: 100,
				period: 'month',
				notes: '5× Pro usage',
				apiValueUSD: { typical: [150, 300], heavy: [500, 1000] },
			},
			{
				name: 'Google AI Ultra',
				priceUSD: 200,
				period: 'month',
				notes: '20× Pro usage (was $249.99)',
				apiValueUSD: { typical: [300, 600], heavy: [1000, 2500] },
				subsidyNote:
					'Heavy users report frequent throttling; effective value below nameplate.',
			},
		],
		models: ['Gemini 3.5 Flash', 'Gemini 3.1 Pro', 'Gemini Omni'],
		sourceUrl: 'https://geminicli.com/docs/resources/quota-and-pricing/',
		lastVerified: '2026-05-29',
		deprecated: {
			sunsetDate: '2026-06-18',
			successor: 'Antigravity CLI',
			announcementUrl:
				'https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/',
		},
		gotchas: [
			'Deprecation: free/Pro/Ultra access ends June 18, 2026 — successor is Antigravity CLI (`agy`). Only paid API keys & enterprise Code Assist keep Gemini CLI.',
			'Daily request limits are aggregated across models; one prompt can consume several requests.',
			'Free tier with Google login remains the most generous in the market (~1k requests/day) — for now.',
		],
	},
	{
		slug: 'cursor',
		name: 'Cursor',
		vendor: 'Anysphere',
		bucket: 'harness',
		tagline: 'Polished AI-first IDE with a credit-pool billing model.',
		plans: [
			{ name: 'Hobby', priceUSD: 0 },
			{
				name: 'Pro',
				priceUSD: 20,
				period: 'month',
				apiValueUSD: { typical: [20, 20], heavy: [20, 20] },
				subsidyNote: 'At-cost: $20 plan equals $20 API credit pool, by design.',
			},
			{
				name: 'Pro+',
				priceUSD: 60,
				period: 'month',
				notes: '3× Pro usage',
				apiValueUSD: { typical: [60, 70], heavy: [60, 70] },
			},
			{
				name: 'Ultra',
				priceUSD: 200,
				period: 'month',
				notes: '20× Pro usage',
				apiValueUSD: { typical: [400, 400], heavy: [400, 400] },
			},
			{
				name: 'Teams',
				priceUSD: 40,
				period: 'month',
				notes: 'Per seat',
				apiValueUSD: { typical: [40, 40], heavy: [40, 40] },
			},
			{ name: 'Enterprise', priceUSD: 'custom' },
		],
		models: [
			'Composer 2.5 (Cursor in-house, default)',
			'Claude family',
			'GPT family',
			'Gemini family',
			'Auto mode',
		],
		sourceUrl: 'https://cursor.com/pricing',
		lastVerified: '2026-05-29',
		uptime90d: 99.64,
		uptimeAsOf: '2026-05-29',
		gotchas: [
			'Plan price equals monthly $ credit pool (since June 2025).',
			'Auto mode routes to Cursor’s own Composer 2.5 (May 18) — unlimited and credit-free; only manual frontier models draw from credits.',
			'Annual billing saves 20%.',
			'Honest pricing: subsidy ≈ 1× by design — no hidden discount on premium models.',
		],
	},
	{
		slug: 'windsurf',
		name: 'Windsurf',
		vendor: 'Cognition',
		bucket: 'harness',
		tagline:
			"Cascade agent IDE with native SWE models that don't burn credits.",
		plans: [
			{
				name: 'Free',
				priceUSD: 0,
				quota: 'Daily + weekly usage allowance',
			},
			{
				name: 'Pro',
				priceUSD: 20,
				period: 'month',
				notes: 'Post-March 2026 quota pricing',
				apiValueUSD: { typical: [25, 50], heavy: [80, 150] },
			},
			{
				name: 'Max',
				priceUSD: 200,
				period: 'month',
				notes: 'Heavy usage allowance',
				apiValueUSD: { typical: [250, 500], heavy: [800, 1500] },
			},
			{
				name: 'Teams',
				priceUSD: 40,
				period: 'month',
				notes: 'Per seat',
				apiValueUSD: { typical: [40, 80], heavy: [150, 300] },
			},
			{ name: 'Enterprise', priceUSD: 'custom' },
		],
		models: [
			'SWE-1.6',
			'SWE-1.6 Fast',
			'SWE-1.5',
			'SWE-1-mini (Tab, free)',
			'swe-grep / swe-check (context, free)',
			'Claude Opus 4.8 (premium credits)',
			'GPT-5.5 (premium credits)',
			'Gemini 3.1 Pro (premium credits)',
		],
		sourceUrl: 'https://windsurf.com/pricing',
		lastVerified: '2026-05-29',
		uptime90d: 99.95,
		uptimeAsOf: '2026-05-29',
		gotchas: [
			'March 19, 2026: switched from credit pool to rate-limited quotas; overage billed at API price.',
			'Existing subscribers grandfathered on legacy $15 Pro pricing.',
			'Tab autocomplete never costs credits, on every plan.',
			'SWE-1.6 (Apr 7) is the current native flagship — there is no "SWE-2".',
		],
	},
	{
		slug: 'antigravity',
		name: 'Antigravity',
		vendor: 'Google',
		bucket: 'harness',
		tagline: "Google's agentic IDE; multi-model but Gemini-tuned.",
		plans: [
			{
				name: 'Free',
				priceUSD: 0,
				apiValueUSD: { typical: [0, 10], heavy: [0, 20] },
			},
			{
				name: 'AI Pro',
				priceUSD: 20,
				period: 'month',
				apiValueUSD: { typical: [20, 50], heavy: [50, 150] },
				subsidyNote:
					'Multi-day lockouts reported; effective value below nameplate.',
			},
			{
				name: 'AI Ultra (Dev)',
				priceUSD: 100,
				period: 'month',
				notes: '5× Pro usage',
				apiValueUSD: { typical: [100, 250], heavy: [400, 800] },
			},
			{
				name: 'AI Ultra',
				priceUSD: 200,
				period: 'month',
				notes: '20× Pro usage (was $249.99)',
				apiValueUSD: { typical: [250, 500], heavy: [700, 1500] },
				subsidyNote: 'Throttling reported even on highest tier.',
			},
		],
		models: [
			'Gemini 3.5 Flash (default)',
			'Gemini 3.1 Pro',
			'Claude Sonnet 4.6',
			'Claude Opus 4.6',
			'GPT-OSS 120B',
		],
		sourceUrl: 'https://antigravity.google/pricing',
		lastVerified: '2026-05-29',
		gotchas: [
			'Free tier was significantly reduced (250 → 20 req/day) since launch.',
			'Credits sold at $0.01 each — advertised bundle is $25 for 2,500 credits; credit-to-token conversion is undisclosed.',
			'Usage moved to a compute-used model (~5h refresh, weekly cap); over the premium cap you auto-downgrade to smaller models.',
			'Google docs disclaim: "Specified rate limits are not guaranteed."',
		],
	},
	{
		slug: 'opencode',
		name: 'Opencode',
		vendor: 'SST / Anomaly',
		bucket: 'harness',
		tagline: 'Open-source terminal coding agent. The agent itself is free.',
		plans: [
			{
				name: 'Open source / self-host',
				priceUSD: 0,
				notes:
					'BYOK any model — or free Zen models: DeepSeek V4 Flash, MiMo-V2.5, Nemotron 3 Super, Big Pickle',
			},
			{
				name: 'Opencode Zen',
				priceUSD: 0,
				notes:
					'PAYG · 40+ models incl. premium (GPT-5.x, Opus 4.8, Gemini 3.x) + free open-weight models',
			},
			{
				name: 'Opencode Go',
				priceUSD: 10,
				period: 'month',
				notes: '$5 first month · $12/5h · $30/wk · $60/mo limits',
				apiValueUSD: { typical: [60, 60], heavy: [60, 60] },
				subsidyNote:
					'Dollar-denominated limits on open-weight models (GLM, Kimi, Qwen, DeepSeek, MiniMax).',
			},
			{
				name: 'Opencode Black',
				priceUSD: 200,
				period: 'month',
				notes: 'Any model, generous limits · batched enrollment',
				apiValueUSD: { typical: [200, 350], heavy: [400, 700] },
				subsidyNote:
					'"Use any model, generous limits" — exact caps unpublished; sold in limited batches.',
			},
			{ name: 'Enterprise', priceUSD: 'custom' },
		],
		models: [
			'BYOK any provider (Claude, GPT, Gemini, etc.)',
			'Zen: GPT-5.x, Claude Opus/Sonnet/Haiku, Gemini 3.x + open-weight',
			'Go: GLM-5.1, Kimi K2.6, Qwen3.7 Max, MiniMax M2.7, DeepSeek V4 Pro',
		],
		sourceUrl: 'https://opencode.ai/',
		lastVerified: '2026-05-29',
		gotchas: [
			'BYOK model — bring your own API key for any LLM.',
			'Zero data retention by default, with exceptions: free models train on data; OpenAI/Anthropic APIs retain 30 days.',
			'Pivot to Go/Zen/Black followed Anthropic blocking third-party Claude subscription OAuth in Jan 2026.',
		],
	},
]
