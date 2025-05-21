import type { MarketSentimentAnalysisOutput as AiSentimentOutput } from '@/ai/flows/market-sentiment-analysis';

export interface IndicatorValue {
  value: number | string; // SMA, RSI might be numbers, MACD components could be numbers
}

export interface MACDValue {
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBandsValue {
  upper: number;
  middle: number; // SMA20
  lower: number;
  percentB?: number;
  bandwidth?: number;
}

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
  indicators: {
    sma?: IndicatorValue;
    rsi?: IndicatorValue;
    macd?: MACDValue;
    bollingerBands: BollingerBandsValue;
    support: number[];
    resistance: number[];
  };
  status: 'fresh' | 'cached_error' | 'error' | 'loading';
  chartData?: { name: string; price: number; upper: number; middle: number; lower: number }[];
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
}

export interface TrendingCoinItem {
  id: string;
  name: string;
  symbol: string;
  price_btc?: number; // Optional as per spec
  market_cap_rank: number;
  thumb: string; // image URL
}

export interface TrendingData {
  coins: TrendingCoinItem[];
  status: 'fresh' | 'cached_error' | 'error' | 'loading';
}

export interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp?: string; // Add timestamp if available
  status: 'fresh' | 'cached_error' | 'error' | 'loading';
}

export interface MarketSentimentAnalysisOutput extends AiSentimentOutput {}

export interface AppData {
  btc: CoinData | null;
  eth: CoinData | null;
  spy: StockData | null;
  spx: StockData | null;
  trending: TrendingData | null;
  fearGreed: FearGreedData | null;
  aiSentiment: MarketSentimentAnalysisOutput | null;
  lastUpdated: string | null; // Timestamp of the last successful simulated fetch
  globalError: string | null; // For errors fetching the main /api/dashboard
  loading: boolean; // Global loading state for the initial "simulated" fetch
  loadingAi: boolean;
}
