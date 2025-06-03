# BitDash Firestudio

> Minimal Bitcoin Trading Dashboard

## Overview

Personal dashboard for tracking Bitcoin price action and a few core technical indicators. The interface was trimmed to focus solely on BTC.

### Features

- BTC/USD price chart with built-in Bollinger Bands and EMAs
- RSI widget
- Real-time trade signal log (EMA crossovers and Bollinger/RSI extremes)
- Clean, simplified interface

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

3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open [http://localhost:3000](http://localhost:3000)
2. View the BTC chart with EMA and Bollinger overlays
3. Monitor the RSI widget and trade signal log

### Macro Data Refresh Demo

For a simple example that fetches macro data only when you click refresh, visit
`/refresh-demo` after starting the development server. This demo remains to
show how data fetching works, even though the main dashboard now focuses
solely on Bitcoin price and trade signals.

## Data Sources

- Bitcoin price and historical candles from public APIs
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
4. After each commit `memory.log` is updated automatically with metadata.
5. When resuming after a break, run `npm run commitlog` to review recent commits.
6. Test and backtest outputs are logged in `logs/`.
