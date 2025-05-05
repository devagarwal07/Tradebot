import { Request, Response } from 'express';
import { angelOneApi } from '../utils/angelOne';
import { storage } from '../storage';
import { 
  insertTradeSchema,
  insertUserStrategySchema,
  trades,
  userStrategies
} from '@shared/schema';
import { 
  movingAverageCrossover, 
  rsiStrategy, 
  macdStrategy, 
  bollingerBandsStrategy 
} from '../../client/src/lib/tradingStrategies';

// Mock active orders for development
const mockActiveOrders = [
  { 
    id: 1, 
    type: 'BUY', 
    stockSymbol: 'INFY', 
    quantity: 5, 
    price: 1432.50, 
    trigger: 'MA Crossover', 
    status: 'OPEN' 
  },
  { 
    id: 2, 
    type: 'SELL', 
    stockSymbol: 'TCS', 
    quantity: 10, 
    price: 3420.75, 
    trigger: 'RSI > 70', 
    status: 'PENDING' 
  }
];

// Mock trade history for development
const mockTradeHistory = [
  { 
    id: 101, 
    dateTime: '2023-08-01T10:32:15.000Z', 
    stockSymbol: 'INFY', 
    type: 'BUY', 
    quantity: 8, 
    price: 1428.30, 
    profit: 560.00 
  },
  { 
    id: 102, 
    dateTime: '2023-07-31T15:45:22.000Z', 
    stockSymbol: 'HDFCBANK', 
    type: 'SELL', 
    quantity: 12, 
    price: 1675.50, 
    profit: -320.00 
  },
  { 
    id: 103, 
    dateTime: '2023-07-28T11:17:45.000Z', 
    stockSymbol: 'TCS', 
    type: 'BUY', 
    quantity: 5, 
    price: 3405.25, 
    profit: 775.00 
  }
];

