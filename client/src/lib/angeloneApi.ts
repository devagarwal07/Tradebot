// AngelOne API integration for trading
import { apiRequest } from "./queryClient";

// Base URL for AngelOne API
const API_KEY = process.env.ANGELONE_API_KEY || "";

// Authenticate with AngelOne
export async function authenticateAngelOne() {
  try {
    const response = await apiRequest("POST", "/api/auth/angelone", {
      api_key: API_KEY,
    });
    return await response.json();
  } catch (error) {
    console.error("AngelOne authentication failed:", error);
    throw error;
  }
}

// Search for stocks
export async function searchStocks(query: string) {
  try {
    const response = await fetch(`/api/stocks/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Stock search failed:", error);
    throw error;
  }
}

// Get stock details
export async function getStockDetails(symbol: string) {
  try {
    const response = await fetch(`/api/stocks/${symbol}`);
    if (!response.ok) {
      throw new Error(`Failed to get stock details: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to get stock details:", error);
    throw error;
  }
}

// Get stock chart data
export async function getStockChartData(symbol: string, timeframe: string) {
  try {
    const response = await fetch(`/api/stocks/chart?symbol=${symbol}&timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error(`Failed to get chart data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to get chart data:", error);
    throw error;
  }
}

// Place a buy order
export async function placeBuyOrder(stockSymbol: string, quantity: number, price: number, stopLoss: number = 0) {
  try {
    const response = await apiRequest("POST", "/api/trading/buy", {
      stockSymbol,
      quantity,
      price,
      stopLoss,
    });
    return await response.json();
  } catch (error) {
    console.error("Buy order failed:", error);
    throw error;
  }
}

// Place a sell order
export async function placeSellOrder(stockSymbol: string, quantity: number, price: number) {
  try {
    const response = await apiRequest("POST", "/api/trading/sell", {
      stockSymbol,
      quantity,
      price,
    });
    return await response.json();
  } catch (error) {
    console.error("Sell order failed:", error);
    throw error;
  }
}

// Cancel an order
export async function cancelOrder(orderId: number) {
  try {
    const response = await apiRequest("POST", `/api/trading/cancel/${orderId}`, {});
    return await response.json();
  } catch (error) {
    console.error("Cancel order failed:", error);
    throw error;
  }
}

// Get active orders
export async function getActiveOrders() {
  try {
    const response = await fetch("/api/trading/active");
    if (!response.ok) {
      throw new Error(`Failed to get active orders: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to get active orders:", error);
    throw error;
  }
}

// Get order history
export async function getOrderHistory(limit: number = 10) {
  try {
    const response = await fetch(`/api/trading/history?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to get order history: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to get order history:", error);
    throw error;
  }
}

// Start automated trading
export async function startAutomatedTrading(params: any) {
  try {
    const response = await apiRequest("POST", "/api/trading/start", params);
    return await response.json();
  } catch (error) {
    console.error("Failed to start automated trading:", error);
    throw error;
  }
}

// Stop automated trading
export async function stopAutomatedTrading(userStrategyId: number) {
  try {
    const response = await apiRequest("POST", `/api/trading/stop/${userStrategyId}`, {});
    return await response.json();
  } catch (error) {
    console.error("Failed to stop automated trading:", error);
    throw error;
  }
}
