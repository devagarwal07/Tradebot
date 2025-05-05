import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Strategy {
  id: number;
  name: string;
  description: string;
  parameters: Record<string, any>;
}

interface TradingStrategyCardProps {
  selectedStock: any | null;
}

export default function TradingStrategyCard({ selectedStock }: TradingStrategyCardProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [positionSize, setPositionSize] = useState<string>("10000");
  const [stopLoss, setStopLoss] = useState<string>("2");
  const [isPaperTrading, setIsPaperTrading] = useState<boolean>(true);
  const { toast } = useToast();

  // Fetch available strategies
  const { data: strategies, isLoading: loadingStrategies } = useQuery<Strategy[]>({
    queryKey: ['/api/strategies'],
    queryFn: async () => {
      const response = await fetch('/api/strategies');
      if (!response.ok) throw new Error('Failed to fetch strategies');
      return response.json();
    }
  });

  // Start trading mutation
  const startTrading = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/trading/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start trading');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trading Started",
        description: "Your automated trading strategy is now active.",
        variant: "default",
      });
      
      // Refresh relevant data
      queryClient.invalidateQueries({ queryKey: ['/api/trading/active'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update parameters when strategy changes
  useEffect(() => {
    if (strategies && selectedStrategy) {
      const strategy = strategies.find(s => s.id.toString() === selectedStrategy);
      if (strategy) {
        // Initialize with default values
        const initialParams: Record<string, any> = {};
        Object.entries(strategy.parameters).forEach(([key, config]) => {
          initialParams[key] = config.default;
        });
        setParameters(initialParams);
      }
    }
  }, [selectedStrategy, strategies]);

  const handleParameterChange = (paramName: string, value: string) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const handleStartTrading = () => {
    if (!selectedStock) {
      toast({
        title: "Error",
        description: "Please select a stock first",
        variant: "destructive",
      });
      return;
    }

    if (!selectedStrategy) {
      toast({
        title: "Error",
        description: "Please select a trading strategy",
        variant: "destructive",
      });
      return;
    }

    startTrading.mutate({
      stockSymbol: selectedStock.symbol,
      strategyId: selectedStrategy,
      parameters: {
        ...parameters,
        positionSize: parseFloat(positionSize),
        stopLoss: parseFloat(stopLoss),
      },
      isPaperTrading,
    });
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Trading Strategy</h3>
        
        {/* Strategy Selection */}
        <div className="mb-5">
          <Label htmlFor="strategy-select" className="mb-1">Select Strategy</Label>
          <Select 
            value={selectedStrategy} 
            onValueChange={setSelectedStrategy}
            disabled={loadingStrategies}
          >
            <SelectTrigger id="strategy-select">
              <SelectValue placeholder="Choose a strategy" />
            </SelectTrigger>
            <SelectContent>
              {strategies?.map(strategy => (
                <SelectItem key={strategy.id} value={strategy.id.toString()}>
                  {strategy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Strategy Parameters */}
        {selectedStrategy && strategies && (
          <div className="space-y-4">
            {strategies.find(s => s.id.toString() === selectedStrategy)?.parameters && 
              Object.entries(strategies.find(s => s.id.toString() === selectedStrategy)!.parameters).map(([key, config]: [string, any]) => (
                <div key={key}>
                  <Label htmlFor={key} className="mb-1">{config.label}</Label>
                  <Input
                    id={key}
                    type="number"
                    value={parameters[key] || config.default}
                    onChange={(e) => handleParameterChange(key, e.target.value)}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                  />
                </div>
              ))
            }
            
            <div>
              <Label htmlFor="position-size" className="mb-1">Position Size</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-neutral-300 bg-neutral-50 text-neutral-500 text-sm">₹</span>
                <Input
                  id="position-size"
                  type="number"
                  value={positionSize}
                  onChange={(e) => setPositionSize(e.target.value)}
                  className="rounded-l-none"
                  min="1000"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="stop-loss" className="mb-1">Stop Loss (%)</Label>
              <Input
                id="stop-loss"
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                min="0.5"
                max="10"
                step="0.5"
              />
            </div>
          </div>
        )}

        {/* Start Trading Button */}
        <Button 
          className="mt-6 w-full"
          onClick={handleStartTrading}
          disabled={!selectedStock || !selectedStrategy || startTrading.isPending}
        >
          {startTrading.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Initializing...
            </>
          ) : (
            "Start Automated Trading"
          )}
        </Button>

        {/* Paper Trading Toggle */}
        <div className="mt-4 flex items-center justify-center">
          <span className="text-sm text-neutral-600 mr-2">Paper Trading</span>
          <Switch
            checked={!isPaperTrading}
            onCheckedChange={() => setIsPaperTrading(!isPaperTrading)}
          />
          <span className="text-sm text-neutral-600 ml-2">Live Trading</span>
        </div>
      </CardContent>
    </Card>
  );
}
