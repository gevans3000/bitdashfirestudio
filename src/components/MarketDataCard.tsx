import { useEffect, useState } from 'react';
import { fetchDXY, fetchUS10Y } from '@/lib/marketData';
import { logDataQuality, getDataQualityStatus } from '@/lib/dataQuality';

interface MarketDataCardProps {
  title: string;
  metric: 'DXY' | 'US10Y';
  formatter?: (value: number) => string;
  className?: string;
}

export function MarketDataCard({ 
  title, 
  metric, 
  formatter = (val) => val.toFixed(2),
  className = '' 
}: MarketDataCardProps) {
  const [value, setValue] = useState<number | null>(null);
  const [source, setSource] = useState<string>('Loading...');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<string>('loading');

  const fetchData = async () => {
    try {
      const fetchFn = metric === 'DXY' ? fetchDXY : fetchUS10Y;
      const { value: newValue, source: newSource } = await fetchFn();
      
      setValue(newValue);
      setSource(newSource);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
      
      // Log data quality
      const isValid = metric === 'DXY' 
        ? newValue >= 70 && newValue <= 120
        : newValue >= 0 && newValue <= 20;
      
      logDataQuality(metric, newValue, newSource, isValid);
      setQuality(getDataQualityStatus(metric));
    } catch (err) {
      console.error(`Error fetching ${metric}:`, err);
      setError('Failed to load data');
      setQuality('error');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [metric]);

  const qualityColors = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    fair: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    loading: 'bg-gray-100 text-gray-800',
  };

  const qualityLabels = {
    excellent: 'High Confidence',
    good: 'Good',
    fair: 'Fair',
    error: 'Error',
    loading: 'Loading...',
  };

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${qualityColors[quality as keyof typeof qualityColors]}`}>
          {qualityLabels[quality as keyof typeof qualityLabels]}
        </span>
      </div>
      
      <div className="text-2xl font-bold my-2">
        {error ? (
          <span className="text-red-500">{error}</span>
        ) : value !== null ? (
          formatter(value)
        ) : (
          '--.--'
        )}
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Source: {source}</span>
        {lastUpdated && <span>Updated: {lastUpdated}</span>}
      </div>
      
      <div className="mt-2 text-xs">
        <button 
          onClick={fetchData}
          className="text-blue-600 hover:text-blue-800"
          disabled={quality === 'loading'}
        >
          {quality === 'loading' ? 'Loading...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}
