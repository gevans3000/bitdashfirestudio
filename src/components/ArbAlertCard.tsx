'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface Arbitrage {
  buy: string;
  sell: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  netProfit: number;
}

export default function ArbAlertCard() {
  const [arb, setArb] = useState<Arbitrage | null>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    const fetchArb = async () => {
      try {
        const res = await fetch('/api/arbitrage');
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.buy) {
          setArb(data);
        } else {
          setArb(null);
        }
      } catch (err) {
        console.error('Failed to fetch arbitrage', err);
      }
    };
    fetchArb();
    const interval = setInterval(fetchArb, 10000);
    return () => clearInterval(interval);
  }, [enabled]);

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
        />
        <span className="text-sm">{enabled ? 'Alerts On' : 'Alerts Off'}</span>
      </div>
      {arb && enabled && (
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Arbitrage Opportunity</CardTitle>
            <CardDescription>
              Buy on {arb.buy}, sell on {arb.sell}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Buy Price</span>
              <span>${arb.buyPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sell Price</span>
              <span>${arb.sellPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Spread</span>
              <span>${arb.spread.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Net Profit</span>
              <span>${arb.netProfit.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="#">Go to Trade</a>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
