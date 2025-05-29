# BitDash Firestudio

> Simple Bitcoin & SPX Trading Dashboard

## Overview

Personal dashboard for tracking Bitcoin and SPX/SPY price action and technical indicators to inform trading decisions.

### Features

- BTC/USD and SPX/SPY price charts
- Key technical indicators (RSI, Moving Averages, MACD)
- Simple buy/sell signals
- Clean, focused interface

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Lightweight charting
- Tailwind CSS

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
2. View price charts for BTC and SPX/SPY
3. Monitor technical indicators
4. Use signals to inform trading decisions

### Arbitrage Alerts

1. Start the arbitrage polling service:
   ```bash
   npm run arbitrage-server
   ```
   The server listens on port 3001 by default.
2. Set `NEXT_PUBLIC_ARBITRAGE_API` in your environment if the endpoint differs.
   The dashboard defaults to `http://localhost:3001/api/arbitrage`.
3. Toggle the "Arbitrage Opportunity" card to begin polling every 10 seconds.

### Macro Data Refresh Demo

For a simple example that fetches macro data only when you click refresh, visit
`/refresh-demo` after starting the development server. This page displays the
current US Dollar Index (DXY) and 10-Year Treasury Yield using the free FRED
API through the project's API routes.

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
