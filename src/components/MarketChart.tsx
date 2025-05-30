'use client';
import { useEffect } from 'react';

interface Props {
  asset: string;
  interval: string;
}

declare global {
  interface Window {
    TradingView?: { widget: (opts: Record<string, unknown>) => void };
  }
}

export default function MarketChart({ asset, interval }: Props) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.onload = () => init();
      document.body.appendChild(script);
    } else {
      init();
    }

    function init() {
      window.TradingView?.widget({
        symbol: asset + 'USDT',
        interval: interval.replace('m', ''),
        container_id: `tv-${asset}`,
        width: '100%',
        height: 400,
        studies: ['BB@tv-basicstudies', 'EMA@tv-basicstudies', 'EMA@tv-basicstudies'],
        hide_top_toolbar: true,
        hide_legend: false,
      });
    }
  }, [asset, interval]);

  return <div id={`tv-${asset}`} className="w-full h-[400px]" />;
}
