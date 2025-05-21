import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type CorrelationData = {
  pair: string;
  value: number;
  timeFrame: string;
};

interface CorrelationPanelProps {
  data: CorrelationData[];
}

export function CorrelationPanel({ data }: CorrelationPanelProps) {
  const getCorrelationColor = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue > 0.7) return 'text-red-500';
    if (absValue > 0.4) return 'text-orange-500';
    if (absValue > 0.1) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Correlation Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {item.pair} ({item.timeFrame})
              </span>
              <span className={`text-sm font-medium ${getCorrelationColor(item.value)}`}>
                {item.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
