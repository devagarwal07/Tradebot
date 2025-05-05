import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface Stock {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  changePercent: number;
}

interface StockSearchCardProps {
  onSelectStock: (stock: Stock) => void;
  selectedStock: Stock | null;
}

export default function StockSearchCard({ onSelectStock, selectedStock }: StockSearchCardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Fetch stock search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/stocks/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      return fetch(`/api/stocks/search?query=${encodeURIComponent(searchQuery)}`).then(res => res.json());
    },
    enabled: searchQuery.length >= 2,
  });

  const handleSelectStock = (stock: Stock) => {
    onSelectStock(stock);
    
    // Add to recent searches if not already there
    if (!recentSearches.includes(stock.symbol)) {
      setRecentSearches(prev => [stock.symbol, ...prev].slice(0, 5));
    }
    
    setSearchQuery('');
  };

  const removeRecentSearch = (symbol: string) => {
    setRecentSearches(prev => prev.filter(s => s !== symbol));
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Select Stock</h3>
        
        {/* Stock Search Form */}
        <div className="mb-5">
          <Label htmlFor="stock-search" className="mb-1">Search Stocks</Label>
          <div className="relative">
            <Input
              id="stock-search"
              placeholder="Enter stock name or symbol"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-8"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
          
          {/* Dropdown for search results */}
          {searchQuery.length >= 2 && searchResults && searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map((stock: Stock) => (
                <div 
                  key={stock.symbol} 
                  className="p-2 hover:bg-neutral-50 cursor-pointer"
                  onClick={() => handleSelectStock(stock)}
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-sm text-neutral-500">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div>₹{stock.lastPrice.toFixed(2)}</div>
                      <div className={stock.change >= 0 ? "text-profit text-sm" : "text-loss text-sm"}>
                        {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mb-5">
            <h4 className="text-sm font-medium text-neutral-700 mb-2">Recent Searches</h4>
            <div className="flex flex-wrap">
              {recentSearches.map(symbol => (
                <Badge key={symbol} variant="outline" className="mr-2 mb-2 bg-neutral-100">
                  <span 
                    className="cursor-pointer"
                    onClick={() => {
                      // Fetch stock details and select it
                      fetch(`/api/stocks/${symbol}`)
                        .then(res => res.json())
                        .then(stock => handleSelectStock(stock));
                    }}
                  >
                    {symbol}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 ml-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(symbol);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Selected Stock Info */}
        {selectedStock && (
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-neutral-900">{selectedStock.symbol}</h4>
                <p className="text-sm text-neutral-600">{selectedStock.name}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-neutral-900">₹{selectedStock.lastPrice.toFixed(2)}</p>
                <p className={`text-sm font-medium ${selectedStock.change >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
