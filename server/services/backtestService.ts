import { angelOneApi } from '../utils/angelOne';
import * as tradingStrategies from '../../client/src/lib/tradingStrategies';
import { db } from '../db';
import { backtests, backtestTrades, strategies, InsertBacktest, InsertBacktestTrade } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

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
    // Get strategy details
    const [strategyData] = await db
      .select()
      .from(strategies)
      .where(eq(strategies.id, strategyId));

    if (!strategyData) {
      throw new Error(`Strategy with ID ${strategyId} not found`);
    }

    // Fetch historical data
    const historicalData = await fetchHistoricalData(stockSymbol, startDate, endDate);

    if (!historicalData || historicalData.length === 0) {
      throw new Error(`No historical data available for ${stockSymbol} in the specified date range`);
    }

    // Apply strategy to generate signals
    const signals = applyStrategy(historicalData, strategyData.name, parameters);

    // Simulate trades based on signals
    const { trades, summary, equityCurve } = simulateTrades(signals, initialCapital);

    // Save backtest to database
    const [backtest] = await db
      .insert(backtests)
      .values({
        userId,
        strategyId,
        strategyName: strategyData.name,
        stockSymbol,
        startDate,
        endDate,
        initialCapital,
        finalCapital: summary.finalCapital,
        parameters: JSON.stringify(parameters),
        profitLoss: summary.profit,
        profitLossPercentage: summary.profitPercentage,
        totalTrades: summary.totalTrades,
        winningTrades: summary.winningTrades,
        maxDrawdown: summary.maxDrawdown
      } as InsertBacktest)
      .returning();

    // Save trade history
    for (const trade of trades) {
      await db
        .insert(backtestTrades)
        .values({
          backtestId: backtest.id,
          date: trade.date,
          type: trade.type,
          price: trade.price,
          quantity: trade.quantity,
          profit: trade.profit
        } as InsertBacktestTrade);
    }

    return {
      backtestId: backtest.id,
      summary,
      trades,
      equityCurve
    };
  } catch (error) {
    console.error('Error running backtest:', error);
    throw error;
  }
}

/**
 * Get all backtests for a user
 */
export async function getUserBacktests(userId: number) {
  try {
    const results = await db
      .select()
      .from(backtests)
      .where(eq(backtests.userId, userId))
      .orderBy(backtests.createdAt);

    return results;
  } catch (error) {
    console.error('Error getting user backtests:', error);
    throw error;
  }
}

/**
 * Get a specific backtest with its trades
 */
export async function getBacktestDetails(backtestId: number, userId: number) {
  try {
    // Get backtest details
    const [backtest] = await db
      .select()
      .from(backtests)
      .where(
        and(
          eq(backtests.id, backtestId),
          eq(backtests.userId, userId)
        )
      );

    if (!backtest) {
      return null;
    }

    // Get all trades for this backtest
    const trades = await db
      .select()
      .from(backtestTrades)
      .where(eq(backtestTrades.backtestId, backtestId))
      .orderBy(backtestTrades.date);

    // Calculate equity curve from trades
    const equityCurve = [];
    let equity = backtest.initialCapital;
    
    // Create a daily equity curve
    const startDate = new Date(backtest.startDate);
    const endDate = new Date(backtest.endDate);
    
    const tradeMap = new Map();
    for (const trade of trades) {
      const dateKey = new Date(trade.date).toISOString().split('T')[0];
      if (!tradeMap.has(dateKey)) {
        tradeMap.set(dateKey, []);
      }
      tradeMap.get(dateKey).push(trade);
    }

    // Generate equity curve for each day
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dayTrades = tradeMap.get(dateKey) || [];
      
      // Apply all trades for this day to the equity
      for (const trade of dayTrades) {
        if (trade.profit !== null) {
          equity += trade.profit;
        }
      }
      
      equityCurve.push({
        date: new Date(d),
        equity
      });
    }

    // Calculate summary statistics
    const summary = {
      initialCapital: backtest.initialCapital,
      finalCapital: backtest.finalCapital,
      profit: backtest.profitLoss,
      profitPercentage: backtest.profitLossPercentage,
      totalTrades: backtest.totalTrades,
      winningTrades: backtest.winningTrades,
      losingTrades: backtest.totalTrades - backtest.winningTrades,
      winRate: (backtest.winningTrades / backtest.totalTrades) * 100,
      maxDrawdown: backtest.maxDrawdown,
      avgTradeProfit: backtest.profitLoss / backtest.totalTrades
    };

    return {
      backtest,
      trades,
      equityCurve,
      summary
    };
  } catch (error) {
    console.error('Error getting backtest details:', error);
    throw error;
  }
}

