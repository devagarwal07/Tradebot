import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, BarChart2 } from "lucide-react";

interface Position {
  stockSymbol: string;
  quantity: number;
  averageBuyPrice: number;
  currentValue: number;
  currentPrice: number;
  profit: number;
  profitPercent: number;
}

interface Portfolio {
  totalValue: number;
  investedAmount: number;
  profit: number;
  profitPercent: number;
  positions: Position[];
}

export default function Portfolio() {
  // Fetch portfolio data
  const { data: portfolio, isLoading } = useQuery<Portfolio>({
    queryKey: ['/api/portfolio'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio');
      if (!response.ok) throw new Error('Failed to fetch portfolio data');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch trade history
  const { data: tradeHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['/api/trading/history'],
    queryFn: async () => {
      const response = await fetch('/api/trading/history');
      if (!response.ok) throw new Error('Failed to fetch trade history');
      return response.json();
    },
  });

  return (
    <main className="pt-20 pb-10 px-4 lg:px-6 flex-grow">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Portfolio</h2>
        <p className="text-neutral-600 mt-1">Track your investments and trading performance</p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-neutral-500">Total Portfolio Value</p>
                <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                  {isLoading ? <Skeleton className="h-8 w-28" /> : `₹${portfolio?.totalValue.toLocaleString('en-IN')}`}
                </h3>
              </div>
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-neutral-500">Invested Amount</p>
                <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                  {isLoading ? <Skeleton className="h-8 w-28" /> : `₹${portfolio?.investedAmount.toLocaleString('en-IN')}`}
                </h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-neutral-500">Total Profit/Loss</p>
                <h3 className={`text-2xl font-bold mt-1 ${!isLoading && (portfolio?.profit || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {isLoading ? (
                    <Skeleton className="h-8 w-28" />
                  ) : (
                    `${portfolio?.profit >= 0 ? '+' : ''}₹${Math.abs(portfolio?.profit || 0).toLocaleString('en-IN')}`
                  )}
                </h3>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${!isLoading && (portfolio?.profit || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {!isLoading && (portfolio?.profit || 0) >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-neutral-500">Profit Percentage</p>
                <h3 className={`text-2xl font-bold mt-1 ${!isLoading && (portfolio?.profitPercent || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {isLoading ? (
                    <Skeleton className="h-8 w-28" />
                  ) : (
                    `${portfolio?.profitPercent >= 0 ? '+' : ''}${portfolio?.profitPercent.toFixed(2)}%`
                  )}
                </h3>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${!isLoading && (portfolio?.profitPercent || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {!isLoading && (portfolio?.profitPercent || 0) >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="positions">
        <TabsList className="mb-6">
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <CardTitle>Current Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : portfolio?.positions && portfolio.positions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stock</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Avg. Buy Price</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead className="text-right">Profit/Loss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolio.positions.map((position) => (
                      <TableRow key={position.stockSymbol}>
                        <TableCell className="font-medium">{position.stockSymbol}</TableCell>
                        <TableCell>{position.quantity}</TableCell>
                        <TableCell>₹{position.averageBuyPrice.toFixed(2)}</TableCell>
                        <TableCell>₹{position.currentPrice.toFixed(2)}</TableCell>
                        <TableCell>₹{position.currentValue.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">
                          <div className={position.profit >= 0 ? 'text-profit' : 'text-loss'}>
                            {position.profit >= 0 ? '+' : ''}₹{Math.abs(position.profit).toFixed(2)}
                            <span className="text-xs ml-1">
                              ({position.profitPercent >= 0 ? '+' : ''}{position.profitPercent.toFixed(2)}%)
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4M4 12L8 8M4 12L8 16" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-neutral-900">No Positions</h3>
                  <p className="mt-1 text-sm text-neutral-500">You don't have any active positions at the moment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Trading History</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : tradeHistory && tradeHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradeHistory.map((trade: any) => (
                      <TableRow key={trade.id}>
                        <TableCell className="text-sm">{new Date(trade.dateTime).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">{trade.stockSymbol}</TableCell>
                        <TableCell>
                          <Badge className={trade.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{trade.quantity}</TableCell>
                        <TableCell>₹{trade.price.toFixed(2)}</TableCell>
                        <TableCell className={`text-right ${trade.profit >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {trade.profit >= 0 ? '+' : ''}₹{Math.abs(trade.profit).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-neutral-900">No Trade History</h3>
                  <p className="mt-1 text-sm text-neutral-500">Your trading history will appear here once you start trading.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full bg-neutral-50 rounded-lg flex items-center justify-center">
                <p className="text-neutral-500">Performance charts will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
