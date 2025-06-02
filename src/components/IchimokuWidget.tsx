"use client";
import { useEffect, useState } from "react";
import DataCard from "@/components/DataCard";

interface IchiResp {
  tenkan: number;
  kijun: number;
  spanA: number;
  spanB: number;
  price: number;
  status: string;
}

export default function IchimokuWidget() {
  const [data, setData] = useState<IchiResp | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/ichimoku");
        if (!res.ok) throw new Error("API error");
        setData(await res.json());
      } catch (e) {
        console.error("Ichimoku fetch failed", e);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <DataCard title="Ichimoku Cloud">
      {data ? (
        <div className="text-center space-y-1">
          <p className="text-sm">Tenkan {data.tenkan.toFixed(2)}</p>
          <p className="text-sm">Kijun {data.kijun.toFixed(2)}</p>
          <p className="text-sm">SpanA {data.spanA.toFixed(2)}</p>
          <p className="text-sm">SpanB {data.spanB.toFixed(2)}</p>
        </div>
      ) : (
        <p className="text-center p-4">Loading Ichimoku...</p>
      )}
    </DataCard>
  );
}