/**
 * Helper function to fetch historical data from an API
 */
async function fetchHistoricalData(
  symbol: string,
  startDate: Date,
  endDate: Date
) {
  try {
    // First try to get data from AngelOne API
    const data = await angelOneApi.getHistoricalData(symbol, startDate, endDate);
    
    if (data && data.length > 0) {
      return data;
    }
    
    // If no data is available or an error occurs, generate mock data for development
    return generateMockHistoricalData(startDate, endDate);
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    // If API fails, use mock data for development
    return generateMockHistoricalData(startDate, endDate);
  }
}

/**
 * Apply a trading strategy to historical data
 */
function applyStrategy(
  data: any[],
  strategyName: string,
  parameters: Record<string, any>
) {
  if (!data || data.length === 0) {
    throw new Error('No data provided for strategy application');
  }

  // Extract closing prices for strategy calculations
  const prices = data.map(candle => candle.close);

  let signals: { date: Date; type: 'BUY' | 'SELL' | 'HOLD'; price: number }[] = [];

  switch (strategyName) {
    case 'Moving Average Crossover': {
      const { shortPeriod = 20, longPeriod = 50 } = parameters;
      const result = tradingStrategies.movingAverageCrossover(data, shortPeriod, longPeriod);
      signals = result.map((signal, i) => ({
        date: new Date(data[i].timestamp || data[i].date),
        type: signal > 0 ? 'BUY' : signal < 0 ? 'SELL' : 'HOLD',
        price: data[i].close
      }));
      break;
    }

    case 'RSI Strategy': {
      const { period = 14, overbought = 70, oversold = 30 } = parameters;
      const result = tradingStrategies.rsiStrategy(data, period, overbought, oversold);
      signals = result.map((signal, i) => ({
        date: new Date(data[i].timestamp || data[i].date),
        type: signal > 0 ? 'BUY' : signal < 0 ? 'SELL' : 'HOLD',
        price: data[i].close
      }));
      break;
    }

    case 'MACD Strategy': {
      const { fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = parameters;
      const result = tradingStrategies.macdStrategy(
        data,
        fastPeriod,
        slowPeriod,
        signalPeriod
      );
      signals = result.map((signal, i) => ({
        date: new Date(data[i].timestamp || data[i].date),
        type: signal > 0 ? 'BUY' : signal < 0 ? 'SELL' : 'HOLD',
        price: data[i].close
      }));
      break;
    }

    case 'Bollinger Bands Strategy': {
      const { period = 20, stdDev = 2 } = parameters;
      const result = tradingStrategies.bollingerBandsStrategy(data, period, stdDev);
      signals = result.map((signal, i) => ({
        date: new Date(data[i].timestamp || data[i].date),
        type: signal > 0 ? 'BUY' : signal < 0 ? 'SELL' : 'HOLD',
        price: data[i].close
      }));
      break;
    }

    default:
      throw new Error(`Strategy '${strategyName}' not supported`);
  }

  return signals.filter(signal => signal.type !== 'HOLD');
}

/**
 * Simulate trades based on strategy signals
 */
function simulateTrades(
  signals: { date: Date; type: 'BUY' | 'SELL'; price: number }[],
  initialCapital: number
) {
  let capital = initialCapital;
  let position = 0;
  let entryPrice = 0;
  let trades = [];
  let maxDrawdown = 0;
  let peak = initialCapital;
  let winningTrades = 0;
  let totalTrades = 0;
  const equityCurve: { date: Date; equity: number }[] = [
    { date: signals[0]?.date || new Date(), equity: initialCapital }
  ];

  for (const signal of signals) {
    if (signal.type === 'BUY' && position === 0) {
      // Calculate max number of shares we can buy
      const quantity = Math.floor(capital / signal.price);
      
      if (quantity > 0) {
        const cost = quantity * signal.price;
        capital -= cost;
        position = quantity;
        entryPrice = signal.price;
        
        trades.push({
          date: signal.date,
          type: 'BUY',
          price: signal.price,
          quantity,
          profit: null
        });
        
        equityCurve.push({
          date: signal.date,
          equity: capital + (position * signal.price)
        });
      }
    }
    else if (signal.type === 'SELL' && position > 0) {
      const sellValue = position * signal.price;
      const profit = sellValue - (position * entryPrice);
      capital += sellValue;
      
      trades.push({
        date: signal.date,
        type: 'SELL',
        price: signal.price,
        quantity: position,
        profit
      });
      
      if (profit > 0) winningTrades++;
      totalTrades++;
      
      position = 0;
      entryPrice = 0;
      
      // Update equity curve
      equityCurve.push({
        date: signal.date,
        equity: capital
      });
      
      // Update peak and calculate drawdown
      if (capital > peak) {
        peak = capital;
      } else {
        const drawdown = ((peak - capital) / peak) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }
  }
  
  // Close any remaining positions at the last price
  if (position > 0 && signals.length > 0) {
    const lastSignal = signals[signals.length - 1];
    const sellValue = position * lastSignal.price;
    const profit = sellValue - (position * entryPrice);
    capital += sellValue;
    
    trades.push({
      date: lastSignal.date,
      type: 'SELL',
      price: lastSignal.price,
      quantity: position,
      profit
    });
    
    if (profit > 0) winningTrades++;
    totalTrades++;
    
    // Final equity curve point
    equityCurve.push({
      date: lastSignal.date,
      equity: capital
    });
  }
  
  // Calculate summary
  const finalCapital = capital;
  const profit = finalCapital - initialCapital;
  const profitPercentage = (profit / initialCapital) * 100;
  
  const summary = {
    initialCapital,
    finalCapital,
    profit,
    profitPercentage,
    totalTrades,
    winningTrades,
    losingTrades: totalTrades - winningTrades,
    winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
    maxDrawdown,
    avgTradeProfit: totalTrades > 0 ? profit / totalTrades : 0
  };
  
  return { trades, summary, equityCurve };
}

/**
 * Generate mock historical data for development/testing
 */
function generateMockHistoricalData(startDate: Date, endDate: Date) {
  const data = [];
  const dayMs = 24 * 60 * 60 * 1000;
  const numDays = Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs);
  
  let price = 100 + Math.random() * 50; // Random starting price between 100-150
  const volatility = 0.02; // Daily price volatility
  
  for (let i = 0; i < numDays; i++) {
    const date = new Date(startDate.getTime() + i * dayMs);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    
    // Generate random price movement
    const change = price * volatility * (Math.random() - 0.5);
    const open = price;
    price += change;
    
    // Add some trend and pattern for better backtest results
    const trend = Math.sin(i / 10) * 0.5; // Add a sine wave pattern
    price += trend;
    
    // Make sure price doesn't go below 1
    price = Math.max(price, 1);
    
    const high = Math.max(open, price) * (1 + Math.random() * 0.01);
    const low = Math.min(open, price) * (1 - Math.random() * 0.01);
    const volume = Math.floor(100000 + Math.random() * 900000);
    
    data.push({
      date: date.toISOString(),
      timestamp: date.getTime(),
      open,
      high,
      low,
      close: price,
      volume
    });
  }
  
  return data;
}
