
'use client';

import { useState, useEffect, useCallback, useRef, type FC, type ElementType } from 'react';
import Image from 'next/image';
import DashboardHeader from '@/components/DashboardHeader';
import DataCard from '@/components/DataCard';
import ValueDisplay from '@/components/ValueDisplay';
import type { AppData, CoinData, StockData, TrendingData, FearGreedData, MarketSentimentAnalysisOutput as AISentimentData, TrendingCoinItem } from '@/types';
import { marketSentimentAnalysis } from '@/ai/flows/market-sentiment-analysis';
import { Bitcoin, Brain, Briefcase, Gauge, Shapes, TrendingUp, BarChart3 } from 'lucide-react';

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

// Mock data only for stocks to avoid API key requirements and ensure lowest usage.
const getMockStockData = (): { spy: StockData, spx: StockData } => {
  const now = new Date().toISOString();
  return {
    spy: {
      id: 'spy', name: 'SPDR S&P 500 ETF', symbol: 'SPY', price: 450, change: 1.5, changePercent: 0.33, volume: 75000000, lastUpdated: now, status: 'fresh'
    },
    spx: {
      id: 'spx', name: 'S&P 500 Index', symbol: '^GSPC', price: 4500, change: 10, changePercent: 0.22, volume: 2000000000, lastUpdated: now, status: 'fresh'
    }
  };
};


