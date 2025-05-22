# BitDash Firestudio

> AI-Powered Bitcoin & SPX Trading Assistant

## Overview

BitDash Firestudio is an intelligent trading assistant that helps you identify optimal entry and exit points for Bitcoin and S&P 500 (SPX) investments. The application combines real-time market data with AI-powered analysis to provide actionable trading insights.

### Key Features

- **Bitcoin & SPX Analysis**: Real-time price tracking and technical indicators
- **AI-Powered Signals**: Machine learning models identify potential buy/sell opportunities
- **Market Sentiment Analysis**: AI-driven sentiment scoring for better decision making
- **Correlation Tracking**: Monitor relationships between crypto and traditional markets
- **Custom Alerts**: Set up personalized trading signals and notifications

## Technical Stack

- **Next.js 14+** with App Router for optimal performance
- **Firebase** for authentication and real-time data
- **AI/ML Integration** for predictive analytics
- **TypeScript** for type-safe development
- **Tailwind CSS** + **Shadcn/ui** for modern, responsive UI
- **Real-time Data** from multiple financial APIs

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bitdash-firestudio.git
   cd bitdash-firestudio
   ```

2. Copy the example environment file and update with your API keys:
   ```bash
   cp .env.example .env.local
   ```
   
   You'll need to obtain API keys for:
   - [FRED API](https://fred.stlouisfed.org/docs/api/api_key.html) (required for DXY and Treasury data)
   - [Financial Modeling Prep](https://site.financialmodelingprep.com/developer) (required as fallback data source)

3. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```

## Data Sources & Reliability

BitDash Firestudio uses multiple data sources to ensure accuracy and reliability:

### US Dollar Index (DXY)
- **Primary Source**: Federal Reserve Economic Data (FRED)
- **Fallback**: Financial Modeling Prep
- **Validation**: Values are checked against expected ranges (70-120)
- **Update Frequency**: Every 5 minutes

### US 10-Year Treasury Yield
- **Primary Source**: Federal Reserve Economic Data (FRED)
- **Fallback**: Financial Modeling Prep
- **Validation**: Values are checked for reasonableness (0-20%)
- **Update Frequency**: Every 5 minutes

### Data Quality Indicators
Each data point includes a quality indicator:
- 🟢 **High Confidence**: Data from primary source within expected range
- 🔵 **Good**: Data from fallback source within expected range
- 🟡 **Fair**: Data outside normal range but still valid
- 🔴 **Error**: Unable to fetch valid data from any source

## How It Works

BitDash Firestudio analyzes multiple market factors to provide trading signals:

1. **Price Action**: Tracks Bitcoin and SPX price movements
2. **Market Indicators**: Monitors key technical indicators (RSI, MACD, etc.)
3. **Sentiment Analysis**: Evaluates market sentiment using AI
4. **Correlation**: Analyzes relationships between different asset classes
5. **Signals**: Generates buy/sell recommendations based on the analysis

## Setup

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Set up environment variables (copy `.env.example` to `.env.local`)

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Disclaimer

BitDash Firestudio provides information and analysis for educational purposes only. It does not constitute financial advice. Always conduct your own research and consider consulting with a qualified financial advisor before making investment decisions. Cryptocurrency and stock market investments involve substantial risk of loss.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Update the values in `.env.local` with your Firebase config.

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
.
├── app/                    # App router pages and layouts
├── components/             # Reusable UI components
│   ├── ui/                 # Shadcn/ui components
│   └── shared/             # Custom shared components
├── lib/                    # Utility functions and configs
│   └── firebase/           # Firebase configuration
├── public/                 # Static assets
├── styles/                 # Global styles
└── types/                  # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Documentation](https://ui.shadcn.com/docs)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
