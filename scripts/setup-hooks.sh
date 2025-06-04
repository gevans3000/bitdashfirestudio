#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
POST_HOOK_PATH="$REPO_ROOT/.git/hooks/post-commit"
PRE_HOOK_PATH="$REPO_ROOT/.git/hooks/pre-commit"

cat > "$POST_HOOK_PATH" <<'HOOK'
#!/usr/bin/env bash
npm run memlog >/dev/null 2>&1
npm run mem-rotate >/dev/null 2>&1
npm run mem-check >/dev/null 2>&1
ts-node scripts/update-snapshot.ts >/dev/null 2>&1
HOOK

chmod +x "$POST_HOOK_PATH"
echo "post-commit hook installed at $POST_HOOK_PATH"

cat > "$PRE_HOOK_PATH" <<'HOOK'
#!/usr/bin/env bash
npm run mem-check >/dev/null 2>&1
HOOK

chmod +x "$PRE_HOOK_PATH"
echo "pre-commit hook installed at $PRE_HOOK_PATH"

