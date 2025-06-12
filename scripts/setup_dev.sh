#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Fast, idempotent bootstrap for Codex / CI / local dev
# ---------------------------------------------------------------------------
set -euo pipefail

# -- Self-healing exec bit (kept)
[[ -x "$0" ]] || { chmod +x "$0"; }

echo "▶ Bootstrapping dev environment..."

# --- Node.js 18.x Setup ---
REQUIRED_NODE_MAJOR=18

ensure_node18() {
  local nodev
  if command -v node >/dev/null 2>&1; then
    nodev=$(node -v | grep -oE '[0-9]+' | head -1)
    if [ "$nodev" = "$REQUIRED_NODE_MAJOR" ]; then
      echo "✔ Node.js $REQUIRED_NODE_MAJOR.x detected: $(node -v)"
      return 0
    fi
  fi

  echo "⚠️ Node.js $REQUIRED_NODE_MAJOR not found. Attempting to use nvm, volta, or npx..."

  # Try volta
  if command -v volta >/dev/null 2>&1; then
    volta install node@$REQUIRED_NODE_MAJOR || true
    export PATH="$HOME/.volta/bin:$PATH"
    if node -v | grep -q "^v$REQUIRED_NODE_MAJOR"; then
      echo "✔ Node.js $REQUIRED_NODE_MAJOR.x via Volta"
      return 0
    fi
  # Try to setup Volta first
  if setup_volta; then
    echo "▶ Using Volta to install Node $NEEDED_NODE_VERSION"
    volta install "node@$NEEDED_NODE_VERSION" || {
      echo "⚠️ Volta install of Node failed"
    }
  fi
  
  # If we still don't have the right Node version, try NVM if available
  if ! have_node && command -v nvm >/dev/null 2>&1; then
    echo "▶ Trying to use NVM to install Node $NEEDED_NODE_VERSION"
    nvm install "$NEEDED_NODE_VERSION" && nvm use "$NEEDED_NODE_VERSION"
  fi
  
  # As a last resort, if we're in a GitHub Codex environment, create a NODE_BIN variable
  # that will run node with the correct version
  if ! have_node; then
    echo "⚠️ Could not install correct Node version - setting up NODE_BIN wrapper"
    NODE_BIN="npx node@$NEEDED_NODE_VERSION"
    export NODE_BIN
    echo "Using NODE_BIN=$NODE_BIN as a fallback"
  fi
fi

# Show Node/NPM versions (if available)
node -v || echo "Node version command failed"
npm -v || echo "NPM version command failed"

# -- npm deps (skip when already up-to-date) ------------------------------
# More portable stat command that works in both Linux and macOS
check_modules_newer() {
  if [[ "$(uname)" == "Darwin" ]]; then
    # macOS syntax
    local node_mod_time=$(stat -f %m node_modules 2>/dev/null || echo 0)
    local lock_time=$(stat -f %m package-lock.json 2>/dev/null || echo 999999999999)
  else
    # Linux syntax
    local node_mod_time=$(stat -c %Y node_modules 2>/dev/null || echo 0)
    local lock_time=$(stat -c %Y package-lock.json 2>/dev/null || echo 999999999999)
  fi
  
  [[ $node_mod_time -ge $lock_time ]]
}

if [[ -d node_modules ]] && check_modules_newer; then
  echo "▶ node_modules is current – skipping npm ci"
else
  echo "▶ Installing dependencies..."
  
  # Check if package-lock is in sync with package.json
  if npm ci --dry-run 2>&1 | grep -q "can only install packages when your package.json and package-lock.json.*are in sync"; then
    echo "⚠️ package.json and package-lock.json are out of sync. Updating lock file first..."
    # Only update the lock file without installing
    npm install --package-lock-only --no-audit --fund=false
  fi
  
  # Try npm ci first (preferred for CI environments)
  npm ci --no-audit --fund=false --progress=false --omit=optional || {
    echo "⚠️ npm ci failed, falling back to npm install"
    
    # Try full npm install as fallback
    npm install --no-audit --fund=false --progress=false --omit=optional || {
      echo "❌ Dependency installation failed. Continuing with limited functionality."
    }
  }
fi

# -- Optional Python deps -------------------------------------------------
if [[ -f requirements.txt && "${SKIP_PYTHON:-0}" != 1 ]]; then
  echo "▶ Installing Python deps…"
  # Try multiple Python commands as they may differ across environments
  python -m pip install --quiet -r requirements.txt 2>/dev/null || \
  python3 -m pip install --quiet -r requirements.txt 2>/dev/null || \
  pip install --quiet -r requirements.txt 2>/dev/null || \
  pip3 install --quiet -r requirements.txt 2>/dev/null || \
  echo "⚠️ Could not install Python dependencies. Continuing without them."
fi

# -- Ensure proper Git hooks are set up ----------------------------------
if [[ -f scripts/setup-hooks.sh && -x scripts/setup-hooks.sh ]]; then
  echo "▶ Setting up Git hooks"
  bash scripts/setup-hooks.sh || echo "⚠️ Git hook setup failed, but continuing"
fi

# -- Memory system verification -----------------------------------------
if command -v node >/dev/null && [[ -f scripts/memory-check.ts ]]; then
  echo "▶ Verifying memory system integrity"
  ${NODE_BIN:-node} --loader ts-node/esm scripts/memory-check.ts || \
  echo "⚠️ Memory check failed. You may need to run 'npm run memory rebuild'"
fi

echo "✅ setup_dev.sh done – env ready."
echo "   npm run dev        # Start development server"
echo "   npm run mem-update # Update memory logs"
echo "   npm run backtest   # Run backtesting"
echo "   npm run test       # Run tests"

# Exit with success regardless of individual command failures
exit 0
