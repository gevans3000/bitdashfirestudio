#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.husky"
GIT_HOOKS_DIR="$REPO_ROOT/.git/hooks"

# Install all hooks found in .husky directory
for hook in "$HOOKS_DIR"/*; do
  if [ -f "$hook" ]; then
    hook_name="$(basename "$hook")"
    target="$GIT_HOOKS_DIR/$hook_name"
    
    # Skip README or other non-hook files
    if [[ "$hook_name" == _* ]] || [[ "$hook_name" == *.md ]]; then
      continue
    fi
    
    echo "Installing $hook_name hook"
    install -m 755 "$hook" "$target"
    echo "✅ $hook_name hook installed at $target"
  fi
done

echo "All git hooks installed successfully"

