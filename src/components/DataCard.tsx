import type { FC, ReactNode, ElementType } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface DataCardProps {
  title: string;
  description?: string;
  icon?: ElementType;
  status?: 'fresh' | 'cached_error' | 'error' | 'loading' | null;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

const DataCard: FC<DataCardProps> = ({ title, description, icon: Icon, status, children, className, contentClassName }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'fresh': return 'bg-green-500';
      case 'cached_error': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'loading': return 'bg-gray-400 animate-pulse';
      default: return 'bg-gray-300';
    }
  };

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground mr-2" />}
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
        {status && (
          <div className="flex items-center space-x-1">
            <span className={cn("h-2.5 w-2.5 rounded-full", getStatusColor())} />
            <span className="text-xs text-muted-foreground capitalize">
              {status === 'cached_error' ? 'Stale' : status}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className={cn("flex-grow pt-2", contentClassName)}>
        {description && <CardDescription className="mb-2 text-xs">{description}</CardDescription>}
        {status === 'loading' ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : status === 'error' ? (
          <div className="text-destructive text-sm flex items-center justify-center h-full">
            <p>Data unavailable.</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

export default DataCard;
