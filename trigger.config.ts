import { syncVercelEnvVars } from '@trigger.dev/build/extensions/core'
import { prismaExtension } from '@trigger.dev/build/extensions/prisma'
import { defineConfig } from '@trigger.dev/sdk/v3'

export default defineConfig({
	project: 'proj_bcoqvcqkiytlhpiuehfb',
	runtime: 'node',
	logLevel: 'log',
	// The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
	// You can override this on an individual task.
	// See https://trigger.dev/docs/runs/max-duration
	maxDuration: 3600,
	retries: {
		enabledInDev: true,
		default: {
			maxAttempts: 3,
			minTimeoutInMs: 1000,
			maxTimeoutInMs: 10000,
			factor: 2,
			randomize: true,
		},
	},
	dirs: ['./src/trigger'],
	build: {
		extensions: [
			syncVercelEnvVars({
				// A personal access token created in your Vercel account settings
				// Used to authenticate API requests to Vercel
				// Generate at: https://vercel.com/account/tokens
				vercelAccessToken: process.env.VERCEL_ACCESS_TOKEN,
				// The unique identifier of your Vercel project
				// Found in Project Settings > General > Project ID
				projectId: process.env.VERCEL_PROJECT_ID,
			}),
			prismaExtension({
				schema: 'prisma/schema.prisma',
				mode: 'legacy',
			}),
		],
	},
})
