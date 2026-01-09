/**
 * Sync production database to local development.
 *
 * Reads DATABASE_URL from:
 *   - Production: .env.production
 *   - Local: .env
 *
 * Features:
 *   - Interactive confirmation before destructive operation
 *   - Automatic backup of local DB before restore
 *   - Verbose progress with timing
 *   - Password masking in logs
 *
 * Usage:
 *   pnpm sync:prod
 *   pnpm sync:prod --bypass    # Skip confirmation prompt
 *   bun scripts/sync-prod-to-local.ts
 */

import { spawn, spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import readline from "node:readline"

// ANSI colors for terminal output
const colors = {
	reset: "\x1b[0m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	dim: "\x1b[2m",
}

const REQUIRED_PG_MAJOR = 17
const REPO_ROOT = path.resolve(import.meta.dirname, "..")
const LOCAL_ENV_FILE = path.join(REPO_ROOT, ".env")
const PROD_ENV_FILE = path.join(REPO_ROOT, ".env.production")

/**
 * Read an environment variable from a .env file.
 * Mimics bash behavior: grabs last occurrence and strips surrounding quotes.
 */
function readEnvVar(filePath: string, key: string): string {
	if (!fs.existsSync(filePath)) {
		throw new Error(`Env file not found: ${filePath}`)
	}

	const content = fs.readFileSync(filePath, "utf-8")
	const lines = content.split("\n")

	// Find the last occurrence (to mirror dotenv override behavior)
	let value: string | null = null
	for (const line of lines) {
		const match = line.match(new RegExp(`^${key}=(.*)$`))
		if (match) {
			value = match[1]
		}
	}

	if (!value) {
		throw new Error(`Key ${key} not found or empty in ${filePath}`)
	}

	// Strip surrounding quotes
	return value.replace(/^["']|["']$/g, "")
}

/**
 * Mask password portion of postgres connection strings to avoid leaking secrets in logs.
 */
function maskUrl(url: string): string {
	if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
		return "***"
	}

	try {
		const prefix = url.split("://")[0] + "://"
		const rest = url.substring(prefix.length)

		if (!rest.includes("@")) {
			return `${prefix}***`
		}

		const [creds, hostPart] = rest.split("@")
		const user = creds.split(":")[0]
		const masked = creds.includes(":") ? `${user}:***` : user

		return `${prefix}${masked}@${hostPart}`
	} catch {
		return "***"
	}
}

/**
 * Get PostgreSQL major version from a binary.
 */
function getPgMajorVersion(binPath: string): number | null {
	try {
		const result = spawnSync(binPath, ["--version"], { encoding: "utf-8" })
		if (result.status !== 0) return null

		const match = result.stdout.match(/(\d+)(?:\.\d+)?/)
		return match ? Number.parseInt(match[1], 10) : null
	} catch {
		return null
	}
}

/**
 * Find the appropriate PostgreSQL tool binary, preferring the required major version.
 */
function selectPgTool(tool: "pg_dump" | "pg_restore"): string {
	// Try PATH first
	const whichResult = spawnSync("which", [tool], { encoding: "utf-8" })
	if (whichResult.status === 0) {
		const pathBin = whichResult.stdout.trim()
		const major = getPgMajorVersion(pathBin)
		if (major === REQUIRED_PG_MAJOR) {
			return pathBin
		}
	}

	// Fallback to Homebrew keg (macOS)
	const brewBin = `/opt/homebrew/opt/postgresql@${REQUIRED_PG_MAJOR}/bin/${tool}`
	if (fs.existsSync(brewBin)) {
		return brewBin
	}

	// Last resort: return tool name and let it fail with a clear error
	return tool
}

/**
 * Execute a shell command with streaming output.
 */
function exec(
	cmd: string,
	args: string[],
	options?: { silent?: boolean },
): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, {
			stdio: options?.silent ? "pipe" : "inherit",
		})

		child.on("close", (code) => {
			if (code === 0) {
				resolve()
			} else {
				reject(new Error(`${cmd} exited with code ${code}`))
			}
		})

		child.on("error", (err) => {
			reject(new Error(`Failed to execute ${cmd}: ${err.message}`))
		})
	})
}

