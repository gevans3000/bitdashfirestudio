# TASKS2.md - Advanced Bitcoin Trading Agents

> Granular tasks for implementing enhanced trading agents in BitDash Firestudio.
> Each task includes specific commits to track progress.

---

## 1. SentimentAnalyzer Agent

### 1.1 Sentiment Agent Setup
- [ ] **Task**: Define SentimentAnalyzer type in agent.ts
- **Before**: `git rev-parse HEAD`
- **After**: [COMMIT_HASH]
- **Description**: Add 'SentimentAnalyzer' to AgentRole type in `/types/agent.ts`

### 1.2 Sentiment Data Types
- [ ] **Task**: Create sentiment data interfaces
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Define interfaces for Fear & Greed Index, social sentiment in `/types/sentiment.ts`

### 1.3 Sentiment Data Fetching
- [ ] **Task**: Implement Fear & Greed API client
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/data/getFearGreedIndex.ts` to fetch from alternative.me API

### 1.4 Twitter/Social Sentiment
- [ ] **Task**: Implement lightweight social sentiment collection
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/data/getSocialSentiment.ts` using free API endpoints

### 1.5 SentimentAnalyzer Implementation
- [ ] **Task**: Create SentimentAnalyzer agent
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Implement `/lib/agents/SentimentAnalyzer.ts` with 5-minute polling

### 1.6 Sentiment UI Component
- [ ] **Task**: Create sentiment gauge component
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Build `/components/indicators/SentimentGauge.tsx` showing sentiment score

### 1.7 Sentiment Signal Integration
- [ ] **Task**: Update SignalGenerator to include sentiment
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Modify `/lib/agents/SignalGenerator.ts` to factor sentiment into signals

### 1.8 Sentiment Agent Tests
- [ ] **Task**: Add tests for SentimentAnalyzer
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/__tests__/agents/SentimentAnalyzer.test.ts`

---

## 2. CorrelationTracker Agent

### 2.1 Correlation Agent Setup
- [ ] **Task**: Define CorrelationTracker in agent types
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Add 'CorrelationTracker' to AgentRole type in `/types/agent.ts`

### 2.2 Correlation Data Types
- [ ] **Task**: Create correlation data interfaces
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Define interfaces for asset correlations in `/types/correlation.ts`

### 2.3 SPX Data Integration
- [ ] **Task**: Implement SPX/SPY data fetcher
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/data/getSPXData.ts` using Yahoo Finance API

### 2.4 DXY Data Integration
- [ ] **Task**: Implement DXY data fetcher
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/data/getDXYData.ts` using FRED or Yahoo Finance API

### 2.5 Gold Data Integration
- [ ] **Task**: Implement Gold (XAU) data fetcher
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/data/getGoldData.ts` using free metal price API

### 2.6 Correlation Calculation Function
- [ ] **Task**: Create correlation calculation utility
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Implement `/lib/indicators/correlation.ts` for Pearson correlation

### 2.7 CorrelationTracker Implementation
- [ ] **Task**: Create CorrelationTracker agent
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Implement `/lib/agents/CorrelationTracker.ts`

### 2.8 Correlation UI Component
- [ ] **Task**: Create correlation heatmap component
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Build `/components/indicators/CorrelationHeatmap.tsx`

### 2.9 Correlation Signal Integration
- [ ] **Task**: Update SignalGenerator for correlations
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Modify SignalGenerator to use correlation divergence as signal

### 2.10 Correlation Agent Tests
- [ ] **Task**: Add tests for CorrelationTracker
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/__tests__/agents/CorrelationTracker.test.ts`

---

## 3. MarketContextAgent

### 3.1 Market Context Agent Setup
- [ ] **Task**: Define MarketContextAgent in agent types
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Add 'MarketContextAgent' to AgentRole type

### 3.2 Market Regime Types
- [ ] **Task**: Create market regime interfaces
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Define interfaces for market regimes in `/types/marketContext.ts`

### 3.3 Volatility Calculation
- [ ] **Task**: Implement volatility indicators
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/indicators/volatility.ts` for ATR, std dev calculations

### 3.4 Trend Strength Indicators
- [ ] **Task**: Create trend strength functions
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Implement ADX and other trend indicators in `/lib/indicators/trendStrength.ts`

