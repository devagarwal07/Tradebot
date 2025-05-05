import { db } from '../db';
import { backtests, backtestTrades, strategies } from '../../shared/schema';
import * as tradingStrategies from '../../client/src/lib/tradingStrategies';
import { angelOneApi } from '../utils/angelOne';
import { eq, and, between } from 'drizzle-orm';

// Define the backtesting result interface
interface BacktestResult {
  backtestId: number;
  summary: {
    initialCapital: number;
    finalCapital: number;
    profit: number;
    profitPercentage: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    maxDrawdown: number;
    avgTradeProfit: number;
  };
  trades: {
    date: Date;
    type: 'BUY' | 'SELL';
    price: number;
    quantity: number;
    profit: number | null;
  }[];
  equityCurve: {
    date: Date;
    equity: number;
  }[];
}

/**
 * Run a backtest for a specific strategy on historical stock data
 */
export async function runBacktest(
  userId: number,
  strategyId: number,
  stockSymbol: string,
  startDate: Date,
  endDate: Date,
  initialCapital: number,
  parameters: Record<string, any>
): Promise<BacktestResult> {
  try {
    // 1. Get the strategy details
    const [strategy] = await db
      .select()
      .from(strategies)
      .where(eq(strategies.id, strategyId));
    
    if (!strategy) {
      throw new Error(`Strategy with id ${strategyId} not found`);
    }

    // 2. Fetch historical data for the given stock and date range
    const historicalData = await fetchHistoricalData(stockSymbol, startDate, endDate);
    
    if (!historicalData || historicalData.length === 0) {
      throw new Error(`No historical data available for ${stockSymbol} in the specified date range`);
    }

    // 3. Apply the selected strategy to the historical data
    const strategyResults = applyStrategy(strategy.name, historicalData, parameters);

    // 4. Simulate trading based on the strategy signals
    const simulationResult = simulateTrades(strategyResults, initialCapital);

    // 5. Save backtest results to database
    const [backtest] = await db.insert(backtests).values({
      userId,
      strategyId,
      stockSymbol,
      startDate,
      endDate,
      initialCapital,
      finalCapital: simulationResult.summary.finalCapital,
      totalTrades: simulationResult.summary.totalTrades,
      winningTrades: simulationResult.summary.winningTrades,
      losingTrades: simulationResult.summary.losingTrades,
      parameters: parameters,
    }).returning({ id: backtests.id });

    // 6. Save individual trades from the backtest
    if (simulationResult.trades.length > 0) {
      await db.insert(backtestTrades).values(
        simulationResult.trades.map(trade => ({
          backtestId: backtest.id,
          type: trade.type,
          date: trade.date,
          price: trade.price,
          quantity: trade.quantity,
          profit: trade.profit,
        }))
      );
    }

    return {
      backtestId: backtest.id,
      summary: simulationResult.summary,
      trades: simulationResult.trades,
      equityCurve: simulationResult.equityCurve,
    };
  } catch (error) {
    console.error('Backtest error:', error);
    throw error;
  }
}

/**
 * Get all backtests for a user
 */
export async function getUserBacktests(userId: number) {
  return db
    .select()
    .from(backtests)
    .where(eq(backtests.userId, userId));
}

/**
 * Get a specific backtest with its trades
 */
export async function getBacktestDetails(backtestId: number, userId: number) {
  const [backtest] = await db
    .select()
    .from(backtests)
    .where(and(
      eq(backtests.id, backtestId),
      eq(backtests.userId, userId)
    ));
  
  if (!backtest) {
    throw new Error(`Backtest with id ${backtestId} not found`);
  }

  const trades = await db
    .select()
    .from(backtestTrades)
    .where(eq(backtestTrades.backtestId, backtestId));

  return { backtest, trades };
}

/**
 * Helper function to fetch historical data from an API
 */
async function fetchHistoricalData(
  symbol: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  try {
    // Try to get data from AngelOne if connected
    if (process.env.ANGELONE_API_KEY) {
      const data = await angelOneApi.getHistoricalData(symbol, startDate, endDate);
      return data;
    }

    // Fall back to mock data for development/testing
    return generateMockHistoricalData(startDate, endDate);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    // Fall back to mock data for testing/development
    return generateMockHistoricalData(startDate, endDate);
  }
}

/**
 * Apply a trading strategy to historical data
 */
function applyStrategy(
  strategyName: string,
  data: any[],
  parameters: Record<string, any>
): any[] {
  // Process the data based on the selected strategy
  const ohlcData = data.map(bar => ({
    time: new Date(bar.date || bar.time),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
  }));

  // Extract close prices
  const prices = ohlcData.map(bar => bar.close);
  
  // Apply strategy and generate signals
  const signals: number[] = [];
  
  // Process the data point by point to simulate a real-time environment
  for (let i = 0; i < ohlcData.length; i++) {
    const currentData = ohlcData.slice(0, i + 1);
    const currentPrices = currentData.map(d => d.close);
    
    let signal = 0; // 0 for no action, 1 for buy, -1 for sell
    
    // Only start generating signals when we have enough data for the strategy
    if (i >= 30) { // Minimum data points for most strategies
      let result;
      
      switch (strategyName) {
        case 'Moving Average Crossover':
          result = tradingStrategies.movingAverageCrossover(
            currentData, 
            parameters.shortPeriod || 9,
            parameters.longPeriod || 21
          );
          break;
          
        case 'RSI Strategy':
          result = tradingStrategies.rsiStrategy(
            currentData, 
            parameters.period || 14,
            parameters.overbought || 70,
            parameters.oversold || 30
          );
          break;
          
        case 'MACD Strategy':
          result = tradingStrategies.macdStrategy(
            currentData, 
            parameters.fastPeriod || 12,
            parameters.slowPeriod || 26,
            parameters.signalPeriod || 9
          );
          break;
          
        case 'Bollinger Bands Strategy':
          result = tradingStrategies.bollingerBandsStrategy(
            currentData, 
            parameters.period || 20,
            parameters.stdDev || 2
          );
          break;
          
        default:
          throw new Error(`Strategy ${strategyName} not implemented`);
      }
      
      if (result.signal === 'BUY') signal = 1;
      else if (result.signal === 'SELL') signal = -1;
    }
    
    signals.push(signal);
  }
  
  // Combine original data with signals
  return ohlcData.map((bar, index) => ({
    ...bar,
    signal: index < signals.length ? signals[index] : 0
  }));
}