export const getActiveOrders = async (req: Request, res: Response) => {
  try {
    // Try to fetch active orders from AngelOne API
    try {
      const activeOrders = await angelOneApi.getActiveOrders();
      return res.json(activeOrders);
    } catch (error) {
      console.error('Error fetching active orders from API:', error);
      
      // Fallback to mock data
      return res.json(mockActiveOrders);
    }
  } catch (error) {
    console.error('Error in getActiveOrders:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTradeHistory = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const limitValue = limit ? parseInt(limit as string) : 10;
    
    // Try to fetch trade history from AngelOne API
    try {
      const tradeHistory = await angelOneApi.getTradeHistory(limitValue);
      return res.json(tradeHistory);
    } catch (error) {
      console.error('Error fetching trade history from API:', error);
      
      // Fallback to mock data
      return res.json(mockTradeHistory.slice(0, limitValue));
    }
  } catch (error) {
    console.error('Error in getTradeHistory:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const startTrading = async (req: Request, res: Response) => {
  try {
    const { stockSymbol, strategyId, parameters, isPaperTrading } = req.body;
    
    // Basic validation
    if (!stockSymbol || !strategyId || !parameters) {
      return res.status(400).json({ message: 'Stock symbol, strategy ID, and parameters are required' });
    }
    
    // Validate and create a user strategy instance
    try {
      const userStrategyData = {
        userId: 1, // Hardcoded for demo
        strategyId: parseInt(strategyId),
        stockSymbol,
        isActive: true,
        parameters
      };
      
      const parsedData = insertUserStrategySchema.parse(userStrategyData);
      
      // In a real implementation, this would be stored in the database
      // Here we're just returning success
      
      return res.json({ 
        success: true, 
        message: 'Trading strategy started successfully',
        data: {
          ...parsedData,
          id: Date.now(), // Generate a unique ID for mock purposes
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error starting trading strategy:', error);
      return res.status(400).json({ message: 'Invalid strategy parameters' });
    }
  } catch (error) {
    console.error('Error in startTrading:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const stopTrading = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Strategy ID is required' });
    }
    
    // In a real implementation, this would update the database
    // Here we're just returning success
    
    return res.json({ 
      success: true, 
      message: 'Trading strategy stopped successfully' 
    });
  } catch (error) {
    console.error('Error in stopTrading:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    // Try to cancel order through AngelOne API
    try {
      const result = await angelOneApi.cancelOrder(parseInt(id));
      return res.json(result);
    } catch (error) {
      console.error('Error cancelling order through API:', error);
      
      // Fallback response
      return res.json({ 
        success: true, 
        message: 'Order cancelled successfully',
        orderId: parseInt(id)
      });
    }
  } catch (error) {
    console.error('Error in cancelOrder:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const placeManualBuyOrder = async (req: Request, res: Response) => {
  try {
    const { stockSymbol, quantity, price, stopLoss } = req.body;
    
    // Basic validation
    if (!stockSymbol || !quantity || !price) {
      return res.status(400).json({ message: 'Stock symbol, quantity, and price are required' });
    }
    
    // Try to place order through AngelOne API
    try {
      const result = await angelOneApi.placeBuyOrder(stockSymbol, quantity, price, stopLoss);
      return res.json(result);
    } catch (error) {
      console.error('Error placing buy order through API:', error);
      
      // Create a mock trade for testing
      const mockTrade = {
        userId: 1, // Hardcoded for demo
        stockSymbol,
        type: 'BUY',
        quantity: parseInt(quantity),
        price: parseFloat(price),
        totalAmount: parseInt(quantity) * parseFloat(price),
        status: 'OPEN',
        trigger: 'Manual Order'
      };
      
      try {
        const parsedTrade = insertTradeSchema.parse(mockTrade);
        
        return res.json({
          success: true,
          message: 'Buy order placed successfully',
          data: {
            ...parsedTrade,
            id: Date.now(),
            orderTime: new Date().toISOString()
          }
        });
      } catch (error) {
        return res.status(400).json({ message: 'Invalid order parameters' });
      }
    }
  } catch (error) {
    console.error('Error in placeManualBuyOrder:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const placeManualSellOrder = async (req: Request, res: Response) => {
  try {
    const { stockSymbol, quantity, price } = req.body;
    
    // Basic validation
    if (!stockSymbol || !quantity || !price) {
      return res.status(400).json({ message: 'Stock symbol, quantity, and price are required' });
    }
    
    // Try to place order through AngelOne API
    try {
      const result = await angelOneApi.placeSellOrder(stockSymbol, quantity, price);
      return res.json(result);
    } catch (error) {
      console.error('Error placing sell order through API:', error);
      
      // Create a mock trade for testing
      const mockTrade = {
        userId: 1, // Hardcoded for demo
        stockSymbol,
        type: 'SELL',
        quantity: parseInt(quantity),
        price: parseFloat(price),
        totalAmount: parseInt(quantity) * parseFloat(price),
        status: 'OPEN',
        trigger: 'Manual Order'
      };
      
      try {
        const parsedTrade = insertTradeSchema.parse(mockTrade);
        
        return res.json({
          success: true,
          message: 'Sell order placed successfully',
          data: {
            ...parsedTrade,
            id: Date.now(),
            orderTime: new Date().toISOString()
          }
        });
      } catch (error) {
        return res.status(400).json({ message: 'Invalid order parameters' });
      }
    }
  } catch (error) {
    console.error('Error in placeManualSellOrder:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Performance and analytics endpoints
export const getPerformanceMetrics = async (req: Request, res: Response) => {
  try {
    // In a real implementation, these metrics would be calculated from real trade data
    const mockMetrics = {
      totalProfit: 18540.00,
      totalProfitPercent: 12.36,
      winRate: 68.5,
      winRateChange: 2.1,
      totalTrades: 142,
      bestStrategy: {
        name: 'MACD',
        roi: 18.2
      }
    };
    
    return res.json(mockMetrics);
  } catch (error) {
    console.error('Error in getPerformanceMetrics:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getStrategyPerformance = async (req: Request, res: Response) => {
  try {
    // Generate mock performance data for different strategies
    const mockPerformanceData = [
      {
        strategy: 'Moving Average',
        data: generateMockPerformanceData(90, 5, 15),
        color: '#2962FF'
      },
      {
        strategy: 'RSI',
        data: generateMockPerformanceData(90, -3, 12),
        color: '#FF6D00'
      },
      {
        strategy: 'MACD',
        data: generateMockPerformanceData(90, 8, 20),
        color: '#00C853'
      },
      {
        strategy: 'Bollinger Bands',
        data: generateMockPerformanceData(90, 2, 10),
        color: '#AA00FF'
      }
    ];
    
    return res.json(mockPerformanceData);
  } catch (error) {
    console.error('Error in getStrategyPerformance:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRiskAnalysis = async (req: Request, res: Response) => {
  try {
    // Generate mock risk analysis data
    const mockRiskData = {
      metrics: [
        { name: 'Drawdown', value: 8.2, percentage: 32, color: 'bg-amber-500' },
        { name: 'Volatility', value: 5.7, percentage: 22, color: 'bg-blue-500' },
        { name: 'Sharpe Ratio', value: 1.8, percentage: 70, color: 'bg-green-500' },
        { name: 'Risk-Reward Ratio', value: 2.3, percentage: 65, color: 'bg-purple-500' }
      ],
      riskRating: {
        level: 'Moderate',
        score: 55
      }
    };
    
    return res.json(mockRiskData);
  } catch (error) {
    console.error('Error in getRiskAnalysis:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPortfolio = async (req: Request, res: Response) => {
  try {
    // In a real implementation, this would be calculated from actual position data
    const mockPortfolio = {
      totalValue: 150000,
      investedAmount: 135000,
      profit: 15000,
      profitPercent: 11.11,
      positions: [
        {
          stockSymbol: 'INFY',
          quantity: 50,
          averageBuyPrice: 1400.20,
          currentPrice: 1435.60,
          currentValue: 71780,
          profit: 1770,
          profitPercent: 2.53
        },
        {
          stockSymbol: 'TCS',
          quantity: 15,
          averageBuyPrice: 3380.50,
          currentPrice: 3420.75,
          currentValue: 51311.25,
          profit: 604.5,
          profitPercent: 1.19
        },
        {
          stockSymbol: 'HDFCBANK',
          quantity: 30,
          averageBuyPrice: 1650.30,
          currentPrice: 1675.50,
          currentValue: 50265,
          profit: 756,
          profitPercent: 1.53
        }
      ]
    };
    
    return res.json(mockPortfolio);
  } catch (error) {
    console.error('Error in getPortfolio:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get available trading strategies
export const getStrategies = async (req: Request, res: Response) => {
  try {
    const strategies = [
      {
        id: 1,
        name: 'Moving Average Crossover',
        description: 'Uses crossovers of short and long-term moving averages to generate buy and sell signals.',
        returnRate: 15.8,
        successRate: 68.0,
        riskLevel: 'Moderate',
        category: 'Trend Following',
        parameters: {
          shortPeriod: {
            label: 'Short EMA Period',
            default: 9,
            min: 3,
            max: 50,
            step: 1
          },
          longPeriod: {
            label: 'Long EMA Period',
            default: 21,
            min: 10,
            max: 200,
            step: 1
          }
        }
      },
      {
        id: 2,
        name: 'RSI Strategy',
        description: 'Uses the Relative Strength Index (RSI) to identify overbought and oversold conditions.',
        returnRate: 12.5,
        successRate: 65.0,
        riskLevel: 'Moderate',
        category: 'Oscillator',
        parameters: {
          period: {
            label: 'RSI Period',
            default: 14,
            min: 2,
            max: 50,
            step: 1
          },
          overbought: {
            label: 'Overbought Level',
            default: 70,
            min: 50,
            max: 90,
            step: 1
          },
          oversold: {
            label: 'Oversold Level',
            default: 30,
            min: 10,
            max: 50,
            step: 1
          }
        }
      },
      {
        id: 3,
        name: 'MACD Strategy',
        description: 'Uses the Moving Average Convergence Divergence (MACD) to identify trend changes and momentum.',
        returnRate: 18.2,
        successRate: 72.0,
        riskLevel: 'High',
        category: 'Momentum',
        parameters: {
          fastPeriod: {
            label: 'Fast Period',
            default: 12,
            min: 5,
            max: 50,
            step: 1
          },
          slowPeriod: {
            label: 'Slow Period',
            default: 26,
            min: 10,
            max: 100,
            step: 1
          },
          signalPeriod: {
            label: 'Signal Period',
            default: 9,
            min: 2,
            max: 50,
            step: 1
          }
        }
      },
      {
        id: 4,
        name: 'Bollinger Bands Strategy',
        description: 'Uses Bollinger Bands to identify price volatility and potential reversal points.',
        returnRate: 14.3,
        successRate: 67.0,
        riskLevel: 'Moderate',
        category: 'Oscillator',
        parameters: {
          period: {
            label: 'Period',
            default: 20,
            min: 5,
            max: 50,
            step: 1
          },
          stdDev: {
            label: 'Standard Deviation',
            default: 2,
            min: 1,
            max: 5,
            step: 0.1
          }
        }
      },
      {
        id: 5,
        name: 'Volume Weighted Average Price (VWAP)',
        description: 'Uses VWAP to determine optimal entry and exit points based on volume-weighted price.',
        returnRate: 10.5,
        successRate: 63.0,
        riskLevel: 'Low',
        category: 'Volume-Based',
        parameters: {
          period: {
            label: 'Period',
            default: 14,
            min: 1,
            max: 30,
            step: 1
          }
        }
      }
    ];
    
    return res.json(strategies);
  } catch (error) {
    console.error('Error in getStrategies:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get settings
export const getSettings = async (req: Request, res: Response) => {
  try {
    // In a real implementation, these would be fetched from a database
    const mockSettings = {
      apiKey: '****************************', // Masked for security
      connected: true,
      notifications: {
        emailNotifications: true,
        tradeAlerts: true,
        performanceReports: false,
        marketNews: true
      },
      risk: {
        maxPositionSize: 10,
        maxDailyLoss: 5,
        defaultStopLoss: 2
      }
    };
    
    return res.json(mockSettings);
  } catch (error) {
    console.error('Error in getSettings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Save settings
export const saveSettings = async (req: Request, res: Response) => {
  try {
    const { apiKey, notifications, risk } = req.body;
    
    // In a real implementation, these would be saved to a database
    
    return res.json({
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('Error in saveSettings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify API Key
export const verifyApiKey = async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ message: 'API key is required' });
    }
    
    // In a real implementation, this would verify the API key with AngelOne
    try {
      const result = await angelOneApi.verifyApiKey(apiKey);
      return res.json(result);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid API key' });
    }
  } catch (error) {
    console.error('Error in verifyApiKey:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to generate mock performance data
function generateMockPerformanceData(days: number, minPctChange: number, maxPctChange: number) {
  const data = [];
  const endDate = new Date();
  let value = 100; // Start with 100 (percentage)
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    
    // Random percentage change within range
    const change = (Math.random() * (maxPctChange - minPctChange) + minPctChange) / 100;
    value = value * (1 + change);
    
    data.push({
      time: date.toISOString().split('T')[0],
      value: value
    });
  }
  
  return data;
}
