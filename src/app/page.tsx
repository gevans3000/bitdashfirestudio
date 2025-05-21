
'use client';

import { useState, useEffect, useCallback, useRef, type FC, type ElementType } from 'react';
import Image from 'next/image';
import DashboardHeader from '@/components/DashboardHeader';
import DataCard from '@/components/DataCard';
import ValueDisplay from '@/components/ValueDisplay';
import type { AppData, CoinData, StockData, TrendingData, FearGreedData, MarketSentimentAnalysisOutput as AISentimentData, TrendingCoinItem } from '@/types';
import { marketSentimentAnalysis } from '@/ai/flows/market-sentiment-analysis';
import { Bitcoin, Brain, Briefcase, Gauge, Shapes, TrendingUp, BarChart3 } from 'lucide-react';

const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY;
const CRYPTO_FETCH_INTERVAL_MS = 60 * 1000; // 1 minute
const STOCK_FETCH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const AI_ANALYSIS_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (increased from 5)
const INITIAL_AI_ANALYSIS_DELAY_MS = 15 * 1000; // 15 seconds (increased from 5)

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
  loading: true, // For initial crypto load
  loadingAi: false,
};

const getMockStockData = (symbol?: string): StockData => {
  const now = new Date().toISOString();
  if (symbol === 'SPY') {
    return {
      id: 'spy', name: 'SPDR S&P 500 ETF (Mocked)', symbol: 'SPY', price: 450, change: 1.5, changePercent: 0.33, volume: 75000000, lastUpdated: now, status: 'cached_error'
    };
  }
  if (symbol === '^GSPC') {
    return {
      id: 'spx', name: 'S&P 500 Index (Mocked)', symbol: '^GSPC', price: 4500, change: 10, changePercent: 0.22, volume: 2000000000, lastUpdated: now, status: 'cached_error'
    };
  }
  // Default mock if symbol not specified (should not happen if called with symbol)
  return {
      id: 'mock', name: 'Mock Stock Data', symbol: 'MOCK', price: 100, change: 1, changePercent: 1, volume: 1000000, lastUpdated: now, status: 'cached_error'
  };
};


