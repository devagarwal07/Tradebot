import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X, ClipboardList } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: number;
  type: 'BUY' | 'SELL';
  stockSymbol: string;
  quantity: number;
  price: number;
  trigger: string;
  status: 'OPEN' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

export default function ActiveOrdersCard() {
  const { toast } = useToast();

  // Fetch active orders
  const { data: activeOrders, isLoading } = useQuery<Order[]>({
    queryKey: ['/api/trading/active'],
    queryFn: async () => {
      const response = await fetch('/api/trading/active');
      if (!response.ok) throw new Error('Failed to fetch active orders');
      return response.json();
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Cancel order mutation
  const cancelOrder = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await fetch(`/api/trading/cancel/${orderId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel order');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully.",
        variant: "default",
      });
      
      // Refresh orders list
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

  const handleCancelOrder = (orderId: number) => {
    cancelOrder.mutate(orderId);
  };

  // Status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-neutral-100 text-neutral-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  // Render empty state
  const renderEmptyState = () => (
    <div className="py-8 text-center">
      <ClipboardList className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
      <p className="text-neutral-500">No active orders at the moment</p>
      <p className="text-sm text-neutral-400 mt-1">Orders will appear here once trading begins</p>
    </div>
  );

  // Render loading state
  const renderLoadingState = () => (
    <div className="space-y-4">
      {[1, 2].map(index => (
        <div key={index} className="flex justify-between items-center">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardContent className="pt-5">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Active Orders</h3>
        
        {isLoading ? (
          renderLoadingState()
        ) : !activeOrders || activeOrders.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Trigger</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {activeOrders.map(order => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={order.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {order.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-800">{order.stockSymbol}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">{order.quantity}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">₹{order.price.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">{order.trigger}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">
                      <Button 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                        disabled={order.status !== 'OPEN' && order.status !== 'PENDING'}
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
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