/**
 * Interactive confirmation prompt.
 */
function confirm(message: string): Promise<boolean> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	return new Promise((resolve) => {
		rl.question(`${message} `, (answer) => {
			rl.close()
			resolve(answer.toLowerCase() === "yes")
		})
	})
}

/**
 * Format milliseconds as human-readable duration.
 */
function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`
	const seconds = Math.floor(ms / 1000)
	if (seconds < 60) return `${seconds}s`
	const minutes = Math.floor(seconds / 60)
	const remainingSeconds = seconds % 60
	return `${minutes}m ${remainingSeconds}s`
}

async function main() {
	const startTime = Date.now()
	const bypassConfirmation = process.argv.includes("--bypass")

	console.log("")
	console.log(
		`${colors.blue}🔄 Production → Local Database Sync${colors.reset}`,
	)
	console.log("")

	// Find PostgreSQL tools
	const pgDumpBin = selectPgTool("pg_dump")
	const pgRestoreBin = selectPgTool("pg_restore")

	// Verify tools exist and have correct version
	const pgDumpVersion = getPgMajorVersion(pgDumpBin)
	const pgRestoreVersion = getPgMajorVersion(pgRestoreBin)

	if (pgDumpVersion !== REQUIRED_PG_MAJOR) {
		console.error(
			`${colors.red}❌ pg_dump version ${REQUIRED_PG_MAJOR} required, found: ${pgDumpVersion ?? "not found"}${colors.reset}`,
		)
		console.error(
			`${colors.dim}   Install with: brew install postgresql@${REQUIRED_PG_MAJOR}${colors.reset}`,
		)
		process.exit(1)
	}

	if (pgRestoreVersion !== REQUIRED_PG_MAJOR) {
		console.error(
			`${colors.red}❌ pg_restore version ${REQUIRED_PG_MAJOR} required, found: ${pgRestoreVersion ?? "not found"}${colors.reset}`,
		)
		console.error(
			`${colors.dim}   Install with: brew install postgresql@${REQUIRED_PG_MAJOR}${colors.reset}`,
		)
		process.exit(1)
	}

	// Read database URLs
	let prodUrl: string
	let localUrl: string

	try {
		prodUrl = readEnvVar(PROD_ENV_FILE, "DATABASE_URL")
	} catch (error) {
		console.error(
			`${colors.red}❌ ${error instanceof Error ? error.message : error}${colors.reset}`,
		)
		process.exit(1)
	}

	try {
		localUrl = readEnvVar(LOCAL_ENV_FILE, "DATABASE_URL")
	} catch (error) {
		console.error(
			`${colors.red}❌ ${error instanceof Error ? error.message : error}${colors.reset}`,
		)
		process.exit(1)
	}

	// Display configuration
	console.log("Detected URLs (passwords hidden):")
	console.log(`  ${colors.green}Source (PROD):${colors.reset}  ${maskUrl(prodUrl)}`)
	console.log(`  ${colors.blue}Target (LOCAL):${colors.reset} ${maskUrl(localUrl)}`)
	console.log("")
	console.log("Tools:")
	console.log(`  ${colors.dim}pg_dump:${colors.reset}    ${pgDumpBin}`)
	console.log(`  ${colors.dim}pg_restore:${colors.reset} ${pgRestoreBin}`)
	console.log("")

	// Warning
	console.log(`${colors.yellow}⚠️  WARNING${colors.reset}`)
	console.log("This will OVERWRITE your LOCAL database with data from PRODUCTION.")
	console.log("A backup of your local database will be created first.")
	console.log("")

	// Confirm (skip if --bypass flag is provided)
	if (bypassConfirmation) {
		console.log(`${colors.dim}Bypassing confirmation (--bypass flag)${colors.reset}`)
	} else {
		const confirmed = await confirm("Type 'yes' to proceed:")
		if (!confirmed) {
			console.log(`${colors.yellow}Aborted.${colors.reset}`)
			process.exit(0)
		}
	}
	console.log("")

	// Create temp files
	const tempDir = os.tmpdir()
	const timestamp = Date.now()
	const backupFile = path.join(tempDir, `local-backup-${timestamp}.dump`)
	const prodDumpFile = path.join(tempDir, `prod-dump-${timestamp}.dump`)

	// Cleanup handler
	const cleanup = () => {
		try {
			if (fs.existsSync(prodDumpFile)) {
				fs.unlinkSync(prodDumpFile)
			}
		} catch {
			// Ignore cleanup errors
		}
	}

	process.on("exit", cleanup)
	process.on("SIGINT", () => {
		cleanup()
		process.exit(1)
	})

	// Step 1: Backup local database
	console.log(`${colors.blue}📦 Step 1/3: Backing up local database...${colors.reset}`)
	const backupStart = Date.now()

	try {
		await exec(pgDumpBin, [
			localUrl,
			"--format=custom",
			"--no-owner",
			"--no-privileges",
			`--file=${backupFile}`,
		])
		const backupSize = fs.statSync(backupFile).size
		console.log(
			`   ${colors.green}✓${colors.reset} Backup created: ${backupFile}`,
		)
		console.log(
			`   ${colors.dim}Size: ${(backupSize / 1024 / 1024).toFixed(2)} MB | Time: ${formatDuration(Date.now() - backupStart)}${colors.reset}`,
		)
	} catch (error) {
		console.error(
			`${colors.red}❌ Failed to backup local database: ${error instanceof Error ? error.message : error}${colors.reset}`,
		)
		process.exit(1)
	}
	console.log("")

	// Step 2: Dump production database
	console.log(`${colors.blue}📥 Step 2/3: Dumping production database...${colors.reset}`)
	const dumpStart = Date.now()

	try {
		await exec(pgDumpBin, [
			prodUrl,
			"--format=custom",
			"--no-owner",
			"--no-privileges",
			"--no-comments",
			// Only dump the public schema (our application data)
			"--schema=public",
			`--file=${prodDumpFile}`,
		])
		const dumpSize = fs.statSync(prodDumpFile).size
		console.log(`   ${colors.green}✓${colors.reset} Production dump complete`)
		console.log(
			`   ${colors.dim}Size: ${(dumpSize / 1024 / 1024).toFixed(2)} MB | Time: ${formatDuration(Date.now() - dumpStart)}${colors.reset}`,
		)
	} catch (error) {
		console.error(
			`${colors.red}❌ Failed to dump production database: ${error instanceof Error ? error.message : error}${colors.reset}`,
		)
		process.exit(1)
	}
	console.log("")

	// Step 3: Restore to local
	console.log(`${colors.blue}📤 Step 3/3: Restoring to local database...${colors.reset}`)
	const restoreStart = Date.now()

	try {
		await exec(pgRestoreBin, [
			`--dbname=${localUrl}`,
			"--no-owner",
			"--no-privileges",
			"--clean",
			"--if-exists",
			"--disable-triggers",
			prodDumpFile,
		])
		console.log(`   ${colors.green}✓${colors.reset} Restore complete`)
		console.log(
			`   ${colors.dim}Time: ${formatDuration(Date.now() - restoreStart)}${colors.reset}`,
		)
	} catch (error) {
		console.error(
			`${colors.red}❌ Failed to restore to local database: ${error instanceof Error ? error.message : error}${colors.reset}`,
		)
		console.error(
			`${colors.yellow}ℹ️  Your local backup is preserved at: ${backupFile}${colors.reset}`,
		)
		process.exit(1)
	}
	console.log("")

	// Done
	const totalTime = Date.now() - startTime
	console.log(`${colors.green}✅ Sync complete!${colors.reset}`)
	console.log(`   ${colors.dim}Total time: ${formatDuration(totalTime)}${colors.reset}`)
	console.log("")
	console.log(`${colors.dim}Backup preserved at: ${backupFile}${colors.reset}`)
	console.log(
		`${colors.dim}You can restore it with: ${pgRestoreBin} --dbname=<url> --clean ${backupFile}${colors.reset}`,
	)
}

main().catch((error) => {
	console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`)
	process.exit(1)
})