const CryptoDashboardPage: FC = () => {
  const [appData, setAppData] = useState<AppData>(initialAppData);
  const appDataRef = useRef(appData); // To access previous state in fetchData

  useEffect(() => {
    appDataRef.current = appData;
  }, [appData]);

  const fetchData = useCallback(async () => {
    if (!appDataRef.current.loading) {
      setAppData(prev => ({ ...prev, loading: true, globalError: null }));
    }

    const prevData = appDataRef.current;
    let partialError = false;
    let anyDataFetched = false;

    try {
      const [marketDataResponse, trendingResponse, fearGreedResponse] = await Promise.allSettled([
        fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&order=market_cap_desc&per_page=2&page=1&sparkline=false&price_change_percentage=24h'),
        fetch('https://api.coingecko.com/api/v3/search/trending'),
        fetch('https://api.alternative.me/fng/?limit=1')
      ]);

      let newBtcData: CoinData | null = prevData.btc;
      let newEthData: CoinData | null = prevData.eth;
      let newTrendingData: TrendingData | null = prevData.trending;
      let newFearGreedData: FearGreedData | null = prevData.fearGreed;

      // Process Bitcoin & Ethereum
      if (marketDataResponse.status === 'fulfilled' && marketDataResponse.value.ok) {
        const markets = await marketDataResponse.value.json();
        const btcApi = markets.find((c: any) => c.id === 'bitcoin');
        const ethApi = markets.find((c: any) => c.id === 'ethereum');

        if (btcApi) {
          anyDataFetched = true;
          newBtcData = {
            id: btcApi.id,
            name: btcApi.name,
            symbol: btcApi.symbol.toUpperCase(),
            price: btcApi.current_price,
            change24h: btcApi.price_change_percentage_24h || 0,
            volume24h: btcApi.total_volume,
            marketCap: btcApi.market_cap,
            high24h: btcApi.high_24h,
            low24h: btcApi.low_24h,
            lastUpdated: btcApi.last_updated,
            image: btcApi.image,
            status: 'fresh',
          };
        } else {
          partialError = true;
          if (newBtcData) newBtcData.status = 'cached_error';
          console.error("Bitcoin data not found in API response.");
        }

        if (ethApi) {
          anyDataFetched = true;
          newEthData = {
            id: ethApi.id,
            name: ethApi.name,
            symbol: ethApi.symbol.toUpperCase(),
            price: ethApi.current_price,
            change24h: ethApi.price_change_percentage_24h || 0,
            volume24h: ethApi.total_volume,
            marketCap: ethApi.market_cap,
            high24h: ethApi.high_24h,
            low24h: ethApi.low_24h,
            lastUpdated: ethApi.last_updated,
            image: ethApi.image,
            status: 'fresh',
          };
        } else {
          partialError = true;
          if (newEthData) newEthData.status = 'cached_error';
          console.error("Ethereum data not found in API response.");
        }
      } else {
        partialError = true;
        if (newBtcData) newBtcData.status = 'cached_error';
        if (newEthData) newEthData.status = 'cached_error';
        console.error("Failed to fetch market data:", marketDataResponse.status === 'rejected' ? marketDataResponse.reason : marketDataResponse.value.statusText);
      }

      // Process Trending Coins
      if (trendingResponse.status === 'fulfilled' && trendingResponse.value.ok) {
        const trendingApi = await trendingResponse.value.json();
        if (trendingApi.coins && trendingApi.coins.length > 0) {
          anyDataFetched = true;
          newTrendingData = {
            coins: trendingApi.coins.slice(0, 7).map((coin: { item: any }): TrendingCoinItem => ({
              id: coin.item.id,
              name: coin.item.name,
              symbol: coin.item.symbol.toUpperCase(),
              market_cap_rank: coin.item.market_cap_rank,
              thumb: coin.item.thumb,
              price_btc: coin.item.price_btc,
            })),
            status: 'fresh',
          };
        } else {
           if (newTrendingData) newTrendingData.status = 'cached_error'; else partialError = true;
        }
      } else {
        partialError = true;
        if (newTrendingData) newTrendingData.status = 'cached_error';
        console.error("Failed to fetch trending coins:", trendingResponse.status === 'rejected' ? trendingResponse.reason : trendingResponse.value.statusText);
      }

      // Process Fear & Greed Index
      if (fearGreedResponse.status === 'fulfilled' && fearGreedResponse.value.ok) {
        const fearGreedApi = await fearGreedResponse.value.json();
        if (fearGreedApi.data && fearGreedApi.data.length > 0) {
          anyDataFetched = true;
          const fgValue = fearGreedApi.data[0];
          newFearGreedData = {
            value: fgValue.value,
            value_classification: fgValue.value_classification,
            timestamp: fgValue.timestamp, // This is Unix timestamp as string
            status: 'fresh',
          };
        } else {
           if (newFearGreedData) newFearGreedData.status = 'cached_error'; else partialError = true;
        }
      } else {
        partialError = true;
        if (newFearGreedData) newFearGreedData.status = 'cached_error';
        console.error("Failed to fetch Fear & Greed Index:", fearGreedResponse.status === 'rejected' ? fearGreedResponse.reason : fearGreedResponse.value.statusText);
      }

      const mockStocks = getMockStockData();

      setAppData(current => ({
        ...current,
        btc: newBtcData,
        eth: newEthData,
        spy: mockStocks.spy, // Always use fresh mock for stocks
        spx: mockStocks.spx,   // Always use fresh mock for stocks
        trending: newTrendingData,
        fearGreed: newFearGreedData,
        lastUpdated: anyDataFetched || current.lastUpdated ? new Date().toISOString() : null,
        globalError: partialError && !anyDataFetched && !prevData.btc ? "Failed to load critical market data. Displaying cached or limited data." : (partialError ? "Some data might be outdated due to fetching errors." : null),
        loading: false,
      }));

    } catch (error) {
      console.error("Overall error fetching dashboard data:", error);
      setAppData(current => ({
        ...current, // Keep existing data as cache
        btc: current.btc ? { ...current.btc, status: 'cached_error' } : null,
        eth: current.eth ? { ...current.eth, status: 'cached_error' } : null,
        trending: current.trending ? { ...current.trending, status: 'cached_error' } : null,
        fearGreed: current.fearGreed ? { ...current.fearGreed, status: 'cached_error' } : null,
        spy: current.spy || getMockStockData().spy, // Ensure stocks are present
        spx: current.spx || getMockStockData().spx,
        globalError: error instanceof Error ? error.message : 'Unknown error fetching data. Displaying cached or limited data.',
        loading: false,
        lastUpdated: current.lastUpdated || new Date().toISOString(), // Keep last update time or set new if some parts loaded
      }));
    }
  }, []); // Removed appDataRef from deps as it's a ref, fetchData is called by interval or effect

  useEffect(() => {
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    // Only run AI sentiment if critical data (prices) are available and not already loading AI
    if (appData.btc && appData.eth && appData.spy && appData.spx && !appData.loadingAi) {
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
          // Keep previous AI sentiment if new fetch fails, or set to null if it was the first attempt
          setAppData(prev => ({ ...prev, aiSentiment: prev.aiSentiment || null, loadingAi: false }));
        }
      };
      // Debounce or make conditional if prices haven't changed much
      runAnalysis();
    }
  }, [appData.btc, appData.eth, appData.spy, appData.spx, appData.loadingAi]); // re-run if prices change

  const navItems = [
    { label: 'Metric' }, { label: 'Bitcoin (BTC)' }, { label: 'Ethereum (ETH)' },
    { label: 'SPY' }, { label: 'S&P 500 (SPX)' },
  ];

  const renderCoinData = (coin: CoinData | null, IconComponent: ElementType) => {
    // If app is loading globally and coin data is null, show top-level card loading
    if (appData.loading && !coin) return null; // DataCard handles its own loading skeleton
    if (!coin) return <div className="p-4 text-center">Data unavailable for {IconComponent === Bitcoin ? 'Bitcoin' : 'Ethereum'}.</div>;
    
    return (
      <div className="space-y-3 p-1">
        <div className="flex items-center space-x-2 mb-2">
          <Image data-ai-hint="coin logo" src={coin.image} alt={coin.name} width={32} height={32} className="rounded-full" />
          <ValueDisplay label="Price" value={coin.price} unit={coin.symbol} variant="highlight" isLoading={coin.status === 'loading'} valueClassName="text-accent" />
        </div>
        <ValueDisplay label="24h Change" value={`${coin.change24h?.toFixed(2) ?? 'N/A'}%`} valueClassName={coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="24h High" value={coin.high24h ?? 'N/A'} unit={coin.symbol} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="24h Low" value={coin.low24h ?? 'N/A'} unit={coin.symbol} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="Volume" value={coin.volume24h ?? 'N/A'} unit={coin.symbol} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="Market Cap" value={coin.marketCap ?? 'N/A'} unit={coin.symbol} isLoading={coin.status === 'loading'} />
      </div>
    );
  };
  
  const renderStockData = (stock: StockData | null, IconComponent: ElementType) => {
    if (appData.loading && !stock) return null;
    if (!stock) return <div className="p-4 text-center">Data unavailable for {stock?.name || (IconComponent === Briefcase ? 'SPY' : 'S&P 500')}.</div>;
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
            <strong>Notice:</strong> {appData.globalError}
          </div>
        )}

        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <DataCard title="Bitcoin (BTC)" icon={Bitcoin} status={appData.btc?.status ?? (appData.loading ? 'loading' : 'error')} className="xl:col-span-1">
            {renderCoinData(appData.btc, Bitcoin)}
          </DataCard>

          <DataCard title="Ethereum (ETH)" icon={Shapes} status={appData.eth?.status ?? (appData.loading ? 'loading' : 'error')} className="xl:col-span-1">
            {renderCoinData(appData.eth, Shapes)}
          </DataCard>
          
          <DataCard title="Top 7 Trending Coins" icon={TrendingUp} status={appData.trending?.status ?? (appData.loading ? 'loading' : 'error')} className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
            {appData.trending && appData.trending.coins.length > 0 ? (
              <ul className="space-y-2 text-sm max-h-[300px] overflow-y-auto p-1">
                {appData.trending.coins.map(coin => (
                  <li key={coin.id} className="flex items-center justify-between p-1.5 bg-muted/30 rounded-md hover:bg-muted/60 transition-colors">
                    <div className="flex items-center">
                      <Image data-ai-hint="coin logo" src={coin.thumb} alt={coin.name} width={24} height={24} className="rounded-full mr-2" />
                      <span className="font-medium">{coin.name} ({coin.symbol})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Rank: {coin.market_cap_rank}</span>
                  </li>
                ))}
              </ul>
            ) : (appData.loading && !appData.trending ? <p>Loading trending coins...</p> : <p className="text-center p-4">Trending coins data unavailable.</p>)}
          </DataCard>


          <DataCard title={appData.spy?.name || "SPY"} icon={Briefcase} status={appData.spy?.status ?? (appData.loading ? 'loading' : 'error')}>
            {renderStockData(appData.spy, Briefcase)}
          </DataCard>

          <DataCard title={appData.spx?.name || "S&P 500"} icon={BarChart3} status={appData.spx?.status ?? (appData.loading ? 'loading' : 'error')}>
            {renderStockData(appData.spx, BarChart3)}
          </DataCard>


          <DataCard title="Fear & Greed Index" icon={Gauge} status={appData.fearGreed?.status ?? (appData.loading ? 'loading' : 'error')} className="sm:col-span-1">
            {appData.fearGreed ? (
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-primary">{appData.fearGreed.value}</p>
                <p className="text-muted-foreground">{appData.fearGreed.value_classification}</p>
                {appData.fearGreed.timestamp && <p className="text-xs text-muted-foreground mt-2">As of {new Date(parseInt(appData.fearGreed.timestamp) * 1000).toLocaleTimeString()}</p>}
              </div>
            ) : (appData.loading && !appData.fearGreed ? <p>Loading F&G Index...</p> : <p className="text-center p-4">Fear & Greed Index data unavailable.</p>)}
          </DataCard>

          <DataCard title="AI Market Sentiment" icon={Brain} status={appData.loadingAi ? 'loading' : (appData.aiSentiment ? 'fresh' : (appData.btc ? 'waiting' : 'error'))} className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
            {appData.aiSentiment ? (
              <div className="space-y-2 text-sm p-1">
                <ValueDisplay label="Overall Sentiment" value={appData.aiSentiment.overallSentiment} />
                <ValueDisplay label="Bitcoin (BTC) Sentiment" value={appData.aiSentiment.btcSentiment} />
                <ValueDisplay label="Ethereum (ETH) Sentiment" value={appData.aiSentiment.ethSentiment} />
                <ValueDisplay label="Stock Market Sentiment" value={appData.aiSentiment.stockMarketSentiment} />
              </div>
            ) : (appData.loadingAi ? <p>Generating AI sentiment analysis...</p> : <p className="text-center p-4">AI sentiment analysis {appData.btc ? 'pending price data...' : 'unavailable. Ensure price data is loaded.'}</p>)}
          </DataCard>
        </div>

        <footer className="text-center mt-8 py-4 border-t">
          {appData.lastUpdated && <p className="text-xs text-muted-foreground">Last updated: {new Date(appData.lastUpdated).toLocaleString()}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            Crypto Pulse - Financial data displayed is for informational purposes only. Stock data is mocked.
          </p>
           <p className="text-xs text-muted-foreground mt-1">
            Crypto data powered by <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">CoinGecko</a> and <a href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">alternative.me</a>.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default CryptoDashboardPage;
