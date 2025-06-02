# BitDash Firestudio – TASKS.md

> **Goal:** Optimize 5-minute BTC scalping (with SPX context) through small, atomic tasks Codex can execute autonomously.

---
- [x] **Task 0:** Ensure all dev dependencies are installed locally and scripts pass after `npm ci`.
  - Attempted `npm ci` but installation failed in the offline Codex environment.
    Lint, test and backtest commands logged missing binaries.

## Workflow
1. Run `npm ci` once at session start (may fail offline).
2. The AutoTaskRunner reads the first unchecked task below.
3. Implement it with minimal edits.
4. Run `npm run lint`, `npm run test` and `npm run backtest`.
5. Mark the task `[x]`.
6. Update `signals.json` with `last_task_completed` and commit.
7. Commit header `Task <number>:` with a 333-token body (`What I did` / `What's next`).
8. Run `npm run commitlog`.
9. If any command fails, write `/logs/block-<task>.txt`, set `error_flag` in `signals.json` and halt.

## 🚀 Top-Priority Enhancements

### ✅ Immediate Scalping Data

- [x] **Binance Order-Book Depth**
  - [x] Real-time depth widget (bid/ask imbalance)
  - [x] Highlight significant buy/sell walls
- [x] **Volume-Spike Detection**
  - [x] Color-coded spike overlay on chart
  - [x] Threshold alerts for abnormal volume
- [x] **VWAP (Volume-Weighted Avg Price)**
  - [x] Real-time VWAP calculation
  - [x] Price-to-VWAP deviation indicator (%)

### 📊 Advanced Technical Indicators

- [x] **Stochastic RSI**
  - [x] Overbought/oversold alerts (20 / 80)
- [x] **Order-Flow Analysis (Cumulative Delta)**
  - [x] Real-time delta visual
  - [x] Buy/Sell pressure meter

### 📅 Session & Time Awareness

- [x] **Market-Session Timers**
  - [x] NYSE/NASDAQ open/close countdown
  - [x] Asian / EU session highlights

---
### 🧩 Low-/No-cost Scalper Add-ons

- [x] **Previous Day H/L & VWAP Bands**
  - [x] Fetch prior-day OHLCV from Binance
  - [x] Plot yesterday's high, low and VWAP bands
- [ ] **Heat-Map of Bid/Ask Walls**
  - [x] Build order-book heat map from depth stream
  - [ ] Highlight large resting orders
- [ ] **Realtime Liquidation Feed**
  - [ ] Display Bybit liquidation clusters
- [ ] **Cumulative Open-Interest Delta (1 h)**
  - [ ] Chart 1 h open-interest delta to confirm moves
- [ ] **Funding-Rate Countdown**
  - [ ] Timer until next funding print
- [ ] **Volatility "Squeeze" Meter (BB Width %)**
  - [ ] Alert when BB width drops below threshold
- [ ] **High-Volume Node Proximity**
  - [ ] Show distance to nearest volume-profile peak
- [ ] **MTF Trend Alignment**
  - [ ] Compare 5 m trend with 1 h and 4 h EMAs
- [ ] **Economic Calendar "Now" Bar**
  - [ ] Flag upcoming high-impact events
- [ ] **Google Trends 1-day Spike**
  - [ ] Notify on sudden retail search spikes
- [ ] **Mempool Fee Pressure**
  - [ ] Integrate mempool fee data for sentiment
- [ ] **Risk/Position-Size Calculator**
  - [ ] Quick lot-sizing based on stop distance
- [ ] **Session Stats Panel**
  - [ ] Track running P&L, hit rate and average R:R

## 🔥 Core Trading Features

### 📈 Price Data & Chart Enhancements

- [x] BTC/USD 5-minute price chart
- [x] SPX/SPY price chart
- [x] EMA crossovers (10/20/50/200)
- [x] Bollinger Bands (20, 2)
- [x] Volume-profile visualization
- [x] Ichimoku Cloud overlay

### 🛠 Technical Indicators

- [x] RSI (14)
- [x] MACD (12, 26, 9)
- [x] ATR (14) for position sizing

### 💧 Volume & Liquidity

- [x] BTC funding-rates widget
- [x] On-chain BTC txn count (CoinGecko)
- [ ] SPY volume (Yahoo Finance)

### 🎯 Sentiment & Correlation

- [x] Crypto Fear-&-Greed Index
- [ ] Short-term Crypto-Twitter sentiment
- [ ] Real-time liquidations & open interest
- [ ] Rolling BTC / SPX correlation (1 h)

### 📊 Macro Indicators

- [x] 10-Year Treasury Yield
- [ ] Fed-funds-rate schedule
- [ ] Economic-event calendar

---

## 📚 Data-Management Layer

### ⚙️ Data Fetchers

- [ ] Binance WS (order-book & OHLCV)
- [ ] CoinGecko (historical BTC)
- [ ] Yahoo Finance (SPX/SPY/VIX/DXY)
- [ ] FRED (macro series)

### 🔄 Caching & Rate-Limiting

- [ ] Cache REST calls 15-30 s
- [ ] Enforce ≤ 5 calls/min/endpoint

---

## 🚨 Alerts & Notifications

- [ ] Toast notifications on signals
- [ ] Custom alert-config panel
- [ ] Integrated quick-entry trade journal
- [ ] Historical signal annotations on chart

---

## 🧪 Testing & Validation

### 🔍 Indicator Tests

- [ ] Unit tests for each indicator
- [ ] Validate results on historical data

### 📈 Backtesting & Analytics

- [ ] Real-time strategy backtester (90 days)
  - [ ] Win-rate, profit-factor, drawdown

---

## 📖 Documentation & Configuration

- [ ] API docs
- [ ] User guide
- [ ] Dev setup guide
- [ ] Threshold & rule config (`signals.json`)
- [ ] Document every config param

---

## 🖥 UI Enhancements

- [ ] Proximity indicators (key levels, pivots, VWAP)
- [ ] Customisable TradingView widget
- [ ] One-click indicator toggles

---

## ⚡ Performance & Monitoring

- [ ] Real-time strategy-performance tracker
- [ ] Monitor data latency & system load

---

## 🎯 Definition of Done

- All priority widgets & indicators visible and functional.
- BUY/SELL signals render in UI ≤ 2 s after candle close.
- Backtest & test logs saved under `/logs`.
- Each completed task auto-committed with passing tests, `Task <number>:` message and updated `signals.json`.
