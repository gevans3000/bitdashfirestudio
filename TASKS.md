# BitDash Firestudio – TASKS.md

> **Goal:** Optimize 5-minute BTC scalping (with SPX context) through small, atomic tasks Codex can execute autonomously.

---

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

## 🔥 Core Trading Features

### 📈 Price Data & Chart Enhancements
- [x] BTC/USD 5-minute price chart
- [x] SPX/SPY price chart
- [ ] EMA crossovers (10/20/50/200)
- [ ] Bollinger Bands (20, 2)
- [ ] Volume-profile visualization
- [ ] Ichimoku Cloud overlay

### 🛠 Technical Indicators
- [ ] RSI (14)
- [ ] MACD (12, 26, 9)
- [x] ATR (14) for position sizing

### 💧 Volume & Liquidity
- [ ] BTC funding-rates widget
- [ ] On-chain BTC txn count (CoinGecko)
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
- Each completed task auto-committed with passing tests and Conventional-Commit message.
