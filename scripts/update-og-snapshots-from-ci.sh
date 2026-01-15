#!/usr/bin/env bash
set -euo pipefail

run_id=${1:-}
if [[ -z "${run_id}" ]]; then
  echo "Usage: scripts/update-og-snapshots-from-ci.sh <run-id>"
  exit 1
fi

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
artifacts_dir="${repo_root}/tmp/gh-artifacts/${run_id}"

rm -rf "${artifacts_dir}"
mkdir -p "${artifacts_dir}"

gh run download "${run_id}" --name test-screenshots --dir "${artifacts_dir}"

declare -A snapshot_map=(
  ["home"]="home-chromium-linux.png"
  ["tools-index"]="tools-index-chromium-linux.png"
  ["tool-claude-code"]="tool-claude-code-chromium-linux.png"
  ["tool-codex"]="tool-codex-chromium-linux.png"
  ["tool-windsurf"]="tool-windsurf-chromium-linux.png"
  ["tool-opencode"]="tool-opencode-chromium-linux.png"
  ["tool-antigravity"]="tool-antigravity-chromium-linux.png"
  ["tool-gemini-cli"]="tool-gemini-cli-chromium-linux.png"
)

snapshot_dir="${repo_root}/tests/e2e/routes/og/visual.spec.ts-snapshots"

for name in "${!snapshot_map[@]}"; do
  actual_file=$(find "${artifacts_dir}" -type f -name "${name}-actual.png" | head -n 1)
  if [[ -z "${actual_file}" ]]; then
    echo "Missing actual snapshot for ${name}"
    exit 1
  fi

  cp "${actual_file}" "${snapshot_dir}/${snapshot_map[$name]}"
  echo "Updated ${snapshot_map[$name]}"
done

echo "Done. Updated OG snapshots from run ${run_id}."