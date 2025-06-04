# BitDash Firestudio

> Simple Bitcoin & SPX Trading Dashboard

## Overview

Personal dashboard for tracking Bitcoin and SPX/SPY price action and technical indicators to inform trading decisions.

### Features

- BTC/USD and SPX/SPY price charts
- Key technical indicators (RSI, Moving Averages, MACD)
- Clean, focused interface

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Lightweight charting
- Tailwind CSS
- All backend logic handled directly by Next.js API routes

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/bitdash-firestudio.git
   cd bitdash-firestudio
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up git hooks (pre-commit and post-commit):
   ```bash
   npm run setup
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open [http://localhost:3000](http://localhost:3000)
2. View price charts for BTC and SPX/SPY
3. Monitor technical indicators

### Macro Data Refresh Demo

For a simple example that fetches macro data only when you click refresh, visit
`/refresh-demo` after starting the development server. This page displays the
current US Dollar Index (DXY) and 10-Year Treasury Yield using the free FRED
API through the project's API routes. DXY data is cached for 15 minutes on the
server to respect rate limits. Most other API calls are cached for at least one
minute via `src/lib/fetchCache.ts` so repeated requests don't hammer upstream
services.

## Data Sources

- Price data from public APIs
- Updates every 5 minutes
- Simple error handling and retries

## Project Structure

```
/app
  /dashboard      # Main dashboard page
  /api           # API routes
/components
  /charts        # Chart components
  /indicators    # Technical indicators
/lib
  /data          # Data fetching
  /utils         # Helper functions
/public         # Static assets
```

## Configuration


## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT

## Backtest Results

Using 5-minute BTC data from CoinGecko (90 days) the strategy achieved roughly a 55% win rate on historical candles. Run `npm run backtest` to reproduce.

## Continuous Integration

GitHub Actions run lint, tests, the backtest and `npm run mem-check` on every pull request to ensure memory files stay in sync with Git history.

## Codex Workflow

See `docs/CODEX_WORKFLOW.md` for tips on using the Codex agent effectively.
Generate a recent commit summary anytime with:

```bash
npm run commitlog
```

### Recommended Workflow

1. Run `npm ci` once when you start a session.
2. Review `memory.log` for the latest summary line.
3. Open `TASKS.md` and complete the next task.
4. After each commit `memory.log`, `logs/commit.log` and `context.snapshot.md` are refreshed automatically by the `post-commit` hook. The hook runs `npm run mem-check` after rotating the log and trims `memory.log` to the last 200 entries.
5. When resuming after a break, run `npm run commitlog` to review recent commits.
6. Test and backtest outputs are logged in `logs/`.

## Automation Scripts

| Command | Purpose |
| ------- | ------- |
| `npm run auto` | Execute the AutoTaskRunner to process tasks in `task_queue.json` |
| `npm run commitlog` | Generate `logs/commit.log` from the last entries in `memory.log` |
| `npm run memory` | Manage memory files: rotate, snapshot-rotate, status, grep, update-log, list, diff, json, clean-locks, check, locate, rebuild, sync, snapshot-update |
| `npm run mem-rotate` | Trim `memory.log` to a set number of entries and refresh `logs/commit.log` |
| `npm run mem-check` | Verify memory hashes and snapshot blocks (auto after `mem-rotate`) |
| `npm run mem-diff` | List commit hashes missing from `memory.log` |
| `npm run memgrep` | Search `memory.log` and `context.snapshot.md` for a pattern |
| `npm run clean-locks` | Remove stale `.lock` files across the repository |
| `ts-node scripts/update-snapshot.ts` | Append commit summary and next task to `context.snapshot.md` |
| `ts-node scripts/rebuild-memory.ts [path]` | Rebuild `memory.log` and `context.snapshot.md` from git history |
| `ts-node scripts/memory-json.ts` | Export `memory.log` lines to `memory.json` |
| `ts-node scripts/snapshot-json.ts` | Export `context.snapshot.md` to `snapshot.json` |
| `npm run setup` | Install pre-commit and post-commit hooks for automatic memlog checks |
| `npm run dev-deps` | Install dev dependencies if `node_modules` is missing |
| `bash scripts/check-env.sh` | Verify required CLIs (`next`, `jest`, `ts-node`) are installed |
| `node scripts/try-cmd.js <cmd>` | Run a command only if the binary exists |
| `npm run backtest` | Launch the backtest defined in `scripts/backtest.ts` |

Use `MEM_ROTATE_LIMIT` or a numeric argument to `npm run memory rotate` to change the number of retained lines.

## Rotating Memory Files

Keep `memory.log` and `context.snapshot.md` trimmed so the agent loads quickly:

```bash
npm run mem-rotate   # prune memory.log
npm run snap-rotate  # prune context.snapshot.md
```

A weekly GitHub workflow automatically runs `mem-rotate`, `clean-locks` and `commitlog` to push the
latest trimmed logs. Adjust `MEM_ROTATE_LIMIT` and `SNAP_ROTATE_LIMIT` to control the
number of retained entries. `LOCK_TTL` defines how old `.lock` files must be before
`clean-locks` deletes them.

The memory scripts honor several environment variables:

- `MEM_PATH` – path to `memory.log` (default: `<repo>/memory.log`)
- `SNAPSHOT_PATH` – path to `context.snapshot.md` (default: `<repo>/context.snapshot.md`)
- `MEM_ROTATE_LIMIT` – entries kept by `npm run mem-rotate` (default: `200`)
- `SNAP_ROTATE_LIMIT` – entries kept by `snapshot-rotate` (default: `100`)
- `LOCK_TTL` – milliseconds before `clean-locks` removes `.lock` files (default: `300000`)
- `MEMORY_API_TTL` – seconds API responses are cached (default: `15`)

Example:

```bash
# Rotate custom logs and limits
MEM_PATH=/tmp/mem.log \
SNAPSHOT_PATH=/tmp/snapshot.md \
MEM_ROTATE_LIMIT=300 \
SNAP_ROTATE_LIMIT=150 \
npm run mem-rotate && ts-node scripts/snapshot-rotate.ts
```

## Using Codex with Persistent Memory

See [CODEX_START.md](CODEX_START.md) for full instructions on launching Codex with persistent memory.
