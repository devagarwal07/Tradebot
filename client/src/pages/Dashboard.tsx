import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import StockSearchCard from '@/components/dashboard/StockSearchCard';
import TradingStrategyCard from '@/components/dashboard/TradingStrategyCard';
import StockChartCard from '@/components/dashboard/StockChartCard';
import ActiveOrdersCard from '@/components/dashboard/ActiveOrdersCard';
import TradeHistoryCard from '@/components/dashboard/TradeHistoryCard';
import MetricCard from '@/components/dashboard/MetricCard';
import StrategyPerformanceChart from '@/components/dashboard/StrategyPerformanceChart';
import RiskAnalysisCard from '@/components/dashboard/RiskAnalysisCard';

interface Stock {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  changePercent: number;
}

export default function Dashboard() {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  
  // Fetch performance metrics
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['/api/performance/metrics'],
    queryFn: async () => {
      const response = await fetch('/api/performance/metrics');
      if (!response.ok) throw new Error('Failed to fetch performance metrics');
      return response.json();
    },
  });

  return (
    <main className="pt-20 pb-10 px-4 lg:px-6 flex-grow">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Trading Dashboard</h2>
        <p className="text-neutral-600 mt-1">Powered by AngelOne API</p>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Strategy Selection and Stock Input */}
        <div className="lg:col-span-1 space-y-6">
          <StockSearchCard 
            onSelectStock={setSelectedStock} 
            selectedStock={selectedStock} 
          />
          <TradingStrategyCard selectedStock={selectedStock} />
        </div>

        {/* Column 2: Chart and Order Book */}
        <div className="lg:col-span-2 space-y-6">
          <StockChartCard selectedStock={selectedStock} />
          <ActiveOrdersCard />
          <TradeHistoryCard />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Profit/Loss"
          value={loadingMetrics ? "" : `${metrics?.totalProfit >= 0 ? "+" : ""}₹${Math.abs(metrics?.totalProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subValue={loadingMetrics ? "" : `${metrics?.totalProfitPercent >= 0 ? "+" : ""}${metrics?.totalProfitPercent.toFixed(2)}%`}
          icon="profit"
          type={metrics?.totalProfit >= 0 ? "positive" : "negative"}
          isLoading={loadingMetrics}
        />
        <MetricCard
          title="Win Rate"
          value={loadingMetrics ? "" : `${metrics?.winRate.toFixed(1)}%`}
          subValue={loadingMetrics ? "" : `${metrics?.winRateChange >= 0 ? "+" : ""}${metrics?.winRateChange.toFixed(1)}% from last week`}
          icon="winRate"
          type={metrics?.winRateChange >= 0 ? "positive" : "negative"}
          isLoading={loadingMetrics}
        />
        <MetricCard
          title="Total Trades"
          value={loadingMetrics ? "" : metrics?.totalTrades.toString()}
          subValue="Last 30 days"
          icon="trades"
          isLoading={loadingMetrics}
        />
        <MetricCard
          title="Best Strategy"
          value={loadingMetrics ? "" : metrics?.bestStrategy.name}
          subValue={loadingMetrics ? "" : `+${metrics?.bestStrategy.roi.toFixed(1)}% ROI`}
          icon="strategy"
          type="positive"
          isLoading={loadingMetrics}
        />
      </div>

      {/* Strategy Performance Chart and Risk Analysis */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StrategyPerformanceChart />
        </div>
        <div>
          <RiskAnalysisCard />
        </div>
      </div>
    </main>
  );
}
