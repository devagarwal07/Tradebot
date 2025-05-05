import { Request, Response } from 'express';
import { angelOneApi } from '../utils/angelOne';
import { storage } from '../storage';
import { stocks } from '@shared/schema';

// Mock data for development - to be replaced with real API calls
const mockStocks = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', lastPrice: 2574.35, change: 23.25, changePercent: 0.89 },
  { symbol: 'INFY', name: 'Infosys Ltd.', lastPrice: 1435.60, change: 12.75, changePercent: 0.89 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', lastPrice: 3420.75, change: -15.30, changePercent: -0.45 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', lastPrice: 1675.50, change: 5.60, changePercent: 0.34 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', lastPrice: 128.45, change: -2.75, changePercent: -2.10 },
  { symbol: 'WIPRO', name: 'Wipro Ltd.', lastPrice: 463.25, change: 3.80, changePercent: 0.83 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', lastPrice: 945.70, change: 8.35, changePercent: 0.89 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', lastPrice: 996.45, change: -4.20, changePercent: -0.42 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.', lastPrice: 1187.30, change: 15.75, changePercent: 1.34 },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd.', lastPrice: 1245.60, change: 7.85, changePercent: 0.63 }
];

export const searchStocks = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Attempt to search stocks via AngelOne API
    try {
      const searchResults = await angelOneApi.searchStocks(query);
      return res.json(searchResults);
    } catch (error) {
      console.error('Error searching stocks via API:', error);
      
      // Fallback to local search if API fails
      const filteredStocks = mockStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) || 
        stock.name.toLowerCase().includes(query.toLowerCase())
      );
      
      return res.json(filteredStocks);
    }
  } catch (error) {
    console.error('Error in searchStocks:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getStockDetails = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({ message: 'Stock symbol is required' });
    }
    
    // Attempt to get stock details via AngelOne API
    try {
      const stockDetails = await angelOneApi.getStockDetails(symbol);
      return res.json(stockDetails);
    } catch (error) {
      console.error('Error fetching stock details via API:', error);
      
      // Fallback to mock data if API fails
      const stock = mockStocks.find(s => s.symbol === symbol.toUpperCase());
      
      if (stock) {
        return res.json(stock);
      } else {
        return res.status(404).json({ message: 'Stock not found' });
      }
    }
  } catch (error) {
    console.error('Error in getStockDetails:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getStockChart = async (req: Request, res: Response) => {
  try {
    const { symbol, timeframe } = req.query;
    
    if (!symbol || !timeframe) {
      return res.status(400).json({ message: 'Symbol and timeframe are required' });
    }
    
    // Attempt to get chart data via AngelOne API
    try {
      const chartData = await angelOneApi.getChartData(symbol as string, timeframe as string);
      return res.json(chartData);
    } catch (error) {
      console.error('Error fetching chart data via API:', error);
      
      // Generate mock chart data for testing
      const endDate = new Date();
      const startDate = new Date();
      let dataPoints = 0;
      
      switch (timeframe) {
        case '1D':
          startDate.setDate(endDate.getDate() - 1);
          dataPoints = 24; // Hourly data
          break;
        case '1W':
          startDate.setDate(endDate.getDate() - 7);
          dataPoints = 7; // Daily data
          break;
        case '1M':
          startDate.setMonth(endDate.getMonth() - 1);
          dataPoints = 30; // Daily data
          break;
        case '3M':
          startDate.setMonth(endDate.getMonth() - 3);
          dataPoints = 90; // Daily data
          break;
        case '1Y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          dataPoints = 365; // Daily data
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
          dataPoints = 7;
      }
      
      // Find the stock to get a baseline price
      const stock = mockStocks.find(s => s.symbol === (symbol as string).toUpperCase());
      const basePrice = stock ? stock.lastPrice : 1000; // Fallback base price
      
      // Generate random chart data
      const mockChartData = [];
      const interval = (endDate.getTime() - startDate.getTime()) / dataPoints;
      
      let lastClose = basePrice;
      for (let i = 0; i < dataPoints; i++) {
        const time = new Date(startDate.getTime() + (interval * i)).toISOString().split('T')[0];
        const changePercent = (Math.random() * 2 - 1) * 2; // -2% to +2%
        const change = lastClose * (changePercent / 100);
        
        const open = lastClose;
        const close = open + change;
        const high = Math.max(open, close) + (Math.random() * Math.abs(change));
        const low = Math.min(open, close) - (Math.random() * Math.abs(change));
        const volume = Math.floor(Math.random() * 1000000) + 500000;
        
        mockChartData.push({
          time,
          open,
          high,
          low,
          close,
          volume
        });
        
        lastClose = close;
      }
      
      return res.json(mockChartData);
    }
  } catch (error) {
    console.error('Error in getStockChart:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
