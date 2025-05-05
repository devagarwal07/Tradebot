import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowDown, ArrowUp, Calendar, DollarSign, BarChart2, TrendingUp, Clock, RefreshCw } from 'lucide-react';

export default function Backtest() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('new');
  
  // Form state for new backtest
  const [strategy, setStrategy] = useState<number | null>(null);
  const [stockSymbol, setStockSymbol] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)); // 1 year ago
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [initialCapital, setInitialCapital] = useState<string>('10000');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [selectedBacktest, setSelectedBacktest] = useState<number | null>(null);
  
  // Fetch strategies for the select dropdown
  const { data: strategies, isLoading: isLoadingStrategies } = useQuery<any[]>({
    queryKey: ['/api/backtest/strategies'],
  });
  
  // Fetch previous backtests
  const { data: backtests, isLoading: isLoadingBacktests } = useQuery<any[]>({
    queryKey: ['/api/backtest/list'],
  });
  
  // Fetch details for a selected backtest
  const { data: backtestDetails, isLoading: isLoadingDetails } = useQuery<any>({
    queryKey: ['/api/backtest', selectedBacktest],
    enabled: !!selectedBacktest,
  });
  
  // Mutation for running a new backtest
  const runBacktestMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/backtest/run', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    }),
    onSuccess: (data) => {
      toast({
        title: 'Backtest complete',
        description: `Final capital: $${data.summary.finalCapital.toFixed(2)}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/backtest/list'] });
      setSelectedBacktest(data.backtestId);
      setActiveTab('results');
    },
    onError: (error: Error) => {
      toast({
        title: 'Backtest failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Parameters Form component based on selected strategy
  const renderParametersForm = () => {
    if (!strategy) return null;
    
    const selectedStrategy = strategies?.find((s: any) => s.id === strategy);
    if (!selectedStrategy) return null;
    
    try {
      const defaultParams = JSON.parse(selectedStrategy.parameters);
      const paramKeys = Object.keys(defaultParams);
      
      if (paramKeys.length === 0) return null;
      
      return (
        <div className="grid gap-4 mt-4">
          <h3 className="text-lg font-medium">Strategy Parameters</h3>
          <div className="grid grid-cols-2 gap-4">
            {paramKeys.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</Label>
                <Input 
                  id={key}
                  type="number"
                  value={parameters[key] || defaultParams[key]}
                  onChange={(e) => setParameters({
                    ...parameters,
                    [key]: parseFloat(e.target.value) || defaultParams[key],
                  })}
                />
              </div>
            ))}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error parsing strategy parameters:', error);
      return null;
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!strategy || !stockSymbol || !startDate || !endDate || !initialCapital) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    runBacktestMutation.mutate({
      strategyId: strategy,
      stockSymbol,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      initialCapital: parseFloat(initialCapital),
      parameters,
    });
  };
  
  // Render results chart
  const renderEquityChart = () => {
    if (!backtestDetails || !backtestDetails.equityCurve) {
      return <div className="h-80 flex items-center justify-center">
        <p className="text-muted-foreground">No equity data available</p>
      </div>;
    }
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={backtestDetails.equityCurve}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => new Date(tick).toLocaleDateString()} 
            minTickGap={50}
          />
          <YAxis />
          <Tooltip 
            labelFormatter={(label) => new Date(label).toLocaleDateString()} 
            formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Equity']}
          />
          <Legend />
          <Line type="monotone" dataKey="equity" stroke="#10b981" dot={false} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  // Render trade history table
  const renderTradeHistory = () => {
    if (!backtestDetails || !backtestDetails.trades || backtestDetails.trades.length === 0) {
      return <div className="py-4 text-center text-muted-foreground">No trade data available</div>;
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Date</th>
              <th className="text-left py-2">Type</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Quantity</th>
              <th className="text-right py-2">Profit</th>
            </tr>
          </thead>
          <tbody>
            {backtestDetails.trades.map((trade: any, index: number) => (
              <tr key={index} className="border-b">
                <td className="py-2">{new Date(trade.date).toLocaleString()}</td>
                <td className="py-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${trade.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {trade.type === 'BUY' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                    {trade.type}
                  </span>
                </td>
                <td className="text-right py-2">${trade.price.toFixed(2)}</td>
                <td className="text-right py-2">{trade.quantity}</td>
                <td className="text-right py-2">
                  {trade.profit !== null ? (
                    <span className={trade.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                      ${parseFloat(trade.profit).toFixed(2)}
                    </span>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render previous backtests
  const renderBacktestsList = () => {
    if (isLoadingBacktests) {
      return Array(3).fill(0).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 py-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ));
    }
    
    if (!backtests || backtests.length === 0) {
      return <div className="py-8 text-center text-muted-foreground">No previous backtests found</div>;
    }
    
    return backtests.map((backtest: any) => (
      <div 
        key={backtest.id} 
        className={`flex justify-between items-center p-4 rounded-lg cursor-pointer transition-colors ${selectedBacktest === backtest.id ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-900'}`}
        onClick={() => setSelectedBacktest(backtest.id)}
      >
        <div>
          <h3 className="font-medium">{backtest.strategyName}</h3>
          <p className="text-sm text-muted-foreground">{backtest.stockSymbol}</p>
          <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{new Date(backtest.startDate).toLocaleDateString()} - {new Date(backtest.endDate).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold ${backtest.finalCapital > backtest.initialCapital ? 'text-green-600' : 'text-red-600'}`}>
            ${parseFloat(backtest.finalCapital).toFixed(2)}
          </div>
          <div className="text-xs">
            {((backtest.finalCapital - backtest.initialCapital) / backtest.initialCapital * 100).toFixed(2)}%
          </div>
        </div>
      </div>
    ));
  };
  
  // Render summary metrics
  const renderSummaryMetrics = () => {
    if (!backtestDetails || !backtestDetails.backtest || !backtestDetails.backtest.summary) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      );
    }
    
    const summary = backtestDetails.summary;
    const backtest = backtestDetails.backtest;
    
    const metrics = [
      {
        title: 'Profit/Loss',
        value: `$${(summary.finalCapital - summary.initialCapital).toFixed(2)}`,
        subValue: `${summary.profitPercentage.toFixed(2)}%`,
        icon: <DollarSign className="h-4 w-4" />,
        color: summary.finalCapital >= summary.initialCapital ? 'text-green-600' : 'text-red-600'
      },
      {
        title: 'Win Rate',
        value: `${summary.winRate.toFixed(1)}%`,
        subValue: `${summary.winningTrades}/${summary.totalTrades} trades`,
        icon: <BarChart2 className="h-4 w-4" />,
        color: 'text-blue-600'
      },
      {
        title: 'Max Drawdown',
        value: `${summary.maxDrawdown.toFixed(2)}%`,
        subValue: `Avg Trade: $${summary.avgTradeProfit.toFixed(2)}`,
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'text-orange-500'
      },
      {
        title: 'Duration',
        value: `${Math.floor((new Date(backtest.endDate).getTime() - new Date(backtest.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`,
        subValue: `${new Date(backtest.startDate).toLocaleDateString()} - ${new Date(backtest.endDate).toLocaleDateString()}`,
        icon: <Clock className="h-4 w-4" />,
        color: 'text-gray-600'
      },
      {
        title: 'Capital',
        value: `$${summary.finalCapital.toFixed(2)}`,
        subValue: `Initial: $${summary.initialCapital.toFixed(2)}`,
        icon: <DollarSign className="h-4 w-4" />,
        color: 'text-indigo-600'
      },
      {
        title: 'Strategy',
        value: backtest.strategyName,
        subValue: backtest.stockSymbol,
        icon: <RefreshCw className="h-4 w-4" />,
        color: 'text-purple-600'
      }
    ];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                <div className={metric.color}>
                  {metric.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{metric.subValue}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backtesting</h1>
          <p className="text-muted-foreground">Test trading strategies against historical data</p>
        </div>
        <div>
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('new')}
            className="mr-2"
          >
            New Backtest
          </Button>
          <Button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/backtest/list'] });
              if (selectedBacktest) {
                queryClient.invalidateQueries({ queryKey: ['/api/backtest', selectedBacktest] });
              }
            }}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Previous Backtests</CardTitle>
              <CardDescription>Select a backtest to view results</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {renderBacktestsList()}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New Backtest</TabsTrigger>
              <TabsTrigger value="results" disabled={!selectedBacktest}>Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new">
              <Card>
                <CardHeader>
                  <CardTitle>New Backtest</CardTitle>
                  <CardDescription>Set parameters to test a strategy against historical data</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="strategy">Strategy</Label>
                          <Select 
                            value={strategy?.toString() || ''} 
                            onValueChange={(value) => {
                              const strategyId = parseInt(value);
                              setStrategy(strategyId);
                              // Reset parameters when strategy changes
                              setParameters({});
                            }}
                          >
                            <SelectTrigger id="strategy">
                              <SelectValue placeholder="Select a strategy" />
                            </SelectTrigger>
                            <SelectContent>
                              {strategies?.map((strategy: any) => (
                                <SelectItem key={strategy.id} value={strategy.id.toString()}>
                                  {strategy.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="stock">Stock Symbol</Label>
                          <Input 
                            id="stock" 
                            placeholder="e.g. AAPL" 
                            value={stockSymbol}
                            onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <DatePicker date={startDate} setDate={setStartDate} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <DatePicker date={endDate} setDate={setEndDate} />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="capital">Initial Capital ($)</Label>
                        <Input 
                          id="capital" 
                          type="number" 
                          min="100"
                          step="100"
                          value={initialCapital}
                          onChange={(e) => setInitialCapital(e.target.value)}
                        />
                      </div>
                      
                      {renderParametersForm()}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="mt-6 w-full"
                      disabled={runBacktestMutation.isPending}
                    >
                      {runBacktestMutation.isPending ? 'Running Backtest...' : 'Run Backtest'}
                    </Button>
                    
                    {runBacktestMutation.isPending && (
                      <div className="mt-4">
                        <Progress value={45} className="h-2" />
                        <p className="text-center text-sm text-muted-foreground mt-2">Processing historical data...</p>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="results">
              {isLoadingDetails ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
              ) : (
                backtestDetails && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance Summary</CardTitle>
                        <CardDescription>
                          {backtestDetails.backtest.strategyName} on {backtestDetails.backtest.stockSymbol} 
                          from {new Date(backtestDetails.backtest.startDate).toLocaleDateString()} 
                          to {new Date(backtestDetails.backtest.endDate).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {renderSummaryMetrics()}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Equity Curve</CardTitle>
                        <CardDescription>Account value over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {renderEquityChart()}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Trade History</CardTitle>
                        <CardDescription>All trades executed during the backtest period</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {renderTradeHistory()}
                      </CardContent>
                    </Card>
                  </div>
                )
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
