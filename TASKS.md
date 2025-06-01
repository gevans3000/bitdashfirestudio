# BitDash Firestudio - Trading Tasks

> **Note:** Focused on essential trading features for Bitcoin and SPX/SPY

## Top Priority Tasks

- [x] Integrate real-time DXY data from FRED API and cache for 15 minutes
- [ ] Fetch 10-Year Treasury Yield (US10Y) from Treasury/FRED and update hourly
- [x] Display rolling 1-hour BTC vs SPX/SPY correlations, refresh every 5 minutes
- [ ] Add 1-hour ATR widget with alert when ATR > 1.5× 20-day average
- [ ] Create liquidity tab showing BTC funding rates and order book depth
- [ ] Build signal matrix combining volatility, correlation and macro data
- [ ] Backtest signal performance (win rate, profit factor) over 90 days
- [ ] Forecast next 30-day BTC/SPX correlation trend with confidence interval
- [ ] Implement EMA crossovers, Bollinger Bands, ATR and MACD indicators

## Core Trading Features

### 1. Price Data

- [x] BTC/USD price chart
- [x] SPX/SPY price chart
- [ ] Add 50/200 MA crossovers
- [ ] Show volume profile
- [ ] Add exponential moving averages (20, 50, 200-period EMA)
- [ ] Implement Ichimoku Cloud

### 2. Technical Indicators

#### Trend Indicators

- [ ] 20/50/200 EMA crossovers
- [ ] Ichimoku Cloud components
- [ ] Support/Resistance levels

#### Momentum Indicators

- [ ] RSI (14 period)
- [ ] MACD (12,26,9)
- [ ] Stochastic Oscillator

#### Volatility Indicators

- [ ] Bollinger Bands (20,2)
- [ ] ATR (14) for position sizing

### 3. Volume & Liquidity

- [ ] On-chain transaction count & volume (CoinGecko)
- [ ] SPY average daily volume (Yahoo Finance)
- [ ] Order book depth visualization (Binance/IEX)

### 4. Market Sentiment

- [x] Crypto Fear & Greed Index
- [ ] VIX index integration
- [ ] Market breadth indicators

### 5. Correlation Analysis

- [ ] BTC vs SPY/SPX correlation (1h, 1d)
- [ ] Correlation heatmap
- [ ] Decoupling alerts

### 6. Macro Indicators

- [x] 10-Year Treasury Yield
- [ ] Fed funds rate calendar
- [ ] Economic calendar integration

## Development Tasks

### 1. Data Layer

- [ ] Create data fetchers for each source:
  - [ ] CoinGecko (crypto data)
  - [ ] Yahoo Finance (stocks, VIX)
  - [ ] FRED (macro data)
  - [ ] Binance/IEX (order book)
- [ ] Implement caching (15-30s for REST, WebSocket where available)
- [ ] Add rate limiting (5 calls/min per endpoint)

### 2. Indicator Engine

- [ ] Set up technical indicators library
- [ ] Create indicator calculation utilities:
  - [ ] EMA/MA calculations
  - [ ] RSI implementation
  - [ ] MACD implementation
  - [ ] Bollinger Bands
  - [ ] ATR calculation

### 3. Signal Generation

- [ ] Define signal interface
- [ ] Implement signal rules:
  - [ ] EMA crossovers
  - [ ] RSI thresholds
  - [ ] Volume confirmation
  - [ ] Correlation-based signals
- [ ] Create signal history logging

### 4. UI Components

- [ ] Dashboard cards for:
  - [ ] Indicator status
  - [ ] Current signals
  - [ ] Market conditions
- [ ] Enhanced charting:
  - [ ] TradingView widget integration
  - [ ] Custom indicator toggles
  - [ ] Timeframe selection

### 5. Alerting System

- [ ] Toast notifications for signals
- [ ] Signal history panel
- [ ] Custom alert configuration

### 6. Configuration

- [ ] Create config file for thresholds
- [ ] Document all settings
- [ ] Add UI for live adjustments

## Testing & Validation

- [ ] Unit tests for indicators
- [ ] Backtesting framework
- [ ] Historical data validation
- [ ] Performance testing

## Documentation

- [ ] API documentation
- [ ] User guide
- [ ] Development setup guide

## Free APIs & Data Sources

- **CoinGecko**: BTC metrics, on-chain data
- **Binance**: Real-time BTC data
- **Yahoo Finance**: SPY, ^GSPC, VIX, DXY
- **IEX Cloud**: SPY price & volume (50k calls/mo free)
- **FRED**: US10Y, macro data
- **alternative.me**: Crypto Fear & Greed Index
- **TradingView**: Chart widgets

### 4. Data Management

- [ ] Basic error handling
- [ ] Simple caching (5 min)
- [ ] Single data source per asset

## Current Focus

- [ ] Implement RSI indicator
- [ ] Add moving averages
- [ ] Set up basic buy/sell signals

## Recent Updates

- 2025-05-22: Initial dashboard with price charts
- 2025-05-21: Set up basic project structure

### 3. End-to-End Testing

- [ ] Complete trading signal workflow
- [ ] Alert delivery and notifications
- [ ] Data synchronization across components
- [ ] Performance under market volatility

## Deployment & Monitoring

### 1. Trading Infrastructure

- [ ] Set up dedicated market data feeds
- [ ] Implement rate limiting for API calls
- [ ] Configure real-time data processing
- [ ] Set up backup data sources
- [ ] Document trading hours and maintenance windows

### 2. Performance Monitoring

- [ ] Monitor signal accuracy and performance
- [ ] Track latency in data processing
- [ ] Monitor alert delivery success rates
- [ ] Track user engagement with signals
- [ ] Monitor system resource usage during high volatility

## Commit Guidelines

1. **Type**: Use conventional commit types (feat, fix, docs, etc.)
2. **Scope**: Specify the area of changes (auth, ui, db, etc.)
3. **Message**: Clear, concise description of changes
4. **Body**: Detailed explanation (if needed)
5. **Footer**: Reference issues or breaking changes

Example:

```
feat(auth): add Google OAuth login

- Implement Google OAuth provider
- Add login/logout flows
- Update user session management

Closes #123
```
