import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface Trade {
  id: number;
  dateTime: string;
  stockSymbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  profit: number;
}

export default function TradeHistoryCard() {
  // Fetch trade history
  const { data: tradeHistory, isLoading } = useQuery<Trade[]>({
    queryKey: ['/api/trading/history'],
    queryFn: async () => {
      const response = await fetch('/api/trading/history?limit=5'); // Get latest 5 trades
      if (!response.ok) throw new Error('Failed to fetch trade history');
      return response.json();
    },
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  // Render loading state
  const renderLoadingState = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(index => (
        <div key={index} className="flex justify-between items-center">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-neutral-800">Trade History</h3>
          <Link href="/portfolio">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        {isLoading ? (
          renderLoadingState()
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">P&L</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {tradeHistory?.map(trade => (
                  <tr key={trade.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">{formatDate(trade.dateTime)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-800">{trade.stockSymbol}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={trade.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {trade.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">{trade.quantity}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">₹{trade.price.toFixed(2)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${trade.profit >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {trade.profit >= 0 ? '+' : ''}₹{Math.abs(trade.profit).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
