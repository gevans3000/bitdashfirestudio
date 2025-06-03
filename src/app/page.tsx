"use client";
import DashboardHeader from "@/components/DashboardHeader";
import MarketChart from "@/components/MarketChart";
import BollingerWidget from "@/components/BollingerWidget";
import RsiWidget from "@/components/RsiWidget";
import EmaCrossoverWidget from "@/components/EmaCrossoverWidget";
import TradeSignalLog from "@/components/TradeSignalLog";

export default function CryptoDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <DashboardHeader title="BTC Dashboard" navItems={[]} />
      <main className="container mx-auto p-4 space-y-4">
        <MarketChart asset="BTC" interval="5m" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BollingerWidget />
          <EmaCrossoverWidget />
          <RsiWidget />
          <TradeSignalLog />
        </div>
      </main>
    </div>
  );
}
