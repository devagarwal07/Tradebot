import { Request, Response } from 'express';
import * as backtestService from '../services/backtestService';

/**
 * Run a backtest for a strategy
 */
export const runBacktestController = async (req: Request, res: Response) => {
  try {
    const {
      strategyId,
      stockSymbol,
      startDate,
      endDate,
      initialCapital,
      parameters
    } = req.body;

    // Basic validation
    if (!strategyId || !stockSymbol || !startDate || !endDate || !initialCapital) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // For demo purposes, we're using userId = 1
    // In a real app, this would come from the authenticated user session
    const userId = 1;

    const result = await backtestService.runBacktest(
      userId,
      strategyId,
      stockSymbol,
      new Date(startDate),
      new Date(endDate),
      Number(initialCapital),
      parameters || {}
    );

    return res.json(result);
  } catch (error) {
    console.error('Backtest error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
  }
};

/**
 * Get all backtests for the current user
 */
export const getUserBacktestsController = async (req: Request, res: Response) => {
  try {
    // For demo purposes, we're using userId = 1
    // In a real app, this would come from the authenticated user session
    const userId = 1;

    const backtests = await backtestService.getUserBacktests(userId);
    return res.json(backtests);
  } catch (error) {
    console.error('Error fetching user backtests:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
  }
};

/**
 * Get details of a specific backtest
 */
export const getBacktestDetailsController = async (req: Request, res: Response) => {
  try {
    const backtestId = parseInt(req.params.id);
    
    // For demo purposes, we're using userId = 1
    // In a real app, this would come from the authenticated user session
    const userId = 1;

    const backtest = await backtestService.getBacktestDetails(backtestId, userId);
    
    if (!backtest) {
      return res.status(404).json({ error: 'Backtest not found' });
    }
    
    return res.json(backtest);
  } catch (error) {
    console.error('Error fetching backtest details:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
  }
};

/**
 * Get strategies available for backtesting
 */
export const getBacktestStrategiesController = async (_req: Request, res: Response) => {
  try {
    // In a real app, this would fetch actual strategies from the database
    // For demo purposes, we're returning predefined strategies
    const strategyList = [
      {
        id: 1,
        name: 'Moving Average Crossover',
        description: 'Generates buy and sell signals based on the crossover of short and long moving averages',
        parameters: JSON.stringify({
          shortPeriod: 20,
          longPeriod: 50
        })
      },
      {
        id: 2,
        name: 'RSI Strategy',
        description: 'Uses the Relative Strength Index to identify overbought and oversold conditions',
        parameters: JSON.stringify({
          period: 14,
          overbought: 70,
          oversold: 30
        })
      },
      {
        id: 3,
        name: 'MACD Strategy',
        description: 'Uses Moving Average Convergence Divergence to identify trend changes and momentum',
        parameters: JSON.stringify({
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9
        })
      },
      {
        id: 4,
        name: 'Bollinger Bands Strategy',
        description: 'Uses Bollinger Bands to identify price volatility and potential reversal points',
        parameters: JSON.stringify({
          period: 20,
          stdDev: 2
        })
      }
    ];
    
    return res.json(strategyList);
  } catch (error) {
    console.error('Error fetching backtest strategies:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
  }
};
