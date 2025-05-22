import { type FC, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const DataCard: FC<DataCardProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <Card className={className}>
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {children}
      </CardContent>
    </Card>
  );
};

export default DataCard;
