#!/bin/sh
# Builds the ZIP uploaded at platform.openai.com/plugins. OpenAI reads the
# Codex format (.codex-plugin/plugin.json and .mcp.json), so the Claude and
# Cursor manifests stay out of the archive.
set -eu

root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/dist/wonder-openai.zip"

mkdir -p "$root/dist"
rm -f "$out"

cd "$root/plugins/wonder"
zip -q -r -X "$out" . \
  -x '.claude-plugin/*' \
  -x '.cursor-plugin/*' \
  -x 'mcp.json' \
  -x '*.DS_Store'

echo "Wrote $out"
unzip -l "$out"
