#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Fast, idempotent bootstrap for Codex / CI / local dev
# ---------------------------------------------------------------------------
set -euo pipefail

# -- Self-healing exec bit (kept)
[[ -x "$0" ]] || { chmod +x "$0"; }

echo "▶ Bootstrapping dev environment..."

# -- Node (skip if already OK) -------------------------------------------
NEEDED_NODE_VERSION="${NODE_VERSION:-$(cat .nvmrc 2>/dev/null || echo 18)}"

have_node() {
  command -v node >/dev/null &&
  [[ "$(node -v)" == v${NEEDED_NODE_VERSION%%.*}* ]]
}

if have_node; then
  echo "▶ Detected Node $(node -v) – reuse"
else
  echo "▶ Installing Node $NEEDED_NODE_VERSION via Volta (fast binary)"
  curl -sSf https://get.volta.sh | bash -s -- --skip-setup
  # Safely initialize VOLTA_HOME
  VOLTA_HOME="${HOME}/.volta"
  export VOLTA_HOME
  export PATH="${VOLTA_HOME}/bin:$PATH"
  # Allow volta command to fail without stopping the script
  volta install "node@$NEEDED_NODE_VERSION" || {
    echo "▶ Volta installation failed, trying direct node use"
    # Try to use any available node
    command -v node >/dev/null || {
      echo "❌ No Node.js available. Proceeding with limited functionality."
    }
  }
fi

node -v ; npm -v

# -- npm deps (skip when already up-to-date) ------------------------------
if [[ -d node_modules ]] && \
   [[ $(stat -c %Y node_modules) -ge $(stat -c %Y package-lock.json) ]]; then
  echo "▶ node_modules is current – skipping npm ci"
else
  echo "▶ Installing dependencies via npm ci (quiet mode)…"
  npm ci --silent --no-audit --fund=false --progress=false --omit=optional
fi

# -- Optional Python deps -------------------------------------------------
if [[ -f requirements.txt && "${SKIP_PYTHON:-0}" != 1 ]]; then
  echo "▶ Installing Python deps…"
  python -m pip install --quiet -r requirements.txt
fi

echo " setup_dev.sh done – env ready."
echo "   npm run lint   # ESLint"
echo "   npm run backtest"
echo "   npm run commitlog"