/**
 * Simulate trades based on strategy signals
 */
function simulateTrades(
  strategyResults: any[],
  initialCapital: number
) {
  const trades: any[] = [];
  const equityCurve: { date: Date; equity: number }[] = [];
  
  let cash = initialCapital;
  let shares = 0;
  let position = 0; // 0: no position, 1: long, -1: short
  let entryPrice = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let totalProfit = 0;
  let equity = initialCapital;
  let maxEquity = initialCapital;
  let maxDrawdown = 0;
  
  // Record initial equity
  if (strategyResults.length > 0) {
    equityCurve.push({
      date: strategyResults[0].time,
      equity: initialCapital
    });
  }
  
  strategyResults.forEach((bar, index) => {
    // Skip first few bars as they may not have valid signals due to lookback periods
    if (index < 10) return;
    
    const currentPrice = bar.close;
    const signal = bar.signal; // 1 for buy, -1 for sell, 0 for no action
    
    // Update equity curve (mark-to-market)
    if (position !== 0) {
      equity = cash + (shares * currentPrice);
      
      // Update max equity and drawdown
      if (equity > maxEquity) {
        maxEquity = equity;
      } else {
        const drawdown = (maxEquity - equity) / maxEquity * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    } else {
      equity = cash;
    }
    
    equityCurve.push({
      date: bar.time,
      equity: equity
    });
    
    // Execute trades based on signals
    if (signal === 1 && position <= 0) {
      // Buy signal
      if (position === -1) {
        // Close short position
        const profit = (entryPrice - currentPrice) * shares;
        totalProfit += profit;
        if (profit > 0) winningTrades++;
        else losingTrades++;
        
        trades.push({
          date: bar.time,
          type: 'BUY',
          price: currentPrice,
          quantity: shares,
          profit: profit
        });
        
        cash += entryPrice * shares; // Return initial capital
        cash += profit; // Add profit/loss
        shares = 0;
      }
      
      // Open new long position
      const positionSize = 0.95 * cash; // Use 95% of cash for position
      shares = Math.floor(positionSize / currentPrice);
      
      if (shares > 0) {
        cash -= shares * currentPrice;
        entryPrice = currentPrice;
        position = 1;
        
        trades.push({
          date: bar.time,
          type: 'BUY',
          price: currentPrice,
          quantity: shares,
          profit: null
        });
      }
    } 
    else if (signal === -1 && position >= 0) {
      // Sell signal
      if (position === 1) {
        // Close long position
        const profit = (currentPrice - entryPrice) * shares;
        totalProfit += profit;
        if (profit > 0) winningTrades++;
        else losingTrades++;
        
        trades.push({
          date: bar.time,
          type: 'SELL',
          price: currentPrice,
          quantity: shares,
          profit: profit
        });
        
        cash += shares * currentPrice;
        shares = 0;
      }
      
      // For simplicity, we're not implementing short selling here
      // but in a real system you might open a short position here
      position = 0;
    }
  });
  
  // Close any open position at the end using the last price
  if (position !== 0 && strategyResults.length > 0) {
    const lastBar = strategyResults[strategyResults.length - 1];
    const lastPrice = lastBar.close;
    
    if (position === 1) {
      // Close long position
      const profit = (lastPrice - entryPrice) * shares;
      totalProfit += profit;
      if (profit > 0) winningTrades++;
      else losingTrades++;
      
      trades.push({
        date: lastBar.time,
        type: 'SELL',
        price: lastPrice,
        quantity: shares,
        profit: profit
      });
      
      cash += shares * lastPrice;
    }
  }
  
  // Calculate final equity
  const finalCapital = cash;
  const profitPercentage = ((finalCapital - initialCapital) / initialCapital) * 100;
  const totalTrades = winningTrades + losingTrades;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const avgTradeProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;
  
  return {
    summary: {
      initialCapital,
      finalCapital,
      profit: finalCapital - initialCapital,
      profitPercentage,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      maxDrawdown,
      avgTradeProfit
    },
    trades,
    equityCurve
  };
}

/**
 * Generate mock historical data for development/testing
 */
function generateMockHistoricalData(startDate: Date, endDate: Date) {
  const data = [];
  const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  const numBars = Math.min(dayDiff, 365); // Cap at 365 bars max
  
  // Generate a somewhat realistic price series
  let price = 100; // Starting price
  let high = price * 1.02;
  let low = price * 0.98;
  
  for (let i = 0; i < numBars; i++) {
    // Generate a new day's data
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    // Random walk with momentum and mean reversion
    const change = (Math.random() - 0.5) * 2 * (price * 0.02); // Max 2% change
    price += change;
    
    // Generate realistic OHLC values
    const range = price * 0.015; // 1.5% range for the day
    high = price + (Math.random() * range);
    low = price - (Math.random() * range);
    const open = low + (Math.random() * (high - low));
    const close = low + (Math.random() * (high - low));
    
    // Generate volume
    const volume = Math.floor(10000 + Math.random() * 90000);
    
    data.push({
      date: date,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: volume
    });
  }
  
  return data;
}
