import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface Strategy {
  id: number;
  name: string;
  description: string;
  returnRate: number;
  successRate: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  category: string;
  parameters: Record<string, any>;
}

export default function Strategies() {
  // Fetch strategies
  const { data: strategies, isLoading } = useQuery<Strategy[]>({
    queryKey: ['/api/strategies'],
    queryFn: async () => {
      const response = await fetch('/api/strategies');
      if (!response.ok) throw new Error('Failed to fetch strategies');
      return response.json();
    }
  });

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Moderate': return 'bg-amber-100 text-amber-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <main className="pt-20 pb-10 px-4 lg:px-6 flex-grow">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Trading Strategies</h2>
        <p className="text-neutral-600 mt-1">Find and configure optimal trading strategies</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Strategies</TabsTrigger>
          <TabsTrigger value="trend">Trend Following</TabsTrigger>
          <TabsTrigger value="momentum">Momentum</TabsTrigger>
          <TabsTrigger value="oscillator">Oscillator</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading strategies...</p>
            </div>
          ) : strategies && strategies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategies.map(strategy => (
                <Card key={strategy.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{strategy.name}</CardTitle>
                        <CardDescription className="mt-1">{strategy.category}</CardDescription>
                      </div>
                      <Badge className={getRiskBadgeColor(strategy.riskLevel)}>
                        {strategy.riskLevel} Risk
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-neutral-600 mb-4">{strategy.description}</p>
                    
                    <div className="flex justify-between text-sm mb-4">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1 text-profit" />
                        <span className="text-neutral-700">Return: </span>
                        <span className="text-profit font-medium ml-1">{strategy.returnRate.toFixed(2)}%</span>
                      </div>
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 mr-1 text-blue-500" />
                        <span className="text-neutral-700">Success: </span>
                        <span className="text-blue-500 font-medium ml-1">{strategy.successRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <Button className="w-full">Use This Strategy</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-neutral-50 rounded-lg">
              <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-800 mb-1">No Strategies Found</h3>
              <p className="text-neutral-600">Try a different filter or check back later</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trend" className="space-y-6">
          {/* Filter strategies by category */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!isLoading && strategies?.filter(s => s.category === 'Trend Following').map(strategy => (
              <Card key={strategy.id} className="overflow-hidden">
                {/* Same card structure as above */}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{strategy.name}</CardTitle>
                      <CardDescription className="mt-1">{strategy.category}</CardDescription>
                    </div>
                    <Badge className={getRiskBadgeColor(strategy.riskLevel)}>
                      {strategy.riskLevel} Risk
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600 mb-4">{strategy.description}</p>
                  
                  <div className="flex justify-between text-sm mb-4">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-profit" />
                      <span className="text-neutral-700">Return: </span>
                      <span className="text-profit font-medium ml-1">{strategy.returnRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 mr-1 text-blue-500" />
                      <span className="text-neutral-700">Success: </span>
                      <span className="text-blue-500 font-medium ml-1">{strategy.successRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <Button className="w-full">Use This Strategy</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Other tab contents with similar structure */}
        <TabsContent value="momentum" className="space-y-6">
          {/* Similar structure for momentum strategies */}
        </TabsContent>
        
        <TabsContent value="oscillator" className="space-y-6">
          {/* Similar structure for oscillator strategies */}
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-6">
          {/* Similar structure for custom strategies */}
        </TabsContent>
      </Tabs>
    </main>
  );
}
