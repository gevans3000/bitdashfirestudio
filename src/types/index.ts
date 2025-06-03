
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
  ema10?: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  emaCrossover?: 'bullish' | 'bearish' | 'mixed';
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


export interface AppData {
  btc: CoinData | null;
  eth: CoinData | null;
  spy: StockData | null;
  spx: StockData | null;
  dxy: StockData | null;
  us10y: StockData | null;
  lastUpdated: string | null; // Timestamp of the last successful simulated fetch
  globalError: string | null; // For errors fetching the main /api/dashboard
  loading: boolean; // Global loading state for the initial "simulated" fetch
}

export interface TradeSignal {
  asset: 'BTC';
  interval: '5m';
  type: 'BUY' | 'SELL';
  reason: string;
  price: number;
  ts: number;
}
