#!/usr/bin/env bash

# Interactive helper to pull data FROM prod (.env.production) TO local (.env).
# This is the inverse of migrate-local-to-prod.sh.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_ENV_FILE="$REPO_ROOT/.env"
PROD_ENV_FILE="$REPO_ROOT/.env.production"
REQUIRED_PG_MAJOR="${REQUIRED_PG_MAJOR:-17}"

require_cmd() {
	if ! command -v "$1" >/dev/null 2>&1; then
		echo "Missing required command: $1" >&2
		exit 1
	fi
}

read_env_var() {
	local file="$1"
	local key="$2"

	if [[ ! -f "$file" ]]; then
		echo "Env file not found: $file" >&2
		exit 1
	fi

	# Grab the last occurrence to mirror dotenv override behavior and strip surrounding quotes.
	local raw
	raw="$(grep -E "^${key}=.*" "$file" | tail -n 1 | cut -d'=' -f2- || true)"
	raw="${raw%\"}"
	raw="${raw#\"}"
	raw="${raw%\'}"
	raw="${raw#\'}"

	if [[ -z "$raw" ]]; then
		echo "Key $key not found or empty in $file" >&2
		exit 1
	fi

	printf "%s" "$raw"
}

mask_url() {
	# Mask password portion of postgres connection strings to avoid leaking secrets in logs.
	local url="$1"
	if [[ "$url" == postgres://* || "$url" == postgresql://* ]]; then
		local prefix="${url%%://*}://"
		local rest="${url#*://}"
		if [[ "$rest" == "$url" ]]; then
			printf "***"
			return
		fi
		local creds="${rest%%@*}"
		local host_part="${rest#*@}"
		if [[ "$creds" == "$rest" ]]; then
			printf "%s***" "$prefix"
			return
		fi
		local user="${creds%%:*}"
		local masked="$user"
		if [[ "$creds" == *:* ]]; then
			masked="${user}:***"
		fi
		printf "%s%s@%s" "$prefix" "$masked" "$host_part"
	else
		printf "***"
	fi
}

pg_major_version() {
	local bin="$1"
	if ! "$bin" --version >/dev/null 2>&1; then
		echo ""
		return
	fi
	local version
	version=$("$bin" --version 2>&1 | grep -Eo '[0-9]+(\.[0-9]+)?' | head -n 1 || true)
	echo "${version%%.*}"
}

select_pg_tool() {
	local tool="$1"
	local override="$2"

	# Highest priority: explicit override
	if [[ -n "$override" ]]; then
		echo "$override"
		return
	fi

	# Next: PATH if version matches
	local path_bin
	path_bin="$(command -v "$tool" 2>/dev/null || true)"
	if [[ -n "$path_bin" ]]; then
		local major
		major="$(pg_major_version "$path_bin")"
		if [[ "$major" == "$REQUIRED_PG_MAJOR" ]]; then
			echo "$path_bin"
			return
		fi
	fi

	# Next: Homebrew keg for required major
	local brew_bin="/opt/homebrew/opt/postgresql@${REQUIRED_PG_MAJOR}/bin/${tool}"
	if [[ -x "$brew_bin" ]]; then
		echo "$brew_bin"
		return
	fi

	# Fallback: original tool name (may fail later)
	echo "$tool"
}

PG_DUMP_BIN="$(select_pg_tool "pg_dump" "${PG_DUMP_BIN:-}")"
PG_RESTORE_BIN="$(select_pg_tool "pg_restore" "${PG_RESTORE_BIN:-}")"

require_cmd "$PG_DUMP_BIN"
require_cmd "$PG_RESTORE_BIN"

PROD_URL="$(read_env_var "$PROD_ENV_FILE" "DATABASE_URL")"
LOCAL_URL="$(read_env_var "$LOCAL_ENV_FILE" "DATABASE_URL")"

echo "Detected URLs (passwords hidden):"
echo "  Source (PROD):  $(mask_url "$PROD_URL")"
echo "  Target (LOCAL): $(mask_url "$LOCAL_URL")"
echo
echo "⚠️  WARNING ⚠️"
echo "This will OVERWRITE your LOCAL database with data from PRODUCTION."
echo "Any local-only changes will be LOST."
echo

DUMP_FILE="$(mktemp "${TMPDIR:-/tmp}/prod-to-local-XXXXXX.dump")"
cleanup() {
	rm -f "$DUMP_FILE"
}
trap cleanup EXIT

# Tables from prisma/schema.prisma (public schema only)
APP_TABLES=(
	"waitlist"
	"user"
	"session"
	"account"
	"verification"
	"tool"
	"release"
	"change"
	"fetch_log"
	"email_log"
)

# Flags
# -Fc: Custom format (required for pg_restore)
dump_flags=(--format=custom --no-owner --no-privileges --schema=public)

# Add each table to dump flags
for table in "${APP_TABLES[@]}"; do
	dump_flags+=(--table="public.${table}")
done

# --clean: Drop database objects before creating them
# --if-exists: Use IF EXISTS when dropping objects
# --no-owner: Do not output commands to set ownership of objects to match the original database
# --no-privileges: Do not restore access privileges (grant/revoke)
restore_flags=(--dbname="$LOCAL_URL" --no-owner --no-privileges --clean --if-exists --disable-triggers --schema=public)

echo "Planned actions:"
echo "  Dump file: $DUMP_FILE"
echo "  pg_dump: $PG_DUMP_BIN"
echo "  pg_restore: $PG_RESTORE_BIN"
echo "    flags: ${restore_flags[*]}"
echo
read -rp "Type 'yes' to proceed: " confirm
if [[ "$confirm" != "yes" ]]; then
	echo "Aborted."
	exit 1
fi

echo "Dumping PROD database..."
"$PG_DUMP_BIN" "$PROD_URL" "${dump_flags[@]}" --file="$DUMP_FILE"

echo "Restoring into LOCAL..."
"$PG_RESTORE_BIN" "${restore_flags[@]}" "$DUMP_FILE"

echo "Done. Local database is now in sync with Production."
