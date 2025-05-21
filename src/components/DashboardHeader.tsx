import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Waves } from 'lucide-react';

interface NavItem {
  label: string;
  href?: string; // Optional: for future navigation
}

interface DashboardHeaderProps {
  title: string;
  navItems: NavItem[];
}

const DashboardHeader: FC<DashboardHeaderProps> = ({ title, navItems }) => {
  return (
    <header className="bg-card text-card-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center mb-3 sm:mb-0">
          <Waves className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-2">
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
    </header>
  );
};

export default DashboardHeader;
