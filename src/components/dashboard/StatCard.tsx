// src/components/dashboard/StatCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'default' 
}: StatCardProps) => {
  const variantClasses = {
    default: 'border-border',
    success: 'border-success/20 bg-success/5',
    warning: 'border-warning/20 bg-warning/5',
    destructive: 'border-destructive/20 bg-destructive/5',
  };

  const iconClasses = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  };

  return (
    <Card className={`${variantClasses[variant]} transition-all hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Icon className={`h-6 w-6 ${iconClasses[variant]}`} />
            {trend && (
              <div className="flex items-center gap-1">
                {trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};