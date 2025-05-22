import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Waves } from 'lucide-react';

interface NavItem {
  label: string;
  href?: string; // Optional: for future navigation
}

interface DashboardHeaderProps {
  title: string;
  navItems: NavItem[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const DashboardHeader: FC<DashboardHeaderProps> = ({ 
  title, 
  navItems, 
  onRefresh, 
  isLoading = false 
}) => {
  return (
    <header className="bg-card text-card-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center">
          <Waves className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-6 w-6 p-0 mx-2 hover:bg-accent/50"
              title="Refresh data"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
          
          <nav className="flex items-center gap-2 ml-auto">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                className="text-sm text-muted-foreground hover:text-primary hover:bg-accent/10"
                onClick={() => {
                  // Navigation functionality can be added here later
                  // For now, buttons are static
                }}
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
