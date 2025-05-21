'use client';

import { useState, useEffect, useCallback, type FC } from 'react';
import Image from 'next/image';
import DashboardHeader from '@/components/DashboardHeader';
import DataCard from '@/components/DataCard';
import ValueDisplay from '@/components/ValueDisplay';
import type { AppData, CoinData, StockData, TrendingData, FearGreedData, MarketSentimentAnalysisOutput as AISentimentData } from '@/types';
import { marketSentimentAnalysis } from '@/ai/flows/market-sentiment-analysis';
import { Button } from '@/components/ui/button';
import { ExternalLink, Bitcoin, TrendingUp, Gauge, Briefcase, Brain, Activity, BarChart3, ChevronsUpDown, Shapes, DollarSign, Percent } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, LineChart, Line, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"


const initialAppData: AppData = {
  btc: null,
  eth: null,
  spy: null,
  spx: null,
  trending: null,
  fearGreed: null,
  aiSentiment: null,
  lastUpdated: null,
  globalError: null,
  loading: true,
  loadingAi: false,
};

// Mock Data (to be replaced by actual API calls to the described Node.js/Express backend)
const getMockData = (): Omit<AppData, 'aiSentiment' | 'lastUpdated' | 'globalError' | 'loading' | 'loadingAi'> => {
  const now = new Date().toISOString();
  const sampleChartData = [
      { name: 'T-4', price: 39800, upper: 41800, middle: 39800, lower: 37800 },
      { name: 'T-3', price: 40100, upper: 42100, middle: 40100, lower: 38100 },
      { name: 'T-2', price: 39950, upper: 41950, middle: 39950, lower: 37950 },
      { name: 'T-1', price: 40200, upper: 42200, middle: 40200, lower: 38200 },
      { name: 'Now', price: 40000, upper: 42000, middle: 40000, lower: 38000 },
  ];

  return {
    btc: {
      id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 40000, change24h: 2.5, volume24h: 50000000000, marketCap: 800000000000, high24h: 41000, low24h: 39000, lastUpdated: now,
      indicators: {
        sma: { value: 39500 }, rsi: { value: 55 }, macd: { macd: 100, signal: 80, histogram: 20 },
        bollingerBands: { upper: 42000, middle: 40000, lower: 38000, percentB: 0.5, bandwidth: 0.1 },
        support: [38500, 37000], resistance: [41500, 43000],
      }, status: 'fresh', chartData: sampleChartData
    },
    eth: {
      id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 2800, change24h: -1.2, volume24h: 30000000000, marketCap: 330000000000, high24h: 2850, low24h: 2750, lastUpdated: now,
      indicators: {
        sma: { value: 2780 }, rsi: { value: 48 }, macd: { macd: -20, signal: -15, histogram: -5 },
        bollingerBands: { upper: 2900, middle: 2800, lower: 2700, percentB: 0.5, bandwidth: 0.07 },
        support: [2700, 2600], resistance: [2900, 3000],
      }, status: 'fresh', chartData: sampleChartData.map(d => ({...d, price: d.price * 0.07, upper: d.upper*0.07, middle: d.middle*0.07, lower: d.lower*0.07}))
    },
    spy: {
      id: 'spy', name: 'SPDR S&P 500 ETF', symbol: 'SPY', price: 450, change: 1.5, changePercent: 0.33, volume: 75000000, lastUpdated: now, status: 'fresh'
    },
    spx: {
      id: 'spx', name: 'S&P 500 Index', symbol: '^GSPC', price: 4500, change: 10, changePercent: 0.22, volume: 2000000000, lastUpdated: now, status: 'fresh'
    },
    trending: {
      coins: [
        { id: 'trending1', name: 'Solana', symbol: 'SOL', market_cap_rank: 5, thumb: 'https://placehold.co/24x24.png', price_btc: 0.0035 },
        { id: 'trending2', name: 'Dogecoin', symbol: 'DOGE', market_cap_rank: 8, thumb: 'https://placehold.co/24x24.png', price_btc: 0.0000025 },
        { id: 'trending3', name: 'Cardano', symbol: 'ADA', market_cap_rank: 7, thumb: 'https://placehold.co/24x24.png', price_btc: 0.000012 },
        { id: 'trending4', name: 'Avalanche', symbol: 'AVAX', market_cap_rank: 10, thumb: 'https://placehold.co/24x24.png', price_btc: 0.0008 },
        { id: 'trending5', name: 'Polkadot', symbol: 'DOT', market_cap_rank: 12, thumb: 'https://placehold.co/24x24.png', price_btc: 0.00018 },
        { id: 'trending6', name: 'Shiba Inu', symbol: 'SHIB', market_cap_rank: 15, thumb: 'https://placehold.co/24x24.png', price_btc: 0.0000000005 },
        { id: 'trending7', name: 'Polygon', symbol: 'MATIC', market_cap_rank: 14, thumb: 'https://placehold.co/24x24.png', price_btc: 0.000022 },
      ], status: 'fresh'
    },
    fearGreed: {
      value: '45', value_classification: 'Fear', timestamp: now, status: 'fresh'
    }
  };
};


