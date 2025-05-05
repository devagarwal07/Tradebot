import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

interface RiskMetric {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface RiskAnalysis {
  metrics: RiskMetric[];
  riskRating: {
    level: string;
    score: number;
  };
}

export default function RiskAnalysisCard() {
  // Fetch risk analysis data
  const { data: riskData, isLoading } = useQuery<RiskAnalysis>({
    queryKey: ['/api/performance/risk'],
    queryFn: async () => {
      const response = await fetch('/api/performance/risk');
      if (!response.ok) throw new Error('Failed to fetch risk analysis data');
      return response.json();
    },
  });

  // Get risk rating level color
  const getRiskRatingColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'moderate': return 'text-amber-600';
      case 'high': return 'text-red-600';
      default: return 'text-neutral-600';
    }
  };

  // Generate risk rating dots
  const getRiskRatingDots = (score: number) => {
    const maxDots = 5;
    const filledDots = Math.round(score * maxDots / 100);
    
    return Array.from({ length: maxDots }).map((_, index) => (
      <div 
        key={index}
        className={`h-2 w-2 rounded-full mx-0.5 ${
          index < filledDots 
            ? (score < 33 ? 'bg-green-500' : score < 66 ? 'bg-amber-500' : 'bg-red-500')
            : 'bg-neutral-300'
        }`}
      />
    ));
  };

  // Render loading state
  const renderLoadingState = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4].map(index => (
        <div key={index}>
          <div className="flex justify-between mb-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <Skeleton className="h-5 w-24 mb-2" />
        <div className="flex items-center">
          <Skeleton className="h-6 w-20" />
          <div className="ml-auto flex">
            <Skeleton className="h-2 w-20" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardContent className="pt-5">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Risk Analysis</h3>
        
        {isLoading ? renderLoadingState() : (
          <div className="space-y-4">
            {riskData?.metrics.map((metric) => (
              <div key={metric.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-neutral-700">{metric.name}</span>
                  <span className="text-sm font-medium text-neutral-700">{metric.value}%</span>
                </div>
                <Progress value={metric.percentage} className="h-2" indicatorClassName={metric.color} />
              </div>
            ))}
            
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <h4 className="text-sm font-semibold text-neutral-800 mb-2">Risk Rating</h4>
              <div className="flex items-center">
                <div className={`font-bold text-lg ${getRiskRatingColor(riskData?.riskRating.level || '')}`}>
                  {riskData?.riskRating.level}
                </div>
                <div className="ml-auto flex">
                  {riskData && getRiskRatingDots(riskData.riskRating.score)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
