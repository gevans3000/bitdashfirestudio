"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FC,
  type ElementType,
} from "react";
import Image from "next/image";
import DashboardHeader from "@/components/DashboardHeader";
import DataCard from "@/components/DataCard";
import ValueDisplay from "@/components/ValueDisplay";
import type {
  AppData,
  CoinData,
  StockData,
  TrendingData,
  FearGreedData,
  MarketSentimentAnalysisOutput as AISentimentData,
  TrendingCoinItem,
} from "@/types";
import { marketSentimentAnalysis } from "@/ai/flows/market-sentiment-analysis";
import {
  Bitcoin,
  Brain,
  Briefcase,
  Gauge,
  Shapes,
  TrendingUp,
  BarChart3,
  DollarSign,
  Landmark,
  BarChart2,
} from "lucide-react";
import { CorrelationPanel } from "@/components/CorrelationPanel";
import SignalCard from "@/components/SignalCard";
import MarketChart from "@/components/MarketChart";
import SignalHistory from "@/components/SignalHistory";
import AtrWidget from "@/components/AtrWidget";
import VwapWidget from "@/components/VwapWidget";
import StochRsiWidget from "@/components/StochRsiWidget";
import RsiWidget from "@/components/RsiWidget";
import BollingerWidget from "@/components/BollingerWidget";
import OrderBookWidget from "@/components/OrderBookWidget";
import VolumeSpikeChart from "@/components/VolumeSpikeChart";
import VolumeProfileChart from "@/components/VolumeProfileChart";
import IchimokuWidget from "@/components/IchimokuWidget";
import OrderFlowWidget from "@/components/OrderFlowWidget";
import SessionTimerWidget from "@/components/SessionTimerWidget";
import EmaCrossoverWidget from "@/components/EmaCrossoverWidget";
import { Orchestrator } from "@/lib/agents/Orchestrator";
import { DataCollector } from "@/lib/agents/DataCollector";
import { IndicatorEngine } from "@/lib/agents/IndicatorEngine";
import { SignalGenerator } from "@/lib/agents/SignalGenerator";
import { AlertLogger } from "@/lib/agents/AlertLogger";
import type { Candle } from "@/lib/data/binanceWs";
import type { ComputedIndicators } from "@/lib/signals";
import type { TradeSignal } from "@/types";
import type { AgentMessage } from "@/types/agent";
import {
  simpleMovingAverage,
  rsi,
  exponentialMovingAverage,
  calculateVolumeProfile,
  emaCrossoverState,
} from "@/lib/indicators";

const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY;
const ALPHA_VANTAGE_API_KEY =
  process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || "demo"; // Get a free key from Alpha Vantage if needed
const CRYPTO_FETCH_INTERVAL_MS = 60 * 1000; // 1 minute
const STOCK_FETCH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const AI_ANALYSIS_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const INITIAL_AI_ANALYSIS_DELAY_MS = 15 * 1000; // 15 seconds

const getMockStockData = (symbol?: string): StockData => {
  const now = new Date().toISOString();
  if (symbol === "SPY") {
    return {
      id: "spy",
      name: "SPDR S&P 500 ETF (Mocked)",
      symbol: "SPY",
      price: 450,
      change: 1.5,
      changePercent: 0.33,
      volume: 75000000,
      lastUpdated: now,
      status: "cached_error",
    };
  }
  if (symbol === "^GSPC") {
    return {
      id: "spx",
      name: "S&P 500 Index (Mocked)",
      symbol: "^GSPC",
      price: 4500,
      change: 10,
      changePercent: 0.22,
      volume: 2000000000,
      lastUpdated: now,
      status: "cached_error",
    };
  }
  if (symbol === "DX-Y.NYB" || symbol === "DXY") {
    return {
      id: "dxy",
      name: "US Dollar Index (Placeholder)",
      symbol: "DXY",
      price: 104.5,
      change: 0.1,
      changePercent: 0.1,
      volume: 0,
      lastUpdated: now,
      status: "cached_error",
    };
  }
  if (symbol === "^TNX" || symbol === "US10Y") {
    return {
      id: "us10y",
      name: "US 10-Year Yield (Placeholder)",
      symbol: "US10Y",
      price: 4.25,
      change: -0.02,
      changePercent: -0.47,
      volume: 0,
      lastUpdated: now,
      status: "cached_error",
    };
  }
  return {
    id: "mock",
    name: "Mock Stock Data",
    symbol: "MOCK",
    price: 100,
    change: 1,
    changePercent: 1,
    volume: 1000000,
    lastUpdated: now,
    status: "cached_error",
  };
};

const initialAppData: AppData = {
  btc: null,
  eth: null,
  spy: null,
  spx: null,
  dxy: null, // Don't load any data initially
  us10y: null, // Don't load any data initially
  trending: null,
  fearGreed: null,
  aiSentiment: null,
  lastUpdated: null,
  globalError: "Click the refresh button to load the latest data",
  loading: false, // Start with loading false since we're not loading anything initially
  loadingAi: false,
};

// Load data from localStorage on initial render
const loadInitialData = (): AppData => {
  if (typeof window === "undefined") return initialAppData;

  try {
    const savedData = localStorage.getItem("cryptoDashboardData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      // Ensure we have the latest structure with all required fields
      return {
        ...initialAppData,
        ...parsed,
        loading: false,
        loadingAi: false,
        globalError:
          parsed.globalError ||
          "Click the refresh button to load the latest data",
      };
    }
  } catch (e) {
    console.error("Failed to load saved data:", e);
  }
  return initialAppData;
};

