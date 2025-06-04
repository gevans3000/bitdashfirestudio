#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_PATH="$REPO_ROOT/.git/hooks/post-commit"

cat > "$HOOK_PATH" <<'HOOK'
#!/usr/bin/env bash
npm run memlog >/dev/null 2>&1
HOOK

chmod +x "$HOOK_PATH"
echo "post-commit hook installed at $HOOK_PATH"

