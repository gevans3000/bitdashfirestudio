# BitDash Firestudio - Trading Tasks

> **Note:** Focused on essential trading features for Bitcoin and SPX/SPY

## Core Trading Features

### 1. Price Data
- [x] BTC/USD price chart
- [x] SPX/SPY price chart
- [ ] Add 50/200 MA crossovers
- [ ] Show volume profile

### 2. Technical Indicators
- [ ] RSI (14 period)
- [ ] MACD
- [ ] Support/Resistance levels
- [ ] Simple moving averages (50, 200)

### 3. Trading Signals
- [ ] Basic buy/sell signals
- [ ] Simple risk/reward calculator
- [ ] Basic position sizing

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