const CryptoDashboardPage: FC = () => {
  const [appData, setAppData] = useState<AppData>(initialAppData);

  const fetchData = useCallback(async () => {
    setAppData(prev => ({ ...prev, loading: true, globalError: null }));
    // Simulate API call to the Node.js/Express backend
    // In a real scenario, this would be:
    // try {
    //   const response = await fetch('http://localhost:PORT/api/dashboard'); // PORT is your backend's port
    //   if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    //   const data = await response.json();
    //   setAppData({
    //     btc: data.bitcoin,
    //     eth: data.ethereum,
    //     spy: data.spy,
    //     spx: data.spx,
    //     trending: data.trending,
    //     fearGreed: data.fearGreed,
    //     aiSentiment: null, // AI sentiment fetched separately
    //     lastUpdated: data.lastUpdated || new Date().toISOString(),
    //     globalError: null,
    //     loading: false,
    //     loadingAi: false,
    //   });
    // } catch (error) {
    //   console.error("Failed to fetch dashboard data:", error);
    //   setAppData(prev => ({
    //     ...prev,
    //     loading: false,
    //     globalError: error instanceof Error ? error.message : 'Unknown error fetching data',
    //     // Potentially set individual data items to error status
    //     btc: prev.btc ? {...prev.btc, status: 'error'} : null,
    //     // ... and so on for other data points
    //   }));
    // }

    // Using mock data for now:
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    const mock = getMockData();
    setAppData({
      ...mock,
      aiSentiment: null,
      lastUpdated: new Date().toISOString(),
      globalError: null,
      loading: false,
      loadingAi: false,
    });
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (appData.btc && appData.eth && appData.spy && appData.spx) {
      const runAnalysis = async () => {
        setAppData(prev => ({ ...prev, loadingAi: true }));
        try {
          const sentimentResult = await marketSentimentAnalysis({
            btcPrice: appData.btc!.price,
            ethPrice: appData.eth!.price,
            spyPrice: appData.spy!.price,
            spxPrice: appData.spx!.price,
          });
          setAppData(prev => ({ ...prev, aiSentiment: sentimentResult, loadingAi: false }));
        } catch (error) {
          console.error("Error fetching AI sentiment:", error);
          setAppData(prev => ({ ...prev, aiSentiment: null, loadingAi: false }));
        }
      };
      runAnalysis();
    }
  }, [appData.btc, appData.eth, appData.spy, appData.spx]);

  const navItems = [
    { label: 'Metric' }, { label: 'Bitcoin (BTC)' }, { label: 'Ethereum (ETH)' },
    { label: 'SPY' }, { label: 'S&P 500 (SPX)' },
  ];

  const renderCoinData = (coin: CoinData | null, Icon: ElementType) => {
    if (!coin && appData.loading) return <div className="p-4">Loading...</div>;
    if (!coin) return <div className="p-4">Data unavailable.</div>;

    const chartConfig = {
      price: { label: "Price", color: "hsl(var(--chart-1))" },
      upper: { label: "Upper Band", color: "hsl(var(--chart-2))" },
      middle: { label: "Middle Band", color: "hsl(var(--chart-3))" },
      lower: { label: "Lower Band", color: "hsl(var(--chart-4))" },
    };

    return (
      <div className="space-y-3 p-1">
        <ValueDisplay label="Price" value={coin.price} unit={coin.symbol} variant="highlight" isLoading={coin.status === 'loading'} valueClassName="text-accent" />
        <ValueDisplay label="24h Change" value={`${coin.change24h.toFixed(2)}%`} valueClassName={coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="24h High" value={coin.high24h} unit={coin.symbol} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="24h Low" value={coin.low24h} unit={coin.symbol} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="Volume" value={coin.volume24h} unit={coin.symbol} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="Market Cap" value={coin.marketCap} unit={coin.symbol} isLoading={coin.status === 'loading'} />
        
        <h4 className="text-sm font-medium pt-2 text-primary">Indicators</h4>
        <ValueDisplay label="SMA" value={coin.indicators.sma?.value ?? 'N/A'} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="RSI" value={coin.indicators.rsi?.value ?? 'N/A'} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="Support" value={coin.indicators.support.join(', ') || 'N/A'} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="Resistance" value={coin.indicators.resistance.join(', ') || 'N/A'} isLoading={coin.status === 'loading'} />

        <h4 className="text-sm font-medium pt-2 text-primary">Bollinger Bands</h4>
        <ValueDisplay label="Upper" value={coin.indicators.bollingerBands.upper} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="Middle (SMA20)" value={coin.indicators.bollingerBands.middle} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="Lower" value={coin.indicators.bollingerBands.lower} isLoading={coin.status === 'loading'} />
        {coin.indicators.bollingerBands.percentB !== undefined && <ValueDisplay label="%B" value={coin.indicators.bollingerBands.percentB.toFixed(2)} isLoading={coin.status === 'loading'} />}
        {coin.indicators.bollingerBands.bandwidth !== undefined && <ValueDisplay label="Bandwidth" value={coin.indicators.bollingerBands.bandwidth.toFixed(3)} isLoading={coin.status === 'loading'} />}
        
        {coin.chartData && coin.chartData.length > 0 && (
          <div className="mt-4 h-[200px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <LineChart data={coin.chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={10} domain={['dataMin - 100', 'dataMax + 100']}/>
                <RechartsTooltip content={<ChartTooltipContent hideIndicator />} />
                <Line type="monotone" dataKey="price" stroke="var(--color-price)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="upper" stroke="var(--color-upper)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="middle" stroke="var(--color-middle)" strokeWidth={1.5} strokeDasharray="2 2" dot={false} />
                <Line type="monotone" dataKey="lower" stroke="var(--color-lower)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </div>
    );
  };
  
  const renderStockData = (stock: StockData | null, Icon: ElementType) => {
    if (!stock && appData.loading) return <div className="p-4">Loading...</div>;
    if (!stock) return <div className="p-4">Data unavailable.</div>;
    return (
      <div className="space-y-3 p-1">
        <ValueDisplay label="Price" value={stock.price} unit="USD" variant="highlight" isLoading={stock.status === 'loading'} valueClassName="text-accent" />
        <ValueDisplay label="Change" value={stock.change.toFixed(2)} valueClassName={stock.change >= 0 ? 'text-green-500' : 'text-red-500'} unit="USD" isLoading={stock.status === 'loading'} />
        <ValueDisplay label="Change %" value={`${stock.changePercent.toFixed(2)}%`} valueClassName={stock.changePercent >= 0 ? 'text-green-500' : 'text-red-500'} isLoading={stock.status === 'loading'} />
        <ValueDisplay label="Volume" value={stock.volume} isLoading={stock.status === 'loading'} />
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      <DashboardHeader title="Crypto Pulse" navItems={navItems} />
      <main className="flex-grow container mx-auto px-2 py-4 sm:px-4 sm:py-6">
        {appData.globalError && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md mb-4 text-sm">
            <strong>Error:</strong> {appData.globalError}. Displaying cached or mock data.
          </div>
        )}

        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <DataCard title="Bitcoin (BTC)" icon={Bitcoin} status={appData.btc?.status ?? (appData.loading ? 'loading' : 'error')} className="xl:col-span-2" contentClassName="overflow-y-auto max-h-[500px] sm:max-h-[600px]">
            {renderCoinData(appData.btc, Bitcoin)}
          </DataCard>

          <DataCard title="Ethereum (ETH)" icon={Shapes} status={appData.eth?.status ?? (appData.loading ? 'loading' : 'error')} className="xl:col-span-2" contentClassName="overflow-y-auto max-h-[500px] sm:max-h-[600px]">
            {renderCoinData(appData.eth, Shapes)}
          </DataCard>

          <DataCard title={appData.spy?.name || "SPY"} icon={Briefcase} status={appData.spy?.status ?? (appData.loading ? 'loading' : 'error')}>
            {renderStockData(appData.spy, Briefcase)}
          </DataCard>

          <DataCard title={appData.spx?.name || "S&P 500"} icon={BarChart3} status={appData.spx?.status ?? (appData.loading ? 'loading' : 'error')}>
            {renderStockData(appData.spx, BarChart3)}
          </DataCard>

          <DataCard title="Top 7 Trending Coins" icon={TrendingUp} status={appData.trending?.status ?? (appData.loading ? 'loading' : 'error')} className="sm:col-span-2 lg:col-span-1">
            {appData.trending ? (
              <ul className="space-y-2 text-sm">
                {appData.trending.coins.map(coin => (
                  <li key={coin.id} className="flex items-center justify-between p-1.5 bg-muted/30 rounded-md hover:bg-muted/60 transition-colors">
                    <div className="flex items-center">
                      <Image data-ai-hint="coin logo" src={coin.thumb} alt={coin.name} width={24} height={24} className="rounded-full mr-2" />
                      <span>{coin.name} ({coin.symbol})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Rank: {coin.market_cap_rank}</span>
                  </li>
                ))}
              </ul>
            ) : (appData.loading ? <p>Loading trending coins...</p> : <p>Trending coins data unavailable.</p>)}
          </DataCard>

          <DataCard title="Fear & Greed Index" icon={Gauge} status={appData.fearGreed?.status ?? (appData.loading ? 'loading' : 'error')}>
            {appData.fearGreed ? (
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-primary">{appData.fearGreed.value}</p>
                <p className="text-muted-foreground">{appData.fearGreed.value_classification}</p>
                {appData.fearGreed.timestamp && <p className="text-xs text-muted-foreground mt-2">As of {new Date(appData.fearGreed.timestamp).toLocaleTimeString()}</p>}
              </div>
            ) : (appData.loading ? <p>Loading F&G Index...</p> : <p>Fear & Greed Index data unavailable.</p>)}
          </DataCard>

          <DataCard title="AI Market Sentiment" icon={Brain} status={appData.loadingAi ? 'loading' : (appData.aiSentiment ? 'fresh' : 'error')} className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
            {appData.aiSentiment ? (
              <div className="space-y-2 text-sm p-1">
                <ValueDisplay label="Overall Sentiment" value={appData.aiSentiment.overallSentiment} />
                <ValueDisplay label="Bitcoin (BTC) Sentiment" value={appData.aiSentiment.btcSentiment} />
                <ValueDisplay label="Ethereum (ETH) Sentiment" value={appData.aiSentiment.ethSentiment} />
                <ValueDisplay label="Stock Market Sentiment" value={appData.aiSentiment.stockMarketSentiment} />
              </div>
            ) : (appData.loadingAi ? <p>Generating AI sentiment analysis...</p> : <p>AI sentiment analysis unavailable. Ensure price data is loaded.</p>)}
          </DataCard>
        </div>

        <footer className="text-center mt-8 py-4 border-t">
          {appData.lastUpdated && <p className="text-xs text-muted-foreground">Last updated: {new Date(appData.lastUpdated).toLocaleString()}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            Crypto Pulse - Financial data displayed is for informational purposes only. Price data is mocked for this demonstration.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default CryptoDashboardPage;
