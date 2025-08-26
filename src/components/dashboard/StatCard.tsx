import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'destructive' | 'warning';
  trend?: 'up' | 'down' | 'neutral';
}

export const StatCard = ({ title, value, subtitle, icon: Icon, variant = 'default', trend = 'neutral' }: StatCardProps) => {
  const variantClasses = {
    default: "bg-card text-card-foreground",
    success: "bg-success text-success-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    warning: "bg-warning text-warning-foreground",
  };

  const trendIcon = trend === 'up' ? <TrendingUp className="h-4 w-4 text-green-500" /> : trend === 'down' ? <TrendingDown className="h-4 w-4 text-red-500" /> : null;

  return (
    <Card className={cn("flex flex-col", variantClasses[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground", {
          "text-success-foreground": variant === 'success',
          "text-destructive-foreground": variant === 'destructive',
          "text-warning-foreground": variant === 'warning',
        })} />
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div className="text-2xl font-bold flex items-center gap-2">
          {value} {trendIcon}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
};