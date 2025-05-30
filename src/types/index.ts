import type { MarketSentimentAnalysisOutput as AiSentimentOutput } from '@/ai/flows/market-sentiment-analysis';

// Removed detailed indicators as basic free APIs don't usually provide them.
export interface CoinData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number; // percentage
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  lastUpdated: string; // ISO string
  image: string; // URL for the coin image
  status: 'fresh' | 'cached_error' | 'error' | 'loading';
  ma50?: number;
  ma200?: number;
  maCrossover?: 'bullish' | 'bearish';
  ema20?: number;
  ema50?: number;
  ema200?: number;
  volumeProfilePrice?: number;
  rsi14?: number;
  signal?: 'buy' | 'sell' | 'hold';
}

export interface StockData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change: number; // absolute change
  changePercent: number;
  volume: number;
  lastUpdated?: string; // ISO string
  status: 'fresh' | 'cached_error' | 'error' | 'loading';
  rsi14?: number;
  signal?: 'buy' | 'sell' | 'hold';
}

export interface TrendingCoinItem {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string; // image URL from CoinGecko trending
  price_btc?: number;
}

export interface TrendingData {
  coins: TrendingCoinItem[];
  status: 'fresh' | 'cached_error' | 'error' | 'loading';
}

export interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp?: string; // Unix timestamp string
  status: 'fresh' | 'cached_error' | 'error' | 'loading';
}

export interface MarketSentimentAnalysisOutput extends AiSentimentOutput {}

export interface AppData {
  btc: CoinData | null;
  eth: CoinData | null;
  spy: StockData | null;
  spx: StockData | null;
  dxy: StockData | null;
  us10y: StockData | null;
  trending: TrendingData | null;
  fearGreed: FearGreedData | null;
  aiSentiment: MarketSentimentAnalysisOutput | null;
  lastUpdated: string | null; // Timestamp of the last successful simulated fetch
  globalError: string | null; // For errors fetching the main /api/dashboard
  loading: boolean; // Global loading state for the initial "simulated" fetch
  loadingAi: boolean;
}

export interface TradeSignal {
  asset: 'BTC';
  interval: '5m';
  type: 'BUY' | 'SELL';
  reason: string;
  price: number;
  ts: number;
}
