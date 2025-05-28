'use client';

import { useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import DataCard from '@/components/DataCard';
import ValueDisplay from '@/components/ValueDisplay';

interface MarketData {
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export default function RefreshDemoPage() {
  const [dxy, setDxy] = useState<MarketData | null>(null);
  const [us10y, setUs10y] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dxyRes, us10yRes] = await Promise.all([
        fetch('/api/dxy').then(res => res.json()),
        fetch('/api/us10y').then(res => res.json())
      ]);
      setDxy(dxyRes);
      setUs10y(us10yRes);
    } catch (err) {
      console.error('Error fetching macro data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <DashboardHeader
        title="Macro Data Refresh Demo"
        navItems={[]}
        onRefresh={fetchData}
        isLoading={loading}
      />
      <main className="container mx-auto p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataCard title="US Dollar Index (DXY)">
            {dxy ? (
              <>
                <ValueDisplay label="Price" value={dxy.price} unit="USD" />
                <ValueDisplay label="Change" value={dxy.change} unit="USD" />
                <ValueDisplay label="Change %" value={`${dxy.changePercent.toFixed(2)}%`} />
                <ValueDisplay label="Last Updated" value={new Date(dxy.lastUpdated).toLocaleString()} />
              </>
            ) : (
              <p className="p-2 text-center">Click refresh to load data.</p>
            )}
          </DataCard>
          <DataCard title="10-Year Treasury Yield">
            {us10y ? (
              <>
                <ValueDisplay label="Yield" value={us10y.price} unit="%" />
                <ValueDisplay label="Change" value={us10y.change} unit="%" />
                <ValueDisplay label="Change %" value={`${us10y.changePercent.toFixed(2)}%`} />
                <ValueDisplay label="Last Updated" value={new Date(us10y.lastUpdated).toLocaleString()} />
              </>
            ) : (
              <p className="p-2 text-center">Click refresh to load data.</p>
            )}
          </DataCard>
        </div>
      </main>
    </div>
  );
}