### 3.5 Market Regime Classification
- [ ] **Task**: Implement regime classification logic
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/indicators/marketRegime.ts` to classify current market

### 3.6 MarketContextAgent Implementation
- [ ] **Task**: Create MarketContextAgent
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Implement `/lib/agents/MarketContextAgent.ts`

### 3.7 Market Context UI Component
- [ ] **Task**: Create market context indicator
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Build `/components/indicators/MarketRegime.tsx`

### 3.8 Adaptive Signal Rules
- [ ] **Task**: Update SignalGenerator for market regimes
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Modify SignalGenerator to adapt rules based on market context

### 3.9 Market Context Agent Tests
- [ ] **Task**: Add tests for MarketContextAgent
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/__tests__/agents/MarketContextAgent.test.ts`

---

## 4. TradePlanAgent

### 4.1 TradePlan Agent Setup
- [ ] **Task**: Define TradePlanAgent in agent types
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Add 'TradePlanAgent' to AgentRole type

### 4.2 Trade Plan Data Types
- [ ] **Task**: Create trade plan interfaces
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Define interfaces for positions, risk in `/types/tradePlan.ts`

### 4.3 Position Sizing Logic
- [ ] **Task**: Implement position sizing calculator
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/tradePlan/positionSize.ts` for risk-based sizing

### 4.4 Stop Loss Calculator
- [ ] **Task**: Create stop loss determination logic
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Implement `/lib/tradePlan/stopLoss.ts` using ATR and support/resistance

### 4.5 Take Profit Calculator
- [ ] **Task**: Build take profit logic
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/tradePlan/takeProfit.ts` with R:R ratios

### 4.6 TradePlanAgent Implementation
- [ ] **Task**: Create TradePlanAgent
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Implement `/lib/agents/TradePlanAgent.ts`

### 4.7 Trade Plan UI Components
- [ ] **Task**: Create position management UI
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Build `/components/tradePlan/PositionManager.tsx`

### 4.8 Risk Dashboard
- [ ] **Task**: Create risk visualization component
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Build `/components/tradePlan/RiskDashboard.tsx`

### 4.9 Trade Plan Agent Tests
- [ ] **Task**: Add tests for TradePlanAgent
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/__tests__/agents/TradePlanAgent.test.ts`

---

## 5. WhaleActivityMonitor

### 5.1 Whale Activity Agent Setup
- [ ] **Task**: Define WhaleActivityMonitor in agent types
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Add 'WhaleActivityMonitor' to AgentRole type

### 5.2 Whale Activity Data Types
- [ ] **Task**: Create whale activity interfaces
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Define interfaces for large transactions in `/types/whaleActivity.ts`

### 5.3 Whale Transaction API Client
- [ ] **Task**: Implement whale transaction data fetcher
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/data/getWhaleTransactions.ts` using free blockchain API

### 5.4 Exchange Flow API Client
- [ ] **Task**: Implement exchange inflow/outflow fetcher
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/data/getExchangeFlows.ts` using available APIs

### 5.5 Whale Alert Processor
- [ ] **Task**: Create alert threshold logic
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Implement `/lib/whaleActivity/alertThresholds.ts`

### 5.6 WhaleActivityMonitor Implementation
- [ ] **Task**: Create WhaleActivityMonitor agent
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Implement `/lib/agents/WhaleActivityMonitor.ts`

### 5.7 Whale Activity UI Component
- [ ] **Task**: Create whale transaction feed
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Build `/components/indicators/WhaleTransactions.tsx`

### 5.8 Exchange Flow UI Component
- [ ] **Task**: Create exchange flow visualization
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Build `/components/indicators/ExchangeFlows.tsx`

### 5.9 Whale Signal Integration
- [ ] **Task**: Update SignalGenerator for whale activity
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Modify SignalGenerator to factor in whale movements

### 5.10 Whale Activity Agent Tests
- [ ] **Task**: Add tests for WhaleActivityMonitor
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/__tests__/agents/WhaleActivityMonitor.test.ts`

---

## 6. PatternRecognitionAgent

### 6.1 Pattern Recognition Agent Setup
- [ ] **Task**: Define PatternRecognitionAgent in agent types
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Add 'PatternRecognitionAgent' to AgentRole type

### 6.2 Pattern Data Types
- [ ] **Task**: Create chart pattern interfaces
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Define interfaces for patterns in `/types/chartPatterns.ts`

### 6.3 Double Top/Bottom Detection
- [ ] **Task**: Implement double top/bottom recognition
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/patterns/doublePatterns.ts`

### 6.4 Head & Shoulders Detection
- [ ] **Task**: Implement head & shoulders recognition
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/patterns/headAndShoulders.ts`

