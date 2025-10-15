import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState } from "react";

interface DataPoint {
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'neutral';
  previous?: number;
}

interface DataChartProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  type: 'bar' | 'progress' | 'stat';
  color?: 'primary' | 'accent' | 'chart-1' | 'chart-2' | 'chart-3';
}

export default function DataChart({ title, subtitle, data, type, color = 'primary' }: DataChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  const getColorClass = (colorName: string) => {
    switch (colorName) {
      case 'primary': return 'bg-primary text-primary-foreground';
      case 'accent': return 'bg-accent text-accent-foreground';
      case 'chart-1': return 'bg-chart-1 text-white';
      case 'chart-2': return 'bg-chart-2 text-white';
      case 'chart-3': return 'bg-chart-3 text-white';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'neutral': return <Minus className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const maxValue = Math.max(...data.map(d => d.value));

  const renderChart = () => {
    if (type === 'bar') {
      return (
        <div className="space-y-3">
          {data.map((point, index) => {
            const percentage = (point.value / maxValue) * 100;
            return (
              <div 
                key={index} 
                className="space-y-1"
                onClick={() => {
                  setSelectedPoint(index);
                  console.log('Selected data point:', point.label, point.value);
                }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-libre-franklin text-card-foreground">{point.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-card-foreground">{point.value}</span>
                    {getTrendIcon(point.trend)}
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ease-out ${getColorClass(color)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (type === 'progress') {
      return (
        <div className="space-y-4">
          {data.map((point, index) => {
            const percentage = point.value;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-libre-franklin text-sm text-card-foreground">{point.label}</span>
                  <span className="font-mono font-bold text-lg text-card-foreground">{percentage}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${getColorClass(color)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (type === 'stat') {
      return (
        <div className="grid grid-cols-2 gap-4">
          {data.map((point, index) => (
            <div 
              key={index} 
              className="text-center p-4 bg-muted/50 rounded-lg hover-elevate cursor-pointer"
              onClick={() => console.log('Stat clicked:', point.label)}
              data-testid={`stat-${point.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="font-mono font-bold text-2xl text-card-foreground mb-1">
                {point.value}
              </div>
              <div className="font-libre-franklin text-xs text-muted-foreground uppercase tracking-wide">
                {point.label}
              </div>
              {point.trend && (
                <div className="mt-2">
                  {getTrendIcon(point.trend)}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="hover-elevate bg-card border-card-border" data-testid={`chart-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-league-spartan font-bold text-lg uppercase tracking-wide text-card-foreground">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="font-libre-franklin text-sm text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {type.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
        {selectedPoint !== null && data[selectedPoint] && (
          <div className="mt-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <p className="text-sm font-libre-franklin text-card-foreground">
              <span className="font-semibold">Selected:</span> {data[selectedPoint].label} - {data[selectedPoint].value}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}