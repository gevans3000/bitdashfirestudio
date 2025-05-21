import type { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ValueDisplayProps {
  label: string;
  value: ReactNode;
  unit?: string;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  isLoading?: boolean;
  variant?: 'default' | 'highlight';
}

const ValueDisplay: FC<ValueDisplayProps> = ({
  label,
  value,
  unit,
  className,
  valueClassName,
  labelClassName,
  isLoading = false,
  variant = 'default',
}) => {
  const baseValueClass = "font-medium";
  const highlightValueClass = "text-lg md:text-xl font-bold text-primary";

  return (
    <div className={cn("flex justify-between items-baseline py-1.5 border-b border-border/50 last:border-b-0", className)}>
      <span className={cn("text-sm text-muted-foreground", labelClassName)}>{label}:</span>
      {isLoading ? (
        <span className={cn("text-sm text-muted-foreground animate-pulse", valueClassName)}>Loading...</span>
      ) : (
        <span
          className={cn(
            "text-sm text-right",
            variant === 'default' ? baseValueClass : highlightValueClass,
            valueClassName
          )}
        >
          {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: value > 100 ? 0 : (value < 1 ? 4 : 2) }) : value}
          {unit && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}
        </span>
      )}
    </div>
  );
};

export default ValueDisplay;
