
import { useState, type FC, ReactNode, ElementType } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface DataCardProps {
  title: string;
  icon?: ElementType;
  status?: 'fresh' | 'cached_error' | 'error' | 'loading' | 'waiting' | null;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

const DataCard: FC<DataCardProps> = ({
  title,
  icon: Icon,
  status,
  children,
  className,
  contentClassName,
}) => {
  const [isOpen, setIsOpen] = useState(true); // All cards start open

  const getStatusColor = () => {
    switch (status) {
      case 'fresh': return 'bg-green-500';
      case 'cached_error': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'loading': return 'bg-gray-400 animate-pulse';
      case 'waiting': return 'bg-blue-500'; // Status for AI card waiting for data/inputs
      default: return 'bg-gray-300';
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card header click if button is clicked
    setIsOpen(!isOpen);
  };

  const statusText = () => {
    if (!status) return 'Unknown';
    if (status === 'cached_error') return 'Stale';
    if (status === 'waiting') return 'Pending';
    // Capitalize first letter for other statuses
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col", className)}>
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between space-y-0",
          isOpen ? "pb-2" : "pb-0" // Remove bottom padding when closed
        )}
      >
        <div
          className="flex items-center flex-grow mr-2 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)} // Entire title area is clickable to toggle
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(!isOpen); }}
          aria-expanded={isOpen}
          aria-controls={`card-content-${title.replace(/\s+/g, '-')}`} // For accessibility
        >
          {Icon && <Icon className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />}
          <CardTitle className="text-lg font-semibold leading-tight">{title}</CardTitle>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {status && (
            <div className="flex items-center space-x-1" title={`Status: ${statusText()}`}>
              <span className={cn("h-2.5 w-2.5 rounded-full", getStatusColor())} />
              <span className="text-xs text-muted-foreground">{statusText()}</span>
            </div>
          )}
          <Button variant="ghost" size="icon" className="p-0 h-7 w-7" onClick={handleToggle} aria-label={isOpen ? "Collapse card" : "Expand card"}>
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>

      <div
        id={`card-content-${title.replace(/\s+/g, '-')}`}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? 'max-h-[1000px]' : 'max-h-0' // Use a large enough max-height for open state
        )}
        aria-hidden={!isOpen}
      >
        <CardContent className={cn("pt-2 flex-grow", contentClassName, { 'py-0': !isOpen })}>
          {status === 'loading' ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : status === 'error' ? (
            <div className="text-destructive text-sm flex items-center justify-center h-full py-4">
              <p>Data unavailable.</p>
            </div>
          ) : (
            children
          )}
        </CardContent>
      </div>
    </Card>
  );
};

export default DataCard;
