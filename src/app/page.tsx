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
import type { AppData, CoinData } from "@/types";
import {
  Bitcoin,
  Shapes,
  BarChart2,
} from "lucide-react";

import MarketChart from "@/components/MarketChart";
import AtrWidget from "@/components/AtrWidget";
import VwapWidget from "@/components/VwapWidget";
import PrevDayBands from "@/components/PrevDayBands";
import StochRsiWidget from "@/components/StochRsiWidget";
import RsiWidget from "@/components/RsiWidget";
import BollingerWidget from "@/components/BollingerWidget";
import OrderBookWidget from "@/components/OrderBookWidget";
import OrderBookHeatmap from "@/components/OrderBookHeatmap";
import VolumeSpikeChart from "@/components/VolumeSpikeChart";
import VolumeProfileChart from "@/components/VolumeProfileChart";
import VolumePeakDistance from "@/components/VolumePeakDistance";
import OpenInterestDeltaChart from "@/components/OpenInterestDeltaChart";
import FundingCountdown from "@/components/FundingCountdown";
import BbWidthAlert from "@/components/BbWidthAlert";
import IchimokuWidget from "@/components/IchimokuWidget";
import OrderFlowWidget from "@/components/OrderFlowWidget";
import FundingRateWidget from "@/components/FundingRateWidget";
import TxnCountWidget from "@/components/TxnCountWidget";
import SessionTimerWidget from "@/components/SessionTimerWidget";
import EmaCrossoverWidget from "@/components/EmaCrossoverWidget";
import { Orchestrator } from "@/lib/agents/Orchestrator";
import { DataCollector } from "@/lib/agents/DataCollector";
import { IndicatorEngine } from "@/lib/agents/IndicatorEngine";
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


const initialAppData: AppData = {
  btc: null,
  eth: null,
  lastUpdated: null,
  globalError: "Click the refresh button to load the latest data",
  loading: false, // Start with loading false since we're not loading anything initially
};

// Load data from localStorage on initial render
const loadInitialData = (): AppData => {
  if (typeof window === "undefined") return initialAppData;

  try {
    const savedData = localStorage.getItem("cryptoDashboardData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      const { trending: _t, fearGreed: _f, spy: _s1, spx: _s2, dxy: _d, us10y: _u, ...rest } = parsed;
      return {
        ...initialAppData,
        ...rest,
        loading: false,
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
    bus.register("IndicatorEngine", (m) =>
      ie.handle(m as AgentMessage<Candle>),
    );
    bus.register("DataCollector", () => {});
    dc.start();
  }, []);
  const [appData, setAppData] = useState<AppData>(initialAppData);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
          }));
          return;
        }
      }
    }

    // Set loading state
    setAppData((prev) => ({
      ...prev,
      loading: true,
      globalError: prev.globalError?.includes("Refreshing data")
        ? prev.globalError
        : null,
    }));

    const prevData = appDataRef.current;
    let partialError = false;
    let anyDataFetched = false;
    let cryptoErrorMsg: string | null = null;

    try {
      const [marketDataResponse] = await Promise.allSettled([
        fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&order=market_cap_desc&per_page=2&page=1&sparkline=false&price_change_percentage=24h",
        ),
      ]);

      let newBtcData: CoinData | null = prevData.btc;
      let newEthData: CoinData | null = prevData.eth;

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



      let currentGlobalError = appDataRef.current.globalError || "";
      currentGlobalError = currentGlobalError
        .split(". ")
        .filter(
          (msg) =>
            !msg.toLowerCase().includes("crypto") &&
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
        globalError: `${current.globalError ? current.globalError + " " : ""} ${errorMsg}`,
        loading: false,
        lastUpdated: current.lastUpdated || new Date().toISOString(),
      }));
    }
  }, []);


  // Data fetching is now handled by the refresh button click
  // No automatic data fetching on component mount


  const navItems = [
    { label: "Metric" },
    { label: "Bitcoin (BTC)" },
    { label: "Ethereum (ETH)" },
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
      }));

      // Clear any existing errors
      setAppData((prev) => ({
        ...prev,
        globalError: null,
      }));

      // Fetch all data in parallel with force refresh
      await fetchCryptoData(true).catch((e) => {
        console.error("Error in crypto fetch:", e);
        return null;
      });

      // Calculate refresh duration
      const refreshDuration = Date.now() - startTime;

      // Clear loading state and update last updated time
      setAppData((prev) => ({
        ...prev,
        loading: false,
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
    (appData.btc || appData.eth);

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


          <OrderBookWidget />
          <OrderBookHeatmap />
          <VolumeSpikeChart />
          <VolumeProfileChart />
          <VolumePeakDistance />
          <OpenInterestDeltaChart />
          <IchimokuWidget />
          <OrderFlowWidget />
          <FundingRateWidget />
          <FundingCountdown />
          <TxnCountWidget />
          <VwapWidget />
          <PrevDayBands />
          <BollingerWidget />
          <EmaCrossoverWidget />
          <RsiWidget />
          <StochRsiWidget />
          <AtrWidget />
          <SessionTimerWidget />
          <BbWidthAlert />


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
            </a>
            .
          </p>
        </footer>
      </main>
    </div>
  );
};

export default CryptoDashboardPage;