const CryptoDashboardPage: FC = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  useEffect(() => {
    const bus = new Orchestrator();
    const dc = new DataCollector(bus);
    const ie = new IndicatorEngine(bus);
    const sg = new SignalGenerator(bus);
    const al = new AlertLogger();
    bus.register("IndicatorEngine", (m) =>
      ie.handle(m as AgentMessage<Candle>),
    );
    bus.register("SignalGenerator", (m) =>
      sg.handle(m as AgentMessage<ComputedIndicators>),
    );
    bus.register("AlertLogger", (m) =>
      al.handle(m as AgentMessage<TradeSignal>),
    );
    bus.register("DataCollector", () => {});
    dc.start();
  }, []);
  const [appData, setAppData] = useState<AppData>(initialAppData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [correlationData, setCorrelationData] = useState<
    Array<{ pair: string; value: number; timeFrame: string }>
  >([]);
  const appDataRef = useRef(appData);
  const hasInitialized = useRef(false);

  // Load saved data after mount to avoid hydration mismatch
  useEffect(() => {
    setAppData(loadInitialData());
  }, []);

  // Save to localStorage whenever appData changes
  useEffect(() => {
    if (hasInitialized.current) {
      try {
        localStorage.setItem(
          "cryptoDashboardData",
          JSON.stringify({
            btc: appData.btc,
            eth: appData.eth,
            spy: appData.spy,
            spx: appData.spx,
            dxy: appData.dxy,
            us10y: appData.us10y,
            trending: appData.trending,
            fearGreed: appData.fearGreed,
            aiSentiment: appData.aiSentiment,
            lastUpdated: appData.lastUpdated,
            globalError: appData.globalError,
          }),
        );
      } catch (e) {
        console.error("Failed to save data to localStorage:", e);
      }
    } else {
      hasInitialized.current = true;
    }
  }, [appData]);

  useEffect(() => {
    appDataRef.current = appData;
  }, [appData]);

  // Fetch DXY data from our API route
  const fetchDXYData = useCallback(async (forceRefresh = false) => {
    const CACHE_KEY = "dxy_data";
    const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache

    // Set loading state
    setAppData((prev) => ({
      ...prev,
      dxy: prev.dxy
        ? { ...prev.dxy, status: "loading" }
        : { ...getMockStockData("DXY"), status: "loading" },
    }));

    // Try to get from cache first, unless force refresh
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Only use cache if it's not expired
          if (Date.now() - timestamp < CACHE_DURATION) {
            setAppData((prev) => ({
              ...prev,
              dxy: { ...data, status: "cached" as const },
            }));
            return;
          }
        }
      } catch (e) {
        console.warn("Error reading DXY cache:", e);
      }
    }

    try {
      const response = await fetch("/api/dxy", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        next: { revalidate: 300 }, // 5 minutes
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the successful response
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        }),
      );

      setAppData((prev) => ({
        ...prev,
        dxy: {
          ...data,
          status: "fresh" as const,
        },
      }));
    } catch (error) {
      console.error("Error fetching DXY data:", error);
      // Try to use cached data even if it's stale
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data } = JSON.parse(cached);
          setAppData((prev) => ({
            ...prev,
            dxy: { ...data, status: "stale" as const },
          }));
          return;
        }
      } catch (e) {
        console.warn("Failed to read from cache:", e);
      }

      // Fall back to mock data if all else fails
      setAppData((prev) => ({
        ...prev,
        dxy: getMockStockData("DXY"),
      }));
    }
  }, []);

  const fetchBtcMovingAverages = useCallback(async () => {
    const CACHE_KEY = "btc_ma_data";
    const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

    try {
      // Try to get from cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }

      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=200&interval=daily",
      );
      if (!res.ok) {
        throw new Error(`CoinGecko API error: ${res.statusText}`);
      }

      const data = await res.json();
      const prices: number[] = data.prices.map((p: [number, number]) => p[1]);
      const volumes: number[] = data.total_volumes.map(
        (v: [number, number]) => v[1],
      );
      const ma50 = simpleMovingAverage(prices, 50);
      const ma200 = simpleMovingAverage(prices, 200);
      const maCrossover = ma50 > ma200 ? "bullish" : "bearish";
      const ema10 = exponentialMovingAverage(prices, 10);
      const ema20 = exponentialMovingAverage(prices, 20);
      const ema50 = exponentialMovingAverage(prices, 50);
      const ema200 = exponentialMovingAverage(prices, 200);
      const emaCrossover = emaCrossoverState([ema10, ema20, ema50, ema200]);
      const volumeProfile = calculateVolumeProfile(prices, volumes);
      const highestVolume = volumeProfile.reduce(
        (a, b) => (b.volume > a.volume ? b : a),
        volumeProfile[0],
      );
      const volumeProfilePrice = highestVolume?.price;
      const rsi14 = rsi(prices, 14);
      const signal = rsi14 <= 30 ? "buy" : rsi14 >= 70 ? "sell" : "hold";
      const result = {
        ma50,
        ma200,
        maCrossover,
        ema10,
        ema20,
        ema50,
        ema200,
        emaCrossover,
        volumeProfilePrice,
        rsi14,
        signal,
        lastUpdated: new Date().toISOString(),
      };

      // Cache the result
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: result,
          timestamp: Date.now(),
        }),
      );

      return result;
    } catch (e) {
      console.error("Error fetching BTC MA data:", e);
      // Return cached data even if stale
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          return JSON.parse(cached).data;
        }
      } catch (e) {
        console.warn("Failed to read from cache:", e);
      }
      return null;
    }
  }, []);

  const fetchStockRsi = useCallback(async (symbol: string) => {
    try {
      if (!FMP_API_KEY) return null;
      const res = await fetch(
        `https://financialmodelingprep.com/api/v3/historical-price-full/${encodeURIComponent(symbol)}?timeseries=20&apikey=${FMP_API_KEY}`,
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data.historical)) {
        const prices = data.historical
          .slice(0, 15)
          .map((p: any) => p.close)
          .reverse();
        return rsi(prices, 14);
      }
    } catch (e) {
      console.error("Error fetching RSI for", symbol, e);
    }
    return null;
  }, []);

  // Fetch US10Y data from our API route
  const fetchUS10YData = useCallback(async (forceRefresh = false) => {
    const CACHE_KEY = "us10y_data";
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache

    // Always try to get from cache first, unless force refresh
    if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Only use cache if it's not expired
        if (Date.now() - timestamp < CACHE_DURATION) {
          setAppData((prev) => ({
            ...prev,
            us10y: { ...data, status: "cached" as const },
          }));
          return;
        }
      }
    }

    // Use fallback data if API is not available
    const fallbackData = {
      id: "us10y",
      name: "10-Year Treasury Yield",
      symbol: "US10Y",
      price: 4.25,
      change: -0.02,
      changePercent: -0.47,
      volume: 0,
      lastUpdated: new Date().toISOString(),
      status: "cached",
      source: "fallback",
    };

    setAppData((prev) => ({
      ...prev,
      us10y: { ...fallbackData, status: "cached" as const },
    }));

    // Set loading state
    setAppData((prev) => ({
      ...prev,
      us10y: prev.us10y
        ? { ...prev.us10y, status: "loading" }
        : { ...getMockStockData("US10Y"), status: "loading" },
    }));

    try {
      // Use relative URL in production, absolute in development
      const baseUrl =
        typeof window === "undefined" ? "http://localhost:3000" : "";
      const response = await fetch(`${baseUrl}/api/us10y`, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        cache: "no-store", // Ensure we don't get cached responses
        next: { revalidate: 0 }, // Ensure we always get fresh data
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Update cache
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "us10y_data",
          JSON.stringify({
            data,
            timestamp: Date.now(),
          }),
        );
      }

      setAppData((prev) => ({
        ...prev,
        us10y: {
          ...data,
          status: "fresh" as const,
          source: "Alpha Vantage (via API)",
        },
      }));
    } catch (error) {
      console.error("Error fetching US10Y data:", error);
      // Fall back to mock data if all else fails
      setAppData((prev) => ({
        ...prev,
        us10y: getMockStockData("US10Y"),
      }));
    }
  }, []);

  const fetchCorrelationData = useCallback(async (force = false) => {
    const CACHE_KEY = "correlation_data";
    const CACHE_DURATION = 5 * 60 * 1000;

    if (!force) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setCorrelationData(data);
          return;
        }
      }
    }

    try {
      const res = await fetch("/api/correlation", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      setCorrelationData(json.data);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data: json.data, timestamp: Date.now() }),
      );
    } catch (e) {
      console.error("Error fetching correlation data:", e);
    }
  }, []);

  useEffect(() => {
    fetchCorrelationData().catch(console.error);
    const id = setInterval(
      () => {
        fetchCorrelationData().catch(console.error);
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(id);
  }, [fetchCorrelationData]);

  // Data fetching is now handled by the refresh button click
  // No automatic data fetching on component mount

  const fetchCryptoData = useCallback(async (forceRefresh = false) => {
    const CRYPTO_CACHE_KEY = "crypto_data";
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

    // Try to get from cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = localStorage.getItem(CRYPTO_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Only use cache if it's not expired
        if (Date.now() - timestamp < CACHE_DURATION) {
          setAppData((prev) => ({
            ...prev,
            ...data,
            loading: false,
            loadingAi: false,
          }));
          return;
        }
      }
    }

    // Set loading state
    setAppData((prev) => ({
      ...prev,
      loading: true,
      loadingAi: true,
      globalError: prev.globalError?.includes("Refreshing data")
        ? prev.globalError
        : null,
    }));

    const prevData = appDataRef.current;
    let partialError = false;
    let anyDataFetched = false;
    let cryptoErrorMsg: string | null = null;

    try {
      const [marketDataResponse, trendingResponse, fearGreedResponse] =
        await Promise.allSettled([
          fetch(
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&order=market_cap_desc&per_page=2&page=1&sparkline=false&price_change_percentage=24h",
          ),
          fetch("https://api.coingecko.com/api/v3/search/trending"),
          fetch("https://api.alternative.me/fng/?limit=1"),
        ]);

      let newBtcData: CoinData | null = prevData.btc;
      let newEthData: CoinData | null = prevData.eth;
      let newTrendingData: TrendingData | null = prevData.trending;
      let newFearGreedData: FearGreedData | null = prevData.fearGreed;

      if (
        marketDataResponse.status === "fulfilled" &&
        marketDataResponse.value.ok
      ) {
        const markets = await marketDataResponse.value.json();
        const btcApi = markets.find((c: any) => c.id === "bitcoin");
        const ethApi = markets.find((c: any) => c.id === "ethereum");

        if (btcApi) {
          anyDataFetched = true;
          const maData = await fetchBtcMovingAverages();
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
            status: "fresh",
            ma50: maData?.ma50,
            ma200: maData?.ma200,
            maCrossover: maData?.maCrossover,
            ema10: maData?.ema10,
            ema20: maData?.ema20,
            ema50: maData?.ema50,
            ema200: maData?.ema200,
            emaCrossover: maData?.emaCrossover,
            volumeProfilePrice: maData?.volumeProfilePrice,
            rsi14: maData?.rsi14,
            signal: maData?.signal,
          };
        } else {
          partialError = true;
          if (newBtcData) newBtcData.status = "cached_error";
          console.error("Bitcoin data not found.");
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
            status: "fresh",
          };
        } else {
          partialError = true;
          if (newEthData) newEthData.status = "cached_error";
          console.error("Ethereum data not found.");
        }
      } else {
        partialError = true;
        if (newBtcData) newBtcData.status = "cached_error";
        if (newEthData) newEthData.status = "cached_error";
        const errorText =
          marketDataResponse.status === "rejected"
            ? marketDataResponse.reason
            : marketDataResponse.value?.statusText || "market data fetch error";
        cryptoErrorMsg = `Failed to fetch crypto market data: ${errorText}. `;
        console.error(cryptoErrorMsg);
      }

      if (
        trendingResponse.status === "fulfilled" &&
        trendingResponse.value.ok
      ) {
        const trendingApi = await trendingResponse.value.json();
        if (trendingApi.coins && trendingApi.coins.length > 0) {
          anyDataFetched = true;
          newTrendingData = {
            coins: trendingApi.coins.slice(0, 7).map(
              (coin: { item: any }): TrendingCoinItem => ({
                id: coin.item.id,
                name: coin.item.name,
                symbol: coin.item.symbol.toUpperCase(),
                market_cap_rank: coin.item.market_cap_rank,
                thumb: coin.item.thumb,
                price_btc: coin.item.price_btc,
              }),
            ),
            status: "fresh",
          };
        } else {
          if (newTrendingData) newTrendingData.status = "cached_error";
          else partialError = true;
        }
      } else {
        partialError = true;
        if (newTrendingData) newTrendingData.status = "cached_error";
        const errorText =
          trendingResponse.status === "rejected"
            ? trendingResponse.reason
            : trendingResponse.value?.statusText ||
              "trending coins fetch error";
        cryptoErrorMsg = `${cryptoErrorMsg || ""}Failed to fetch trending coins: ${errorText}. `;
        console.error("Failed to fetch trending coins:", errorText);
      }

      if (
        fearGreedResponse.status === "fulfilled" &&
        fearGreedResponse.value.ok
      ) {
        const fearGreedApi = await fearGreedResponse.value.json();
        if (fearGreedApi.data && fearGreedApi.data.length > 0) {
          anyDataFetched = true;
          const fgValue = fearGreedApi.data[0];
          newFearGreedData = {
            value: fgValue.value,
            value_classification: fgValue.value_classification,
            timestamp: fgValue.timestamp,
            status: "fresh",
          };
        } else {
          if (newFearGreedData) newFearGreedData.status = "cached_error";
          else partialError = true;
        }
      } else {
        partialError = true;
        if (newFearGreedData) newFearGreedData.status = "cached_error";
        const errorText =
          fearGreedResponse.status === "rejected"
            ? fearGreedResponse.reason
            : fearGreedResponse.value?.statusText || "F&G index fetch error";
        cryptoErrorMsg = `${cryptoErrorMsg || ""}Failed to fetch F&G Index: ${errorText}. `;
        console.error("Failed to fetch Fear & Greed Index:", errorText);
      }

      let currentGlobalError = appDataRef.current.globalError || "";
      currentGlobalError = currentGlobalError
        .split(". ")
        .filter(
          (msg) =>
            !msg.toLowerCase().includes("crypto") &&
            !msg.toLowerCase().includes("trending") &&
            !msg.toLowerCase().includes("f&g") &&
            !msg.toLowerCase().includes("ai sentiment"),
        )
        .join(". ");
      if (
        currentGlobalError &&
        !currentGlobalError.endsWith(".") &&
        currentGlobalError.length > 0
      )
        currentGlobalError += ". ";

      if (partialError && !anyDataFetched && !prevData.btc) {
        cryptoErrorMsg =
          cryptoErrorMsg || "Failed to load critical market data.";
      } else if (partialError) {
        cryptoErrorMsg =
          cryptoErrorMsg || "Some crypto data might be outdated.";
      } else {
        cryptoErrorMsg = null;
      }

      const finalGlobalError = cryptoErrorMsg
        ? (currentGlobalError + cryptoErrorMsg).trim()
        : currentGlobalError.trim();

      setAppData((current) => ({
        ...current,
        btc: newBtcData,
        eth: newEthData,
        trending: newTrendingData,
        fearGreed: newFearGreedData,
        lastUpdated:
          anyDataFetched || current.lastUpdated
            ? new Date().toISOString()
            : null,
        globalError: finalGlobalError || null,
        loading: false,
      }));
    } catch (error) {
      console.error("Overall error fetching dashboard data:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Unknown error fetching crypto data.";
      setAppData((current) => ({
        ...current,
        btc: current.btc ? { ...current.btc, status: "cached_error" } : null,
        eth: current.eth ? { ...current.eth, status: "cached_error" } : null,
        trending: current.trending
          ? { ...current.trending, status: "cached_error" }
          : null,
        fearGreed: current.fearGreed
          ? { ...current.fearGreed, status: "cached_error" }
          : null,
        globalError: `${current.globalError ? current.globalError + " " : ""} ${errorMsg}`,
        loading: false,
        lastUpdated: current.lastUpdated || new Date().toISOString(),
      }));
    }
  }, []);

  const fetchStockData = useCallback(async (forceRefresh = false) => {
    const STOCK_CACHE_KEY = "stock_data";
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

    // Try to get from cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = localStorage.getItem(STOCK_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Only use cache if it's not expired
        if (Date.now() - timestamp < CACHE_DURATION) {
          setAppData((prev) => ({
            ...prev,
            ...data,
            loading: false,
          }));
          return;
        }
      }
    }
    // Only fetch fresh data if force refresh is true
    if (forceRefresh) {
      await Promise.all([fetchDXYData(true), fetchUS10YData(true)]);
    }

    setAppData((prev) => ({
      ...prev,
      spy: prev.spy
        ? { ...prev.spy, status: "loading" }
        : { ...getMockStockData("SPY"), status: "loading" },
      spx: prev.spx
        ? { ...prev.spx, status: "loading" }
        : { ...getMockStockData("^GSPC"), status: "loading" },
    }));

    let newSpyData: StockData | null = appDataRef.current.spy;
    let newSpxData: StockData | null = appDataRef.current.spx;
    const localStockErrorParts: string[] = [];

    if (!FMP_API_KEY) {
      console.warn(
        "FMP API key (NEXT_PUBLIC_FMP_API_KEY) is not set. Using mock stock data for SPY and SPX.",
      );
      localStockErrorParts.push(
        "SPY and SPX data is mocked due to missing FMP API key",
      );
      newSpyData = getMockStockData("SPY");
      newSpxData = getMockStockData("^GSPC");
    } else {
      try {
        const spyPromise = fetch(
          `https://financialmodelingprep.com/stable/quote?symbol=SPY&apikey=${FMP_API_KEY}`,
        );
        const spxPromise = fetch(
          `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent("^GSPC")}&apikey=${FMP_API_KEY}`,
        );

        const [spyResponseSettled, spxResponseSettled] =
          await Promise.allSettled([spyPromise, spxPromise]);

        if (spyResponseSettled.status === "fulfilled") {
          const spyResponse = spyResponseSettled.value;
          if (spyResponse.ok) {
            const spyDataArray = await spyResponse.json();
            if (spyDataArray && spyDataArray.length > 0) {
              const spyApiData = spyDataArray[0];
              const spyRsi = await fetchStockRsi("SPY");
              newSpyData = {
                id: spyApiData.symbol,
                name: spyApiData.name || "SPDR S&P 500 ETF",
                symbol: spyApiData.symbol,
                price: spyApiData.price,
                change: spyApiData.change,
                changePercent: spyApiData.changesPercentage,
                volume: spyApiData.volume,
                lastUpdated: spyApiData.timestamp
                  ? new Date(spyApiData.timestamp * 1000).toISOString()
                  : new Date().toISOString(),
                status: "fresh",
                rsi14: spyRsi ?? undefined,
                signal:
                  spyRsi != null
                    ? spyRsi <= 30
                      ? "buy"
                      : spyRsi >= 70
                        ? "sell"
                        : "hold"
                    : undefined,
              };
            } else {
              if (newSpyData) newSpyData.status = "cached_error";
              else newSpyData = getMockStockData("SPY");
              localStockErrorParts.push("SPY data not found in FMP response.");
            }
          } else {
            if (newSpyData) newSpyData.status = "cached_error";
            else newSpyData = getMockStockData("SPY");
            let spyError = `Failed to fetch SPY data from FMP: (status ${spyResponse.status})`;
            if (spyResponse.status === 401 || spyResponse.status === 403)
              spyError +=
                ". Please check your FMP API key and ensure it has the correct permissions";
            else if (spyResponse.status === 400)
              spyError += ". Bad request, check symbol or API endpoint";
            localStockErrorParts.push(spyError);
          }
        } else {
          if (newSpyData) newSpyData.status = "cached_error";
          else newSpyData = getMockStockData("SPY");
          localStockErrorParts.push(
            `Failed to fetch SPY data: ${spyResponseSettled.reason?.message || "Network error"}`,
          );
        }

        if (spxResponseSettled.status === "fulfilled") {
          const spxResponse = spxResponseSettled.value;
          if (spxResponse.ok) {
            const spxDataArray = await spxResponse.json();
            if (spxDataArray && spxDataArray.length > 0) {
              const spxApiData = spxDataArray[0];
              const spxRsi = await fetchStockRsi("^GSPC");
              newSpxData = {
                id: spxApiData.symbol,
                name: spxApiData.name || "S&P 500 Index",
                symbol: spxApiData.symbol,
                price: spxApiData.price,
                change: spxApiData.change,
                changePercent: spxApiData.changesPercentage,
                volume: spxApiData.volume,
                lastUpdated: spxApiData.timestamp
                  ? new Date(spxApiData.timestamp * 1000).toISOString()
                  : new Date().toISOString(),
                status: "fresh",
                rsi14: spxRsi ?? undefined,
                signal:
                  spxRsi != null
                    ? spxRsi <= 30
                      ? "buy"
                      : spxRsi >= 70
                        ? "sell"
                        : "hold"
                    : undefined,
              };
            } else {
              if (newSpxData) newSpxData.status = "cached_error";
              else newSpxData = getMockStockData("^GSPC");
              localStockErrorParts.push(
                "^GSPC data not found in FMP response.",
              );
            }
          } else {
            if (newSpxData) newSpxData.status = "cached_error";
            else newSpxData = getMockStockData("^GSPC");
            let spxError = `Failed to fetch ^GSPC data from FMP: (status ${spxResponse.status})`;
            if (spxResponse.status === 401 || spxResponse.status === 403)
              spxError +=
                ". Please check your FMP API key and ensure it has the correct permissions";
            else if (spxResponse.status === 400)
              spxError += ". Bad request, check symbol or API endpoint";
            localStockErrorParts.push(spxError);
          }
        } else {
          if (newSpxData) newSpxData.status = "cached_error";
          else newSpxData = getMockStockData("^GSPC");
          localStockErrorParts.push(
            `Failed to fetch ^GSPC data: ${spxResponseSettled.reason?.message || "Network error"}`,
          );
        }
      } catch (error) {
        console.error("Unexpected error fetching SPY/SPX stock data:", error);
        const errorText =
          error instanceof Error
            ? error.message
            : "Unknown error during SPY/SPX stock data fetch.";
        localStockErrorParts.push(`Unexpected error: ${errorText}`);
        if (newSpyData) newSpyData.status = "cached_error";
        else newSpyData = getMockStockData("SPY");
        if (newSpxData) newSpxData.status = "cached_error";
        else newSpxData = getMockStockData("^GSPC");
      }
    }

    const finalStockErrorMsg =
      localStockErrorParts.length > 0
        ? localStockErrorParts.join(". ") + "."
        : null;

    setAppData((prev) => {
      let currentGlobalError = prev.globalError || "";
      currentGlobalError = currentGlobalError
        .split(". ")
        .filter(
          (msg) =>
            !msg.toLowerCase().includes("stock") &&
            !msg.toLowerCase().includes("fmp") &&
            !msg.toLowerCase().includes("ai sentiment") &&
            !msg
              .toLowerCase()
              .includes("dxy and us10y are using placeholder data"),
        )
        .join(". ");
      if (
        currentGlobalError &&
        !currentGlobalError.endsWith(".") &&
        currentGlobalError.length > 0
      )
        currentGlobalError += ". ";

      const combinedError =
        currentGlobalError +
        (finalStockErrorMsg ? ` ${finalStockErrorMsg}` : "");

      return {
        ...prev,
        spy: newSpyData || prev.spy,
        spx: newSpxData || prev.spx,
        globalError: combinedError.trim() || null,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  // Data fetching is now handled by the refresh button click
  // No automatic data fetching on component mount

  const runAiAnalysis = useCallback(async () => {
    const currentData = appDataRef.current;
    if (currentData.loadingAi) return;

    const AI_CACHE_KEY = "ai_analysis";

    // Try to get from cache first
    const cached = localStorage.getItem(AI_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 15 * 60 * 1000) {
        // 15 minute cache
        setAppData((prev) => ({
          ...prev,
          aiSentiment: data,
          loadingAi: false,
        }));
        return;
      }
    }

    if (
      currentData.btc &&
      currentData.eth &&
      currentData.spy &&
      currentData.spx &&
      currentData.dxy &&
      currentData.us10y
    ) {
      // Only run analysis if we don't have a recent result or data has changed significantly
      const shouldRunAnalysis =
        !currentData.aiSentiment ||
        Date.now() -
          new Date(currentData.aiSentiment.timestamp || 0).getTime() >
          15 * 60 * 1000;

      if (!shouldRunAnalysis) return;

      setAppData((prev) => ({ ...prev, loadingAi: true }));

      try {
        const sentimentResult = await marketSentimentAnalysis({
          btcPrice: currentData.btc.price,
          ethPrice: currentData.eth.price,
          spyPrice: currentData.spy.price,
          spxPrice: currentData.spx.price,
          dxyPrice: currentData.dxy.price,
          us10yPrice: currentData.us10y.price,
        });

        // Only update if we got a fresh analysis or we don't have any analysis yet
        if (!sentimentResult.cached || !currentData.aiSentiment) {
          setAppData((prev) => {
            let currentGlobalError = prev.globalError || "";
            currentGlobalError = currentGlobalError
              .split(". ")
              .filter(
                (msg) => !msg.toLowerCase().includes("ai sentiment analysis"),
              )
              .join(". ")
              .trim();

            if (
              currentGlobalError &&
              !currentGlobalError.endsWith(".") &&
              currentGlobalError.length > 0
            ) {
              currentGlobalError += ". ";
            }

            return {
              ...prev,
              aiSentiment: {
                ...sentimentResult,
                timestamp: new Date().toISOString(),
              },
              loadingAi: false,
              globalError: currentGlobalError || null,
            };
          });
        } else {
          setAppData((prev) => ({ ...prev, loadingAi: false }));
        }
      } catch (error) {
        console.error("Error in AI sentiment analysis:", error);
        let aiErrorMsg = "AI sentiment analysis failed.";
        if (error instanceof Error && error.message.includes("429")) {
          aiErrorMsg = "AI sentiment analysis rate limited. Will retry later.";
        }

        setAppData((prev) => {
          let currentGlobalError = prev.globalError || "";
          currentGlobalError = currentGlobalError
            .split(". ")
            .filter(
              (msg) =>
                !msg
                  .toLowerCase()
                  .includes("ai sentiment analysis failed due to rate limits"),
            )
            .join(". ");
          if (
            currentGlobalError &&
            !currentGlobalError.endsWith(".") &&
            currentGlobalError.length > 0
          )
            currentGlobalError += ". ";

          return {
            ...prev,
            aiSentiment: prev.aiSentiment || null,
            loadingAi: false,
            globalError: (currentGlobalError + aiErrorMsg).trim(),
          };
        });
      }
    } else {
      if (!currentData.loading) {
        setAppData((prev) => ({
          ...prev,
          loadingAi: false,
          aiSentiment: null,
        }));
      }
    }
  }, []);

  useEffect(() => {
    const initialRunTimeout = setTimeout(() => {
      runAiAnalysis();
    }, INITIAL_AI_ANALYSIS_DELAY_MS);
    const aiInterval = setInterval(runAiAnalysis, AI_ANALYSIS_INTERVAL_MS);
    return () => {
      clearTimeout(initialRunTimeout);
      clearInterval(aiInterval);
    };
  }, [runAiAnalysis]);

  const navItems = [
    { label: "Metric" },
    { label: "Bitcoin (BTC)" },
    { label: "Ethereum (ETH)" },
    { label: "SPY" },
    { label: "S&P 500 (^GSPC)" },
    { label: "US Dollar (DXY)" },
    { label: "10-Yr Yield (US10Y)" },
  ];

  const renderCoinData = (
    coin: CoinData | null,
    IconComponent: ElementType,
  ) => {
    const isBitcoin = IconComponent === Bitcoin;
    const coinName = isBitcoin ? "Bitcoin" : "Ethereum";

    // Handle server-side rendering and initial client render
    if (typeof window === "undefined" || !isClient) {
      return (
        <div className="space-y-3 p-1">
          <div className="p-4 text-center">Loading {coinName} data...</div>
        </div>
      );
    }

    // Client-side rendering after initial hydration
    const isLoading = appData.loading && !coin;

    return (
      <div className="space-y-3 p-1">
        {isLoading ? (
          <div className="p-4 text-center">Loading {coinName} data...</div>
        ) : !coin ? (
          <div className="p-4 text-center">
            Data unavailable for {coinName}.
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 mb-2">
              <Image
                data-ai-hint="coin logo"
                src={coin.image}
                alt={coin.name}
                width={32}
                height={32}
                className="rounded-full"
              />
              <ValueDisplay
                label="Price"
                value={coin.price}
                unit={coin.symbol.toUpperCase()}
                variant="highlight"
                isLoading={coin.status === "loading"}
                valueClassName="text-accent"
              />
            </div>
            <ValueDisplay
              label="24h Change"
              value={`${coin.change24h?.toFixed(2) ?? "N/A"}%`}
              valueClassName={
                coin.change24h >= 0 ? "text-green-500" : "text-red-500"
              }
              isLoading={coin.status === "loading"}
            />
            <ValueDisplay
              label="24h High"
              value={coin.high24h ?? "N/A"}
              unit={coin.symbol.toUpperCase()}
              isLoading={coin.status === "loading"}
            />
            <ValueDisplay
              label="24h Low"
              value={coin.low24h ?? "N/A"}
              unit={coin.symbol.toUpperCase()}
              isLoading={coin.status === "loading"}
            />
            <ValueDisplay
              label="Volume"
              value={coin.volume24h ?? "N/A"}
              unit={coin.symbol.toUpperCase()}
              isLoading={coin.status === "loading"}
            />
            <ValueDisplay
              label="Market Cap"
              value={coin.marketCap ?? "N/A"}
              unit={coin.symbol.toUpperCase()}
              isLoading={coin.status === "loading"}
            />
            <ValueDisplay
              label="RSI (14)"
              value={coin.rsi14?.toFixed(2) ?? "N/A"}
              valueClassName={
                coin.rsi14 !== undefined
                  ? coin.rsi14 >= 70
                    ? "text-red-500"
                    : coin.rsi14 <= 30
                      ? "text-green-500"
                      : ""
                  : ""
              }
              isLoading={coin.status === "loading"}
            />
            <ValueDisplay
              label="Signal"
              value={coin.signal ? coin.signal.toUpperCase() : "N/A"}
              valueClassName={
                coin.signal === "buy"
                  ? "text-green-500"
                  : coin.signal === "sell"
                    ? "text-red-500"
                    : ""
              }
              isLoading={coin.status === "loading"}
            />
            {/* Always render MA section but hide if no data */}
            <div className={!coin.ma50 || !coin.ma200 ? "hidden" : ""}>
              <ValueDisplay
                label="MA 50"
                value={coin.ma50?.toFixed(2) ?? "N/A"}
                unit={coin.symbol.toUpperCase()}
                isLoading={coin.status === "loading"}
              />
              <ValueDisplay
                label="MA 200"
                value={coin.ma200?.toFixed(2) ?? "N/A"}
                unit={coin.symbol.toUpperCase()}
                isLoading={coin.status === "loading"}
              />
              <ValueDisplay
                label="MA Crossover"
                value={coin.maCrossover === "bullish" ? "Bullish" : "Bearish"}
                isLoading={coin.status === "loading"}
              />
              {coin.ema10 !== undefined && (
                <ValueDisplay
                  label="EMA 10"
                  value={coin.ema10.toFixed(2)}
                  unit={coin.symbol.toUpperCase()}
                  isLoading={coin.status === "loading"}
                />
              )}
              {coin.emaCrossover && (
                <ValueDisplay
                  label="EMA Crossover"
                  value={coin.emaCrossover}
                  isLoading={coin.status === "loading"}
                />
              )}
              {coin.ema20 !== undefined && (
                <ValueDisplay
                  label="EMA 20"
                  value={coin.ema20.toFixed(2)}
                  unit={coin.symbol.toUpperCase()}
                  isLoading={coin.status === "loading"}
                />
              )}
              {coin.ema50 !== undefined && (
                <ValueDisplay
                  label="EMA 50"
                  value={coin.ema50.toFixed(2)}
                  unit={coin.symbol.toUpperCase()}
                  isLoading={coin.status === "loading"}
                />
              )}
              {coin.ema200 !== undefined && (
                <ValueDisplay
                  label="EMA 200"
                  value={coin.ema200.toFixed(2)}
                  unit={coin.symbol.toUpperCase()}
                  isLoading={coin.status === "loading"}
                />
              )}
              {coin.volumeProfilePrice !== undefined && (
                <ValueDisplay
                  label="High Vol Price"
                  value={coin.volumeProfilePrice.toFixed(2)}
                  unit="USD"
                  isLoading={coin.status === "loading"}
                />
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderStockData = (
    stock: StockData | null,
    IconComponent: ElementType,
  ) => {
    // Use a consistent title based on the stock symbol to prevent hydration mismatch
    const title =
      stock?.symbol === "SPY"
        ? "SPDR S&P 500 ETF Trust"
        : stock?.symbol === "^GSPC"
          ? "S&P 500 Index"
          : stock?.symbol === "DXY"
            ? "US Dollar Index"
            : stock?.symbol === "US10Y" || stock?.symbol === "^TNX"
              ? "US 10-Year Yield"
              : "Market Data";

    // Handle server-side rendering and initial client render
    if (typeof window === "undefined" || !isClient) {
      return (
        <div className="space-y-3 p-1">
          <div className="p-4 text-center">Loading {title} data...</div>
        </div>
      );
    }

    // Client-side rendering after initial hydration
    const unit =
      stock?.symbol === "US10Y" || stock?.symbol === "^TNX" ? "%" : "USD";
    const isPlaceholder = stock?.status === "cached_error";

    return (
      <div className="space-y-3 p-1">
        {!stock ? (
          <div className="p-4 text-center">Data unavailable for {title}.</div>
        ) : (
          <>
            <div className="flex items-center space-x-2 mb-2">
              <IconComponent className="h-6 w-6 text-muted-foreground" />
              <ValueDisplay
                label="Price"
                value={stock.price}
                unit={unit}
                variant="highlight"
                isLoading={stock.status === "loading"}
                valueClassName="text-accent"
              />
            </div>
            <ValueDisplay
              label="Change"
              value={stock.change?.toFixed(2) ?? "N/A"}
              unit={unit}
              isLoading={stock.status === "loading"}
            />
            <ValueDisplay
              label="Change %"
              value={`${stock.changePercent?.toFixed(2) ?? "0.00"}%`}
              valueClassName={
                (stock.changePercent ?? 0) >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }
              isLoading={stock.status === "loading"}
            />
            {/* Always render volume but hide if 0 */}
            <div className={!stock.volume ? "hidden" : ""}>
              <ValueDisplay
                label="Volume"
                value={stock.volume}
                isLoading={stock.status === "loading"}
              />
            </div>
            <ValueDisplay
              label="RSI (14)"
              value={stock.rsi14?.toFixed(2) ?? "N/A"}
              valueClassName={
                stock.rsi14 !== undefined
                  ? stock.rsi14 >= 70
                    ? "text-red-500"
                    : stock.rsi14 <= 30
                      ? "text-green-500"
                      : ""
                  : ""
              }
              isLoading={stock.status === "loading"}
            />
            <ValueDisplay
              label="Signal"
              value={stock.signal ? stock.signal.toUpperCase() : "N/A"}
              valueClassName={
                stock.signal === "buy"
                  ? "text-green-500"
                  : stock.signal === "sell"
                    ? "text-red-500"
                    : ""
              }
              isLoading={stock.status === "loading"}
            />
            {isPlaceholder && (
              <p className="text-xs text-muted-foreground/80 text-center pt-1">
                (Using placeholder data)
              </p>
            )}
          </>
        )}
      </div>
    );
  };

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    const startTime = Date.now();

    try {
      // Set loading state
      setAppData((prev) => ({
        ...prev,
        globalError: "Refreshing data...",
        loading: true,
        loadingAi: true,
      }));

      // Clear any existing errors
      setAppData((prev) => ({
        ...prev,
        globalError: null,
      }));

      // Fetch all data in parallel with force refresh
      const [dxyResult, us10yResult, cryptoResult, stockResult] =
        await Promise.allSettled([
          fetchDXYData(true).catch((e) => {
            console.error("Error in DXY fetch:", e);
            return null;
          }),
          fetchUS10YData(true).catch((e) => {
            console.error("Error in US10Y fetch:", e);
            return null;
          }),
          fetchCryptoData(true).catch((e) => {
            console.error("Error in crypto fetch:", e);
            return null;
          }),
          fetchStockData(true).catch((e) => {
            console.error("Error in stock fetch:", e);
            return null;
          }),
        ]);

      // Check if we have all required data for AI analysis
      const hasAllData = [
        dxyResult,
        us10yResult,
        cryptoResult,
        stockResult,
      ].every(
        (result) => result.status === "fulfilled" && result.value !== null,
      );

      // Run AI analysis if we have all the required data
      if (hasAllData) {
        try {
          await runAiAnalysis();
        } catch (e) {
          console.error("Error in AI analysis:", e);
        }
      }

      // Calculate refresh duration
      const refreshDuration = Date.now() - startTime;

      // Clear loading state and update last updated time
      setAppData((prev) => ({
        ...prev,
        loading: false,
        loadingAi: false,
        lastUpdated: new Date().toISOString(),
        globalError: null,
      }));

      console.log(`Data refresh completed in ${refreshDuration}ms`);
    } catch (error) {
      console.error("Error during refresh:", error);
      setAppData((prev) => ({
        ...prev,
        globalError: `Error refreshing data: ${error instanceof Error ? error.message : "Unknown error"}`,
        loading: false,
        loadingAi: false,
      }));
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  // Helper function to get status that's consistent between server and client
  const getStatus = (
    data: any,
  ): "fresh" | "cached_error" | "error" | "loading" | "waiting" | null => {
    // On server, always return 'loading' to match initial client render
    if (typeof window === "undefined") return "loading";

    if (!data) return "error";
    if (data.status)
      return data.status as
        | "fresh"
        | "cached_error"
        | "error"
        | "loading"
        | "waiting";
    if (data.isLoading) return "loading";
    if (data.error) return "error";
    if (data.lastFetched) return "fresh";
    return "loading";
  };

  const hasLoadedData =
    isClient &&
    (appData.btc ||
      appData.eth ||
      appData.spy ||
      appData.spx ||
      appData.dxy ||
      appData.us10y);

  // Only render the welcome message on the client side
  const renderWelcomeMessage = () => {
    if (!isClient || hasLoadedData || isRefreshing) return null;

    return (
      <div className="bg-primary/10 border border-primary text-primary p-6 rounded-lg mb-6 text-center">
        <p className="text-lg font-medium mb-2">Welcome to Crypto Pulse</p>
        <p className="mb-4">
          Click the refresh button above to load the latest market data
        </p>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? "Loading..." : "Load Data"}
        </button>
      </div>
    );
  };

  // Only render the error message on the client side
  const renderErrorMessage = () => {
    if (!isClient || !appData.globalError) return null;

    return (
      <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md mb-4 text-sm">
        <strong>Notice:</strong> {appData.globalError}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      <DashboardHeader
        title="Crypto Pulse"
        navItems={navItems}
        onRefresh={handleRefresh}
        isLoading={isRefreshing}
      />
      <main className="flex-grow container mx-auto px-2 py-4 sm:px-4 sm:py-6">
        {renderWelcomeMessage()}
        {renderErrorMessage()}

        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <DataCard
            title="Bitcoin (BTC)"
            icon={Bitcoin}
            status={getStatus(appData.btc)}
            className="xl:col-span-1"
          >
            {renderCoinData(appData.btc, Bitcoin)}
          </DataCard>

          <DataCard
            title="BTC Chart"
            icon={BarChart3}
            status="fresh"
            className="sm:col-span-2 lg:col-span-2"
          >
            <MarketChart asset="BTC" interval="5m" />
          </DataCard>

          <DataCard
            title="Ethereum (ETH)"
            icon={Shapes}
            status={getStatus(appData.eth)}
            className="xl:col-span-1"
          >
            {renderCoinData(appData.eth, Shapes)}
          </DataCard>

          <DataCard
            title={appData.spy?.name || "SPDR S&P 500 ETF (SPY)"}
            icon={Briefcase}
            status={getStatus(appData.spy)}
          >
            {renderStockData(appData.spy, Briefcase)}
          </DataCard>

          <DataCard
            title={appData.spx?.name || "S&P 500 Index (^GSPC)"}
            icon={BarChart3}
            status={getStatus(appData.spx)}
          >
            {renderStockData(appData.spx, BarChart3)}
          </DataCard>

          <DataCard
            title={appData.dxy?.name || "US Dollar Index (DXY)"}
            icon={DollarSign}
            status={getStatus(appData.dxy)}
          >
            {renderStockData(appData.dxy, DollarSign)}
          </DataCard>

          <DataCard
            title={appData.us10y?.name || "US 10-Year Yield (^TNX)"}
            icon={Landmark}
            status={getStatus(appData.us10y)}
          >
            {renderStockData(appData.us10y, Landmark)}
          </DataCard>

          <DataCard
            title="Fear & Greed Index"
            icon={Gauge}
            status={appData.fearGreed?.value_classification || ""}
            className="sm:col-span-1"
          >
            {!isClient ? (
              <div className="p-4 text-center">
                Loading Fear & Greed data...
              </div>
            ) : appData.fearGreed ? (
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-primary">
                  {appData.fearGreed.value}
                </p>
                <p className="text-muted-foreground">
                  {appData.fearGreed.value_classification}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className={`h-2.5 rounded-full ${
                      appData.fearGreed.value < 20
                        ? "bg-red-600"
                        : appData.fearGreed.value < 40
                          ? "bg-orange-400"
                          : appData.fearGreed.value < 60
                            ? "bg-yellow-400"
                            : appData.fearGreed.value < 80
                              ? "bg-lime-400"
                              : "bg-green-600"
                    }`}
                    style={{ width: `${appData.fearGreed.value}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {appData.fearGreed.value < 20
                    ? "Extreme Fear"
                    : appData.fearGreed.value < 40
                      ? "Fear"
                      : appData.fearGreed.value < 60
                        ? "Neutral"
                        : appData.fearGreed.value < 80
                          ? "Greed"
                          : "Extreme Greed"}
                </p>
              </div>
            ) : appData.loading ? (
              <p className="text-center p-4">Loading F&G Index...</p>
            ) : (
              <p className="text-center p-4">
                Fear & Greed Index data unavailable.
              </p>
            )}
          </DataCard>

          {/* Correlation Panel */}
          <DataCard
            title="Market Correlations"
            icon={BarChart2}
            status="fresh"
            className="sm:col-span-2 lg:col-span-2"
          >
            {correlationData.length > 0 ? (
              <CorrelationPanel data={correlationData} />
            ) : (
              <p className="text-center p-4">Calculating correlations...</p>
            )}
          </DataCard>
          <OrderBookWidget />
          <VolumeSpikeChart />
          <VolumeProfileChart />
          <IchimokuWidget />
          <OrderFlowWidget />
          <VwapWidget />
          <BollingerWidget />
          <EmaCrossoverWidget />
          <RsiWidget />
          <StochRsiWidget />
          <AtrWidget />
          <SessionTimerWidget />
          <SignalCard />
          <DataCard
            title="Signal History"
            icon={Brain}
            status="fresh"
            className="xl:col-span-1"
          >
            <SignalHistory />
          </DataCard>

          <DataCard
            title="AI Market Sentiment"
            icon={Brain}
            status={
              appData.aiSentiment?.status ??
              (appData.loadingAi ? "loading" : "error")
            }
            className="sm:col-span-2 lg:col-span-2"
          >
            {appData.loadingAi ? (
              <p className="text-center p-4">
                Generating AI sentiment analysis...
              </p>
            ) : appData.aiSentiment ? (
              <div className="space-y-2 text-sm p-1">
                <ValueDisplay
                  label="Overall Sentiment"
                  value={appData.aiSentiment.overallSentiment}
                />
                <ValueDisplay
                  label="Bitcoin (BTC) Sentiment"
                  value={appData.aiSentiment.btcSentiment}
                />
                <ValueDisplay
                  label="Ethereum (ETH) Sentiment"
                  value={appData.aiSentiment.ethSentiment}
                />
                <ValueDisplay
                  label="Stock Market Sentiment"
                  value={appData.aiSentiment.stockMarketSentiment}
                />
              </div>
            ) : appData.btc &&
              appData.eth &&
              appData.spy &&
              appData.spx &&
              appData.dxy &&
              appData.us10y ? (
              <p className="text-center p-4">
                AI sentiment analysis will be generated shortly. Waiting for
                next scheduled run.
              </p>
            ) : (
              <p className="text-center p-4">AI sentiment data unavailable.</p>
            )}
          </DataCard>

          <DataCard
            title="Top 7 Trending Coins"
            icon={TrendingUp}
            status={appData.trending?.length ? "active" : ""}
            className="sm:col-span-1"
          >
            {!isClient ? (
              <div className="p-4 text-center">
                Loading trending coins data...
              </div>
            ) : appData.trending && appData.trending.length > 0 ? (
              <div className="space-y-2">
                {appData.trending.map((coin, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {coin.symbol.toUpperCase()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {coin.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-sm font-medium ${coin.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {coin.price_change_percentage_24h >= 0 ? "+" : ""}
                        {coin.price_change_percentage_24h?.toFixed(2)}%
                      </span>
                      <span className="text-sm font-medium">
                        ${coin.current_price?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : appData.loading ? (
              <p className="text-center p-4">Loading trending coins...</p>
            ) : (
              <p className="text-center p-4">
                Trending coins data unavailable.
              </p>
            )}
          </DataCard>
        </div>

        <footer className="text-center mt-8 py-4 border-t">
          {appData.lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(appData.lastUpdated).toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Crypto Pulse - Financial data displayed is for informational
            purposes only.
            {!FMP_API_KEY &&
              " Live SPY/SPX data requires NEXT_PUBLIC_FMP_API_KEY."}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Crypto data powered by{" "}
            <a
              href="https://www.coingecko.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              CoinGecko
            </a>{" "}
            and{" "}
            <a
              href="https://alternative.me/crypto/fear-and-greed-index/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              alternative.me
            </a>
            .
            {FMP_API_KEY && " SPY/SPX data powered by Financial Modeling Prep."}
          </p>
        </footer>
      </main>
    </div>
  );
};

export default CryptoDashboardPage;
