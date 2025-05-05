import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Award, 
  RefreshCw, 
  Bot 
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subValue: string;
  icon: 'profit' | 'winRate' | 'trades' | 'strategy';
  type?: 'positive' | 'negative' | 'neutral';
  isLoading?: boolean;
}

export default function MetricCard({ 
  title, 
  value, 
  subValue, 
  icon, 
  type = 'neutral',
  isLoading = false 
}: MetricCardProps) {
  
  const getIcon = () => {
    const iconClassName = "h-6 w-6";
    
    switch (icon) {
      case 'profit':
        return <TrendingUp className={`${iconClassName} ${type === 'positive' ? 'text-green-600' : type === 'negative' ? 'text-red-600' : 'text-blue-600'}`} />;
      case 'winRate':
        return <Award className={`${iconClassName} text-blue-600`} />;
      case 'trades':
        return <RefreshCw className={`${iconClassName} text-purple-600`} />;
      case 'strategy':
        return <Bot className={`${iconClassName} text-amber-600`} />;
      default:
        return <TrendingUp className={`${iconClassName} text-blue-600`} />;
    }
  };
  
  const getIconBgColor = () => {
    switch (icon) {
      case 'profit':
        return type === 'positive' ? 'bg-green-100' : type === 'negative' ? 'bg-red-100' : 'bg-blue-100';
      case 'winRate':
        return 'bg-blue-100';
      case 'trades':
        return 'bg-purple-100';
      case 'strategy':
        return 'bg-amber-100';
      default:
        return 'bg-blue-100';
    }
  };
  
  const getTextColor = () => {
    return type === 'positive' ? 'text-profit' : type === 'negative' ? 'text-loss' : 'text-neutral-800';
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-28 mt-1" />
                <Skeleton className="h-5 w-20 mt-1" />
              </>
            ) : (
              <>
                <h3 className={`text-2xl font-bold ${getTextColor()} mt-1`}>{value}</h3>
                <p className={`text-sm font-medium ${type === 'positive' ? 'text-profit' : type === 'negative' ? 'text-loss' : 'text-neutral-600'} mt-1`}>{subValue}</p>
              </>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-12 w-12 rounded-full" />
          ) : (
            <div className={`h-12 w-12 rounded-full ${getIconBgColor()} flex items-center justify-center`}>
              {getIcon()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
