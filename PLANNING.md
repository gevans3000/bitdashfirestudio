# BitDash Firestudio - Trading Dashboard

Last Updated: 2025-05-22

## Overview
Simple dashboard for tracking Bitcoin and SPX/SPY trading opportunities.

## Features
- BTC/USD and SPX/SPY price charts
- Key technical indicators (RSI, Moving Averages, MACD)
- Basic buy/sell signals
- Clean, focused interface

## Tech Stack
- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Data**: Public market APIs
- **Charts**: Lightweight charting library

## Project Structure
```
/app
  /dashboard      # Main dashboard page
  /api           # API routes (if needed)
/components
  /charts        # Chart components
  /indicators    # Technical indicators
/lib
  /data          # Data fetching
  /utils         # Helper functions
/public         # Static assets
```

## Development

### Local Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Open http://localhost:3000

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm start` - Start production server

## Data Flow
1. Fetch price data from public APIs
2. Calculate technical indicators
3. Generate trading signals
4. Display in clean, focused UI

## Future Considerations
- [ ] Add more technical indicators
- [ ] Improve signal accuracy
- [ ] Add basic backtesting

## Dependencies
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lightweight charting library
