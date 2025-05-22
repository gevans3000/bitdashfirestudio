interface DataQualityStats {
  lastUpdated: Date;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  lastValidation: Date;
  validationPassed: boolean;
  value: number;
}

const dataQuality: Record<string, DataQualityStats> = {};

export function logDataQuality(
  metric: 'DXY' | 'US10Y', 
  value: number, 
  source: string, 
  isValid: boolean
): void {
  dataQuality[metric] = {
    lastUpdated: new Date(),
    source,
    confidence: source.includes('FRED') ? 'high' : 'medium',
    lastValidation: new Date(),
    validationPassed: isValid,
    value
  };
  
  // Log to console for now, could be extended to send to monitoring service
  if (!isValid) {
    console.warn(`Data quality issue detected for ${metric} from ${source}`);
  }
}

export function getDataQuality(metric: 'DXY' | 'US10Y'): DataQualityStats | null {
  return dataQuality[metric] || null;
}

export function getDataQualityStatus(metric: 'DXY' | 'US10Y'): string {
  const stats = dataQuality[metric];
  if (!stats) return 'unknown';
  
  if (!stats.validationPassed) return 'error';
  if (stats.confidence === 'high') return 'excellent';
  if (stats.confidence === 'medium') return 'good';
  return 'fair';
}
