import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createChart, IChartApi, ISeriesApi, LineData, CandlestickData } from 'lightweight-charts';

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface StockChartCardProps {
  selectedStock: any | null;
}

type TimeFrame = '1D' | '1W' | '1M' | '3M' | '1Y';
type Indicator = 'MovingAverages' | 'RSI' | 'MACD' | 'Volume' | 'BollingerBands';

export default function StockChartCard({ selectedStock }: StockChartCardProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [candleSeries, setCandleSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1D');
  const [activeIndicators, setActiveIndicators] = useState<Indicator[]>(['MovingAverages']);

  // Fetch chart data for the selected stock and timeframe
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['/api/stocks/chart', selectedStock?.symbol, timeFrame],
    queryFn: async () => {
      if (!selectedStock) return null;
      const response = await fetch(`/api/stocks/chart?symbol=${selectedStock.symbol}&timeframe=${timeFrame}`);
      if (!response.ok) throw new Error('Failed to fetch chart data');
      return response.json();
    },
    enabled: !!selectedStock,
  });

  // Initialize chart when component mounts
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const handleResize = () => {
      if (chart) {
        chart.applyOptions({ 
          width: chartContainerRef.current?.clientWidth || 800, 
          height: chartContainerRef.current?.clientHeight || 300,
        });
      }
    };

    // Create chart instance
    const chartInstance = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f3fa' },
        horzLines: { color: '#f0f3fa' },
      },
      rightPriceScale: {
        borderColor: '#dfdfdf',
      },
      timeScale: {
        borderColor: '#dfdfdf',
      },
    });

    // Create candlestick series
    const candlestickSeries = chartInstance.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    setChart(chartInstance);
    setCandleSeries(candlestickSeries);

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.remove();
    };
  }, []);

  // Update chart data when it changes
  useEffect(() => {
    if (candleSeries && chartData && chartData.length > 0) {
      candleSeries.setData(chartData);
      
      // Add indicators based on active selections
      if (chart) {
        // Clear existing indicators (would need to track them in state for proper cleanup)
        
        if (activeIndicators.includes('MovingAverages')) {
          // Add EMA-9
          const ema9Series = chart.addLineSeries({
            color: '#2962FF',
            lineWidth: 1,
            lineStyle: 2,
          });
          
          // Calculate and set EMA data
          const ema9Data = calculateEMA(chartData, 9);
          ema9Series.setData(ema9Data);
          
          // Add EMA-21
          const ema21Series = chart.addLineSeries({
            color: '#FF6D00',
            lineWidth: 1,
            lineStyle: 2,
          });
          
          const ema21Data = calculateEMA(chartData, 21);
          ema21Series.setData(ema21Data);
        }
        
        // Similar implementation for other indicators
      }
    }
  }, [chartData, candleSeries, chart, activeIndicators]);

  // Calculate Exponential Moving Average (EMA)
  const calculateEMA = (data: ChartData[], period: number): LineData[] => {
    const k = 2 / (period + 1);
    let emaData: LineData[] = [];
    let ema = data[0].close;
    
    data.forEach((item, index) => {
      if (index === 0) {
        emaData.push({ time: item.time, value: item.close });
      } else {
        ema = (item.close - ema) * k + ema;
        emaData.push({ time: item.time, value: ema });
      }
    });
    
    return emaData;
  };

  const handleTimeFrameChange = (tf: TimeFrame) => {
    setTimeFrame(tf);
  };

  const toggleIndicator = (indicator: Indicator) => {
    if (activeIndicators.includes(indicator)) {
      setActiveIndicators(prev => prev.filter(item => item !== indicator));
    } else {
      setActiveIndicators(prev => [...prev, indicator]);
    }
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-neutral-800">Stock Chart</h3>
          <div className="flex space-x-2">
            {(['1D', '1W', '1M', '3M', '1Y'] as TimeFrame[]).map(tf => (
              <Button
                key={tf}
                variant={timeFrame === tf ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimeFrameChange(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Chart Container */}
        <div className="h-80 w-full relative">
          {isLoading || !selectedStock ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <div ref={chartContainerRef} className="h-full w-full" />
          )}
        </div>

        {/* Strategy Indicators Toggle */}
        <div className="mt-4 flex flex-wrap gap-2">
          {(['MovingAverages', 'RSI', 'MACD', 'Volume', 'BollingerBands'] as Indicator[]).map(indicator => (
            <Badge
              key={indicator}
              variant="outline"
              className={`cursor-pointer ${
                activeIndicators.includes(indicator) 
                  ? 'bg-primary-100 text-primary-700 border-primary-200' 
                  : 'bg-neutral-100 text-neutral-700 border-neutral-200'
              }`}
              onClick={() => toggleIndicator(indicator)}
            >
              {indicator}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