### 6.5 Triangle Pattern Detection
- [ ] **Task**: Implement triangle pattern recognition
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/patterns/triangles.ts` for ascending/descending triangles

### 6.6 PatternRecognitionAgent Implementation
- [ ] **Task**: Create PatternRecognitionAgent
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Implement `/lib/agents/PatternRecognitionAgent.ts`

### 6.7 Pattern Annotation Component
- [ ] **Task**: Create pattern annotation overlay
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Build `/components/charts/PatternAnnotation.tsx`

### 6.8 Pattern List Component
- [ ] **Task**: Create pattern detection list
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Build `/components/indicators/PatternList.tsx`

### 6.9 Pattern Signal Integration
- [ ] **Task**: Update SignalGenerator for patterns
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Modify SignalGenerator to use detected patterns

### 6.10 Pattern Recognition Agent Tests
- [ ] **Task**: Add tests for PatternRecognitionAgent
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/__tests__/agents/PatternRecognitionAgent.test.ts`

---

## 7. PriceActionAgent

### 7.1 Price Action Agent Setup
- [ ] **Task**: Define PriceActionAgent in agent types
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Add 'PriceActionAgent' to AgentRole type

### 7.2 Candlestick Pattern Types
- [ ] **Task**: Create candlestick pattern interfaces
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Define interfaces for candle patterns in `/types/candlePatterns.ts`

### 7.3 Pin Bar Detection
- [ ] **Task**: Implement pin bar recognition
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/priceAction/pinBars.ts`

### 7.4 Engulfing Pattern Detection
- [ ] **Task**: Implement engulfing pattern recognition
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/priceAction/engulfingPatterns.ts`

### 7.5 Doji Detection
- [ ] **Task**: Implement doji recognition
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/priceAction/dojis.ts`

### 7.6 PriceActionAgent Implementation
- [ ] **Task**: Create PriceActionAgent
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Implement `/lib/agents/PriceActionAgent.ts`

### 7.7 Candle Pattern Highlight Component
- [ ] **Task**: Create pattern highlight overlay
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Build `/components/charts/CandlePatternHighlight.tsx`

### 7.8 Price Action Signal Component
- [ ] **Task**: Create price action signal list
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Build `/components/indicators/PriceActionSignals.tsx`

### 7.9 Price Action Signal Integration
- [ ] **Task**: Update SignalGenerator for price action
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Modify SignalGenerator to incorporate candle patterns

### 7.10 Price Action Agent Tests
- [ ] **Task**: Add tests for PriceActionAgent
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/__tests__/agents/PriceActionAgent.test.ts`

---

## 8. Agent Orchestration & Integration

### 8.1 Update Orchestrator
- [ ] **Task**: Extend Orchestrator for new agents
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Update `/lib/agents/Orchestrator.ts` to handle new agent types

### 8.2 Message Bus Extension
- [ ] **Task**: Extend message types for new data
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Update message schemas in `/types/agent.ts`

### 8.3 Dashboard Integration
- [ ] **Task**: Create unified agent dashboard
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Build `/components/AgentDashboard.tsx` with all indicators

### 8.4 Signal Priority System
- [ ] **Task**: Implement weighted signal priority
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/lib/signals/priorityCalculator.ts`

### 8.5 Combined Backtest
- [ ] **Task**: Update Backtester for all agents
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Extend `/lib/agents/Backtester.ts` for comprehensive testing

### 8.6 Performance Optimization
- [ ] **Task**: Optimize agent performance
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Review and optimize memory/CPU usage of all agents

### 8.7 Documentation Update
- [ ] **Task**: Update AGENTS.md with new capabilities
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Document all new agents and their integration

---

## 9. Evaluation & Refinement

### 9.1 Historical Backtest
- [ ] **Task**: Run comprehensive backtest with all agents
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Execute backtests for 90-day history with all signals

### 9.2 Signal Quality Analysis
- [ ] **Task**: Analyze signal accuracy metrics
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/scripts/analyzeSignalQuality.ts`

### 9.3 Agent Contribution Analysis
- [ ] **Task**: Measure each agent's contribution
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Create `/scripts/agentContributionReport.ts`

### 9.4 Parameter Optimization
- [ ] **Task**: Fine-tune agent parameters
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Optimize all thresholds in `/config/signals.json`

### 9.5 Final Documentation
- [ ] **Task**: Complete system documentation
- **Before**: [COMMIT_HASH]
- **After**: [COMMIT_HASH]
- **Description**: Finalize all documentation with performance metrics

---

> Each task should be committed with message format: `feat(agent): {task description} (#task-number)`
> After each commit, the AutoTaskRunner will execute tests and update logs automatically.
> To track progress, the actual commit hash should replace [COMMIT_HASH] after task completion.
