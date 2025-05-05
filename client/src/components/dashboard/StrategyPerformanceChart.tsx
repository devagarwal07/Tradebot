import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

interface StrategyPerformance {
  strategy: string;
  data: {
    time: string;
    value: number;
  }[];
  color: string;
}

export default function StrategyPerformanceChart() {
  // Fetch strategy performance data
  const { data: performanceData, isLoading } = useQuery<StrategyPerformance[]>({
    queryKey: ['/api/performance/strategies'],
    queryFn: async () => {
      const response = await fetch('/api/performance/strategies');
      if (!response.ok) throw new Error('Failed to fetch strategy performance data');
      return response.json();
    },
  });

  return (
    <Card>
      <CardContent className="pt-5">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Strategy Performance</h3>
        <div className="h-64 w-full">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <div className="flex flex-col h-full w-full p-2">
              {performanceData && performanceData.map((strategy, index) => (
                <div key={index} className="flex items-center mb-4">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: strategy.color }}
                  />
                  <div className="flex-1 font-medium text-sm">{strategy.strategy}</div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">
                      {strategy.data.length > 0 ? `${strategy.data[strategy.data.length - 1].value.toLocaleString()}%` : '0%'}
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-400 italic text-sm text-center">
                  Chart visualization will be available soon
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