const CryptoDashboardPage: FC = () => {
  const [appData, setAppData] = useState<AppData>(initialAppData);
  const appDataRef = useRef(appData); 

  useEffect(() => {
    appDataRef.current = appData;
  }, [appData]);

  const fetchCryptoData = useCallback(async () => {
    if (!appDataRef.current.loading && appDataRef.current.btc === null) { 
      setAppData(prev => ({ ...prev, loading: true, globalError: appDataRef.current.globalError })); 
    }

    const prevData = appDataRef.current;
    let partialError = false;
    let anyDataFetched = false;
    let cryptoErrorMsg: string | null = null;

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

      if (marketDataResponse.status === 'fulfilled' && marketDataResponse.value.ok) {
        const markets = await marketDataResponse.value.json();
        const btcApi = markets.find((c: any) => c.id === 'bitcoin');
        const ethApi = markets.find((c: any) => c.id === 'ethereum');

        if (btcApi) {
          anyDataFetched = true;
          newBtcData = {
            id: btcApi.id, name: btcApi.name, symbol: btcApi.symbol.toUpperCase(), price: btcApi.current_price,
            change24h: btcApi.price_change_percentage_24h || 0, volume24h: btcApi.total_volume, marketCap: btcApi.market_cap,
            high24h: btcApi.high_24h, low24h: btcApi.low_24h, lastUpdated: btcApi.last_updated, image: btcApi.image, status: 'fresh',
          };
        } else { partialError = true; if (newBtcData) newBtcData.status = 'cached_error'; console.error("Bitcoin data not found."); }

        if (ethApi) {
          anyDataFetched = true;
          newEthData = {
            id: ethApi.id, name: ethApi.name, symbol: ethApi.symbol.toUpperCase(), price: ethApi.current_price,
            change24h: ethApi.price_change_percentage_24h || 0, volume24h: ethApi.total_volume, marketCap: ethApi.market_cap,
            high24h: ethApi.high_24h, low24h: ethApi.low_24h, lastUpdated: ethApi.last_updated, image: ethApi.image, status: 'fresh',
          };
        } else { partialError = true; if (newEthData) newEthData.status = 'cached_error'; console.error("Ethereum data not found."); }
      } else {
        partialError = true;
        if (newBtcData) newBtcData.status = 'cached_error'; if (newEthData) newEthData.status = 'cached_error';
        const errorText = marketDataResponse.status === 'rejected' ? marketDataResponse.reason : (marketDataResponse.value?.statusText || "market data fetch error");
        cryptoErrorMsg = `Failed to fetch crypto market data: ${errorText}. `;
        console.error(cryptoErrorMsg);
      }

      if (trendingResponse.status === 'fulfilled' && trendingResponse.value.ok) {
        const trendingApi = await trendingResponse.value.json();
        if (trendingApi.coins && trendingApi.coins.length > 0) {
          anyDataFetched = true;
          newTrendingData = {
            coins: trendingApi.coins.slice(0, 7).map((coin: { item: any }): TrendingCoinItem => ({
              id: coin.item.id, name: coin.item.name, symbol: coin.item.symbol.toUpperCase(),
              market_cap_rank: coin.item.market_cap_rank, thumb: coin.item.thumb, price_btc: coin.item.price_btc,
            })), status: 'fresh',
          };
        } else { if (newTrendingData) newTrendingData.status = 'cached_error'; else partialError = true; }
      } else {
        partialError = true; if (newTrendingData) newTrendingData.status = 'cached_error';
        const errorText = trendingResponse.status === 'rejected' ? trendingResponse.reason : (trendingResponse.value?.statusText || "trending coins fetch error");
        cryptoErrorMsg = `${cryptoErrorMsg || ""}Failed to fetch trending coins: ${errorText}. `;
        console.error("Failed to fetch trending coins:", errorText);
      }

      if (fearGreedResponse.status === 'fulfilled' && fearGreedResponse.value.ok) {
        const fearGreedApi = await fearGreedResponse.value.json();
        if (fearGreedApi.data && fearGreedApi.data.length > 0) {
          anyDataFetched = true; const fgValue = fearGreedApi.data[0];
          newFearGreedData = { value: fgValue.value, value_classification: fgValue.value_classification, timestamp: fgValue.timestamp, status: 'fresh' };
        } else { if (newFearGreedData) newFearGreedData.status = 'cached_error'; else partialError = true; }
      } else {
        partialError = true; if (newFearGreedData) newFearGreedData.status = 'cached_error';
        const errorText = fearGreedResponse.status === 'rejected' ? fearGreedResponse.reason : (fearGreedResponse.value?.statusText || "F&G index fetch error");
        cryptoErrorMsg = `${cryptoErrorMsg || ""}Failed to fetch F&G Index: ${errorText}. `;
        console.error("Failed to fetch Fear & Greed Index:", errorText);
      }
      
      let currentGlobalError = appDataRef.current.globalError || "";
      currentGlobalError = currentGlobalError.split(". ").filter(msg => !msg.toLowerCase().includes("crypto") && !msg.toLowerCase().includes("trending") && !msg.toLowerCase().includes("f&g") && !msg.toLowerCase().includes("ai sentiment")).join(". ");
      if (currentGlobalError && !currentGlobalError.endsWith(". ") && currentGlobalError.length > 0) currentGlobalError += ". ";


      if (partialError && !anyDataFetched && !prevData.btc) {
         cryptoErrorMsg = cryptoErrorMsg || "Failed to load critical market data.";
      } else if (partialError) {
         cryptoErrorMsg = cryptoErrorMsg || "Some crypto data might be outdated.";
      } else {
        cryptoErrorMsg = null; 
      }
      
      const finalGlobalError = cryptoErrorMsg ? (currentGlobalError + cryptoErrorMsg).trim() : currentGlobalError.trim();

      setAppData(current => ({
        ...current, btc: newBtcData, eth: newEthData, trending: newTrendingData, fearGreed: newFearGreedData,
        lastUpdated: anyDataFetched || current.lastUpdated ? new Date().toISOString() : null,
        globalError: finalGlobalError || null,
        loading: false, 
      }));

    } catch (error) {
      console.error("Overall error fetching dashboard data:", error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error fetching crypto data.';
      setAppData(current => ({
        ...current,
        btc: current.btc ? { ...current.btc, status: 'cached_error' } : null,
        eth: current.eth ? { ...current.eth, status: 'cached_error' } : null,
        trending: current.trending ? { ...current.trending, status: 'cached_error' } : null,
        fearGreed: current.fearGreed ? { ...current.fearGreed, status: 'cached_error' } : null,
        globalError: `${current.globalError ? current.globalError + " " : ""} ${errorMsg}`,
        loading: false, 
        lastUpdated: current.lastUpdated || new Date().toISOString(),
      }));
    }
  }, []); 

  const fetchStockData = useCallback(async () => {
    setAppData(prev => ({
      ...prev,
      spy: prev.spy ? { ...prev.spy, status: 'loading' } : { ...getMockStockData('SPY'), status: 'loading' },
      spx: prev.spx ? { ...prev.spx, status: 'loading' } : { ...getMockStockData('^GSPC'), status: 'loading' },
    }));
  
    let stockErrorMsg: string | null = null;
  
    if (!FMP_API_KEY) {
      console.warn("FMP API key (NEXT_PUBLIC_FMP_API_KEY) is not set. Using mock stock data.");
      stockErrorMsg = "Stock data is mocked. Add NEXT_PUBLIC_FMP_API_KEY to .env for live data.";
      setAppData(prev => {
        let currentGlobalError = prev.globalError || "";
        currentGlobalError = currentGlobalError.split(". ").filter(msg => !msg.includes("Stock data is mocked") && !msg.toLowerCase().includes("ai sentiment")).join(". ");
        if (currentGlobalError && !currentGlobalError.endsWith(". ") && currentGlobalError.length > 0) currentGlobalError += ". ";

        return {
          ...prev,
          spy: getMockStockData('SPY'), 
          spx: getMockStockData('^GSPC'), 
          globalError: (currentGlobalError + stockErrorMsg).trim(),
        };
      });
      return;
    }
  
    try {
      const response = await fetch(`https://financialmodelingprep.com/api/v3/quote/SPY,^GSPC?apikey=${FMP_API_KEY}`);
      if (!response.ok) {
        stockErrorMsg = `Failed to fetch stock data from FMP: ${response.statusText} (status ${response.status}). `;
        if (response.status === 401) {
          stockErrorMsg += "Please check your FMP API key. ";
        }
        throw new Error(stockErrorMsg);
      }
      const data = await response.json();
      
      const spyApiData = data.find((s: any) => s.symbol === "SPY");
      const spxApiData = data.find((s: any) => s.symbol === "^GSPC");
  
      let newSpyData: StockData | null = appDataRef.current.spy;
      let newSpxData: StockData | null = appDataRef.current.spx;
  
      if (spyApiData) {
        newSpyData = {
          id: spyApiData.symbol, name: spyApiData.name || "SPDR S&P 500 ETF", symbol: spyApiData.symbol,
          price: spyApiData.price, change: spyApiData.change, changePercent: spyApiData.changesPercentage,
          volume: spyApiData.volume, 
          lastUpdated: spyApiData.timestamp ? new Date(spyApiData.timestamp * 1000).toISOString() : new Date().toISOString(),
          status: 'fresh',
        };
      } else { if (newSpyData) newSpyData.status = 'cached_error'; console.error("SPY data not found in FMP response."); stockErrorMsg = (stockErrorMsg || "") + "SPY data missing. ";}
  
      if (spxApiData) {
        newSpxData = {
          id: spxApiData.symbol, name: spxApiData.name || "S&P 500 Index", symbol: spxApiData.symbol,
          price: spxApiData.price, change: spxApiData.change, changePercent: spxApiData.changesPercentage,
          volume: spxApiData.volume,
          lastUpdated: spxApiData.timestamp ? new Date(spxApiData.timestamp * 1000).toISOString() : new Date().toISOString(),
          status: 'fresh',
        };
      } else { if (newSpxData) newSpxData.status = 'cached_error'; console.error("^GSPC data not found in FMP response."); stockErrorMsg = (stockErrorMsg || "") + "^GSPC data missing. ";}
      
      setAppData(prev => {
        let currentGlobalError = prev.globalError || "";
        currentGlobalError = currentGlobalError.split(". ").filter(msg => !msg.toLowerCase().includes("stock") && !msg.toLowerCase().includes("fmp") && !msg.toLowerCase().includes("ai sentiment")).join(". ");
        if (currentGlobalError && !currentGlobalError.endsWith(". ") && currentGlobalError.length > 0) currentGlobalError += ". ";

        return {
          ...prev,
          spy: newSpyData || prev.spy, 
          spx: newSpxData || prev.spx, 
          globalError: stockErrorMsg ? (currentGlobalError + stockErrorMsg).trim() : (currentGlobalError.trim() || null),
          lastUpdated: new Date().toISOString(), 
        };
      });
  
    } catch (error) {
      console.error("Error fetching stock data:", error);
      const errorText = error instanceof Error ? error.message : "Unknown error fetching stock data.";
      setAppData(prev => {
        let currentGlobalError = prev.globalError || "";
        currentGlobalError = currentGlobalError.split(". ").filter(msg => !msg.toLowerCase().includes("stock") && !msg.toLowerCase().includes("fmp") && !msg.toLowerCase().includes("ai sentiment")).join(". ");
        if (currentGlobalError && !currentGlobalError.endsWith(". ") && currentGlobalError.length > 0) currentGlobalError += ". ";

        return {
        ...prev,
        spy: prev.spy ? { ...prev.spy, status: 'cached_error' } : getMockStockData('SPY'),
        spx: prev.spx ? { ...prev.spx, status: 'cached_error' } : getMockStockData('^GSPC'),
        globalError: (currentGlobalError + errorText).trim(),
        };
      });
    }
  }, []);

  useEffect(() => {
    fetchCryptoData(); 
    const interval = setInterval(fetchCryptoData, CRYPTO_FETCH_INTERVAL_MS); 
    return () => clearInterval(interval);
  }, [fetchCryptoData]);

  useEffect(() => {
    fetchStockData();
    const interval = setInterval(fetchStockData, STOCK_FETCH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStockData]);


  const runAiAnalysis = useCallback(async () => {
    const currentData = appDataRef.current;
    if (currentData.loadingAi) return;

    if (currentData.btc && currentData.eth && currentData.spy && currentData.spx) {
      setAppData(prev => ({ ...prev, loadingAi: true }));
      try {
        const sentimentResult = await marketSentimentAnalysis({
          btcPrice: currentData.btc.price, ethPrice: currentData.eth.price,
          spyPrice: currentData.spy.price, spxPrice: currentData.spx.price,
        });
        setAppData(prev => {
           let currentGlobalError = prev.globalError || "";
           currentGlobalError = currentGlobalError.split(". ").filter(msg => !msg.toLowerCase().includes("ai sentiment analysis failed due to rate limits")).join(". ");
           if (currentGlobalError && !currentGlobalError.endsWith(".") && currentGlobalError.length > 0) currentGlobalError += ". ";

          return {...prev, aiSentiment: sentimentResult, loadingAi: false, globalError: currentGlobalError.trim() || null };
        });

      } catch (error) {
        console.error("Error fetching AI sentiment:", error);
        let aiErrorMsg = "AI sentiment analysis failed.";
        if (error instanceof Error && error.message.includes("429")) {
          aiErrorMsg = "AI sentiment analysis failed due to rate limits. Will retry on the next scheduled run.";
        }
        
        setAppData(prev => {
          let currentGlobalError = prev.globalError || "";
          // Remove previous AI rate limit message to avoid duplication
          currentGlobalError = currentGlobalError.split(". ").filter(msg => !msg.toLowerCase().includes("ai sentiment analysis failed due to rate limits")).join(". ");
          if (currentGlobalError && !currentGlobalError.endsWith(".") && currentGlobalError.length > 0) currentGlobalError += ". ";
          
          return { 
            ...prev, 
            aiSentiment: prev.aiSentiment || null, 
            loadingAi: false,
            globalError: (currentGlobalError + aiErrorMsg).trim() 
          };
        });
      }
    } else {
      if (!currentData.loading) { 
         setAppData(prev => ({ ...prev, loadingAi: false, aiSentiment: null }));
      }
    }
  }, []);


  useEffect(() => {
    const initialRunTimeout = setTimeout(() => { runAiAnalysis(); }, INITIAL_AI_ANALYSIS_DELAY_MS); 
    const aiInterval = setInterval(runAiAnalysis, AI_ANALYSIS_INTERVAL_MS);
    return () => { clearTimeout(initialRunTimeout); clearInterval(aiInterval); };
  }, [runAiAnalysis]);


  const navItems = [
    { label: 'Metric' }, { label: 'Bitcoin (BTC)' }, { label: 'Ethereum (ETH)' },
    { label: 'SPY' }, { label: 'S&P 500 (^GSPC)' },
  ];

  const renderCoinData = (coin: CoinData | null, IconComponent: ElementType) => {
    const isLoading = appData.loading && !coin; 
    if (isLoading) return <div className="p-4 text-center">Loading data...</div>;
    if (!coin) return <div className="p-4 text-center">Data unavailable for {IconComponent === Bitcoin ? 'Bitcoin' : 'Ethereum'}.</div>;
    
    return (
      <div className="space-y-3 p-1">
        <div className="flex items-center space-x-2 mb-2">
          <Image data-ai-hint="coin logo" src={coin.image} alt={coin.name} width={32} height={32} className="rounded-full" />
          <ValueDisplay label="Price" value={coin.price} unit={coin.symbol.toUpperCase()} variant="highlight" isLoading={coin.status === 'loading'} valueClassName="text-accent" />
        </div>
        <ValueDisplay label="24h Change" value={`${coin.change24h?.toFixed(2) ?? 'N/A'}%`} valueClassName={coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="24h High" value={coin.high24h ?? 'N/A'} unit={coin.symbol.toUpperCase()} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="24h Low" value={coin.low24h ?? 'N/A'} unit={coin.symbol.toUpperCase()} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="Volume" value={coin.volume24h ?? 'N/A'} unit={coin.symbol.toUpperCase()} isLoading={coin.status === 'loading'} />
        <ValueDisplay label="Market Cap" value={coin.marketCap ?? 'N/A'} unit={coin.symbol.toUpperCase()} isLoading={coin.status === 'loading'} />
      </div>
    );
  };
  
  const renderStockData = (stock: StockData | null, IconComponent: ElementType) => {
    if (!stock) return <div className="p-4 text-center">Data unavailable for {IconComponent === Briefcase ? 'SPY' : 'S&P 500'}.</div>;
    return (
      <div className="space-y-3 p-1">
        <ValueDisplay label="Price" value={stock.price} unit="USD" variant="highlight" isLoading={stock.status === 'loading'} valueClassName="text-accent" />
        <ValueDisplay label="Change" value={stock.change?.toFixed(2)} valueClassName={stock.change >= 0 ? 'text-green-500' : 'text-red-500'} unit="USD" isLoading={stock.status === 'loading'} />
        <ValueDisplay label="Change %" value={`${stock.changePercent?.toFixed(2)}%`} valueClassName={stock.changePercent >= 0 ? 'text-green-500' : 'text-red-500'} isLoading={stock.status === 'loading'} />
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
            ) : ( (appData.loading && !appData.trending) ? <p className="text-center p-4">Loading trending coins...</p> : <p className="text-center p-4">Trending coins data unavailable.</p>)}
          </DataCard>

          <DataCard title={appData.spy?.name || "SPY"} icon={Briefcase} status={appData.spy?.status ?? 'loading'}>
            {renderStockData(appData.spy, Briefcase)}
          </DataCard>

          <DataCard title={appData.spx?.name || "S&P 500"} icon={BarChart3} status={appData.spx?.status ?? 'loading'}>
            {renderStockData(appData.spx, BarChart3)}
          </DataCard>

          <DataCard title="Fear & Greed Index" icon={Gauge} status={appData.fearGreed?.status ?? (appData.loading ? 'loading' : 'error')} className="sm:col-span-1">
            {appData.fearGreed ? (
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-primary">{appData.fearGreed.value}</p>
                <p className="text-muted-foreground">{appData.fearGreed.value_classification}</p>
                {appData.fearGreed.timestamp && <p className="text-xs text-muted-foreground mt-2">As of {new Date(parseInt(appData.fearGreed.timestamp) * 1000).toLocaleTimeString()}</p>}
              </div>
            ) : ((appData.loading && !appData.fearGreed) ? <p className="text-center p-4">Loading F&G Index...</p> : <p className="text-center p-4">Fear & Greed Index data unavailable.</p>)}
          </DataCard>

          <DataCard 
            title="AI Market Sentiment" 
            icon={Brain} 
            status={appData.loadingAi ? 'loading' : appData.aiSentiment ? 'fresh' : (appData.btc && appData.eth && appData.spy && appData.spx ? 'waiting' : 'error')} 
            className="sm:col-span-2 lg:col-span-3 xl:col-span-4"
          >
            {appData.loadingAi ? (
              <p className="text-center p-4">Generating AI sentiment analysis...</p>
            ) : appData.aiSentiment ? (
              <div className="space-y-2 text-sm p-1">
                <ValueDisplay label="Overall Sentiment" value={appData.aiSentiment.overallSentiment} />
                <ValueDisplay label="Bitcoin (BTC) Sentiment" value={appData.aiSentiment.btcSentiment} />
                <ValueDisplay label="Ethereum (ETH) Sentiment" value={appData.aiSentiment.ethSentiment} />
                <ValueDisplay label="Stock Market Sentiment" value={appData.aiSentiment.stockMarketSentiment} />
              </div>
            ) : (appData.btc && appData.eth && appData.spy && appData.spx) ? (
              <p className="text-center p-4">AI sentiment analysis will be generated shortly. Waiting for next scheduled run.</p>
            ) : (
              <p className="text-center p-4">AI sentiment analysis pending complete price data from all sources.</p>
            )}
          </DataCard>
        </div>

        <footer className="text-center mt-8 py-4 border-t">
          {appData.lastUpdated && <p className="text-xs text-muted-foreground">Last updated: {new Date(appData.lastUpdated).toLocaleString()}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            Crypto Pulse - Financial data displayed is for informational purposes only.
            {!FMP_API_KEY && " Live stock data requires NEXT_PUBLIC_FMP_API_KEY."}
          </p>
           <p className="text-xs text-muted-foreground mt-1">
            Crypto data powered by <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">CoinGecko</a> and <a href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">alternative.me</a>.
            {FMP_API_KEY && " Stock data powered by Financial Modeling Prep."}
          </p>
        </footer>
      </main>
    </div>
  );
};

export default CryptoDashboardPage;

    

    