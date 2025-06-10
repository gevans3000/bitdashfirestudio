#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
POST_HOOK_PATH="$REPO_ROOT/.git/hooks/post-commit"

cat > "$POST_HOOK_PATH" <<'HOOK'
#!/usr/bin/env bash
node --loader ts-node/esm scripts/update-memory.ts >/dev/null 2>&1
HOOK

chmod +x "$POST_HOOK_PATH"
echo "post-commit hook installed at $POST_HOOK_PATH"

