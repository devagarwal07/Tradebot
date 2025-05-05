import { Request, Response } from 'express';
import { runBacktest, getUserBacktests, getBacktestDetails } from '../services/backtestService';
import { strategies } from '../../shared/schema';
import { db } from '../db';
import { eq, inArray } from 'drizzle-orm';

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
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Get user ID from session (cast to any to access id)
    const userId = (req.user as any)?.id || 1; // Fallback to default user for testing
    
    // Parse dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Run the backtest
    const result = await runBacktest(
      userId,
      strategyId,
      stockSymbol,
      parsedStartDate,
      parsedEndDate,
      initialCapital,
      parameters || {}
    );
    
    res.json(result);
  } catch (error: any) {
    console.error('Backtest controller error:', error);
    res.status(500).json({ message: error.message || 'Failed to run backtest' });
  }
};

/**
 * Get all backtests for the current user
 */
export const getUserBacktestsController = async (req: Request, res: Response) => {
  try {
    // Get user ID from session (cast to any to access id)
    const userId = (req.user as any)?.id || 1; // Fallback to default user for testing
    
    // Get all backtests for this user
    const backtests = await getUserBacktests(userId);
    
    // Get strategy information for each backtest
    const strategyIds = Array.from(new Set(backtests.map(b => b.strategyId)));
    let strategyList = [];
    
    if (strategyIds.length > 0) {
      strategyList = await db.select().from(strategies).where(inArray(strategies.id, strategyIds));
    }
    
    // Combine backtest data with strategy info
    const backtestsWithStrategyDetails = backtests.map(backtest => {
      const strategy = strategyList.find(s => s.id === backtest.strategyId);
      return {
        ...backtest,
        strategyName: strategy?.name || 'Unknown Strategy',
        strategyDescription: strategy?.description || ''
      };
    });
    
    res.json(backtestsWithStrategyDetails);
  } catch (error: any) {
    console.error('Get backtests controller error:', error);
    res.status(500).json({ message: error.message || 'Failed to get backtests' });
  }
};

/**
 * Get details of a specific backtest
 */
export const getBacktestDetailsController = async (req: Request, res: Response) => {
  try {
    const backtestId = parseInt(req.params.id);
    
    if (isNaN(backtestId)) {
      return res.status(400).json({ message: 'Invalid backtest ID' });
    }
    
    // Get user ID from session (cast to any to access id)
    const userId = (req.user as any)?.id || 1; // Fallback to default user for testing
    
    // Get backtest details
    const { backtest, trades } = await getBacktestDetails(backtestId, userId);
    
    // Get strategy details
    const [strategy] = await db
      .select()
      .from(strategies)
      .where(eq(strategies.id, backtest.strategyId));
    
    res.json({
      backtest: {
        ...backtest,
        strategyName: strategy?.name || 'Unknown Strategy',
        strategyDescription: strategy?.description || ''
      },
      trades
    });
  } catch (error: any) {
    console.error('Get backtest details controller error:', error);
    res.status(500).json({ message: error.message || 'Failed to get backtest details' });
  }
};

/**
 * Get strategies available for backtesting
 */
export const getBacktestStrategiesController = async (_req: Request, res: Response) => {
  try {
    const strategyList = await db.select().from(strategies);
    
    res.json(strategyList);
  } catch (error: any) {
    console.error('Get backtest strategies controller error:', error);
    res.status(500).json({ message: error.message || 'Failed to get strategies' });
  }
};
