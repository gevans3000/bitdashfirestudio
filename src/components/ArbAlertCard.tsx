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
  const API_URL = process.env.NEXT_PUBLIC_ARBITRAGE_API || 'http://localhost:3001/api/arbitrage';

  useEffect(() => {
    if (!enabled) return;
    const fetchArb = async () => {
      try {
        const res = await fetch(API_URL);
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
  }, [enabled, API_URL]);

  return (
    <Card className="max-w-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Arbitrage Opportunity</CardTitle>
          {arb && (
            <CardDescription>
              Buy on {arb.buy}, sell on {arb.sell}
            </CardDescription>
          )}
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
        />
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {!arb && <p>No arbitrage opportunity detected.</p>}
        {arb && (
          <>
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
          </>
        )}
      </CardContent>
      <CardFooter>
        {arb && (
          <Button asChild>
            <a href="#">Go to Trade</a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
