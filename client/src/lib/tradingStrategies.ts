/**
 * Moving Average Crossover
 * Generates buy signals when short-term MA crosses above long-term MA,
 * and sell signals when short-term MA crosses below long-term MA.
 */
export function movingAverageCrossover(data: any[], shortPeriod: number, longPeriod: number) {
  if (data.length < longPeriod) {
    throw new Error(`Not enough data points. Need at least ${longPeriod} data points.`);
  }

  const prices = data.map(candle => candle.close);
  const shortEMA = calculateEMA(prices, shortPeriod);
  const longEMA = calculateEMA(prices, longPeriod);
  
  // Generate signals: 1 = buy, -1 = sell, 0 = hold
  const signals = Array(longPeriod - 1).fill(0); // Padding for initial periods where we don't have enough data
  
  for (let i = longPeriod - 1; i < prices.length; i++) {
    const shortEMAIndex = i - (longPeriod - shortPeriod);
    const longEMAIndex = i - longPeriod + 1;
    
    const prevShortEMA = shortEMA[shortEMAIndex - 1];
    const prevLongEMA = longEMA[longEMAIndex - 1];
    const currShortEMA = shortEMA[shortEMAIndex];
    const currLongEMA = longEMA[longEMAIndex];
    
    // Crossover detection
    if (prevShortEMA <= prevLongEMA && currShortEMA > currLongEMA) {
      signals.push(1); // Buy signal
    } else if (prevShortEMA >= prevLongEMA && currShortEMA < currLongEMA) {
      signals.push(-1); // Sell signal
    } else {
      signals.push(0); // Hold
    }
  }
  
  return signals;
}

/**
 * RSI Strategy
 * Generates buy signals when RSI goes below oversold level and then rises above it,
 * and sell signals when RSI goes above overbought level and then falls below it.
 */
export function rsiStrategy(data: any[], period: number, overbought: number, oversold: number) {
  if (data.length < period + 10) {
    throw new Error(`Not enough data points. Need at least ${period + 10} data points.`);
  }

  const prices = data.map(candle => candle.close);
  const rsi = calculateRSI(prices, period);
  
  // Generate signals: 1 = buy, -1 = sell, 0 = hold
  const signals = Array(period + 1).fill(0); // Padding for initial periods where RSI isn't calculated
  
  let wasOversold = false;
  let wasOverbought = false;
  
  for (let i = 1; i < rsi.length; i++) {
    const prevRSI = rsi[i - 1];
    const currRSI = rsi[i];
    
    if (prevRSI <= oversold) {
      wasOversold = true;
    } else if (prevRSI >= overbought) {
      wasOverbought = true;
    }
    
    if (wasOversold && prevRSI < oversold && currRSI > oversold) {
      signals.push(1); // Buy signal when RSI crosses above oversold
      wasOversold = false;
    } else if (wasOverbought && prevRSI > overbought && currRSI < overbought) {
      signals.push(-1); // Sell signal when RSI crosses below overbought
      wasOverbought = false;
    } else {
      signals.push(0); // Hold
    }
  }
  
  return signals;
}

/**
 * MACD Strategy
 * Generates buy signals when MACD line crosses above signal line,
 * and sell signals when MACD line crosses below signal line.
 */
export function macdStrategy(data: any[], fastPeriod: number, slowPeriod: number, signalPeriod: number) {
  if (data.length < slowPeriod + signalPeriod + 10) {
    throw new Error(`Not enough data points. Need at least ${slowPeriod + signalPeriod + 10} data points.`);
  }

  const prices = data.map(candle => candle.close);
  const { macdLine, signalLine } = calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod);
  
  // Generate signals: 1 = buy, -1 = sell, 0 = hold
  const signals = Array(slowPeriod + signalPeriod - 2).fill(0); // Padding for initial periods
  
  for (let i = 1; i < macdLine.length; i++) {
    const prevMACD = macdLine[i - 1];
    const prevSignal = signalLine[i - 1];
    const currMACD = macdLine[i];
    const currSignal = signalLine[i];
    
    if (prevMACD <= prevSignal && currMACD > currSignal) {
      signals.push(1); // Buy signal
    } else if (prevMACD >= prevSignal && currMACD < currSignal) {
      signals.push(-1); // Sell signal
    } else {
      signals.push(0); // Hold
    }
  }
  
  return signals;
}

/**
 * Bollinger Bands Strategy
 * Generates buy signals when price touches lower band,
 * and sell signals when price touches upper band.
 */
export function bollingerBandsStrategy(data: any[], period: number, stdDev: number) {
  if (data.length < period + 10) {
    throw new Error(`Not enough data points. Need at least ${period + 10} data points.`);
  }

  const prices = data.map(candle => candle.close);
  const { upperBand, lowerBand } = calculateBollingerBands(prices, period, stdDev);
  
  // Generate signals: 1 = buy, -1 = sell, 0 = hold
  const signals = Array(period - 1).fill(0); // Padding for initial periods
  
  for (let i = period - 1; i < prices.length; i++) {
    const price = prices[i];
    const upper = upperBand[i - period + 1];
    const lower = lowerBand[i - period + 1];
    
    if (price <= lower) {
      signals.push(1); // Buy signal
    } else if (price >= upper) {
      signals.push(-1); // Sell signal
    } else {
      signals.push(0); // Hold
    }
  }
  
  return signals;
}

/**
 * Calculate Exponential Moving Average
 */
function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  
  return ema;
}

/**
 * Calculate Relative Strength Index
 */
function calculateRSI(data: number[], period: number): number[] {
  const gains = [];
  const losses = [];
  
  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate initial averages
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
  
  const rsi = [];
  
  // Calculate first RSI
  if (avgLoss === 0) {
    rsi.push(100);
  } else {
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  // Calculate remaining RSIs using smoothing
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
}

/**
 * Calculate Moving Average Convergence Divergence
 */
function calculateMACD(data: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number) {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // Calculate MACD line (fast EMA - slow EMA)
  const macdLine = [];
  for (let i = slowPeriod - 1; i < fastEMA.length; i++) {
    const fastIndex = i;
    const slowIndex = i - (fastPeriod - slowPeriod);
    macdLine.push(fastEMA[fastIndex] - slowEMA[slowIndex]);
  }
  
  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  return { macdLine, signalLine };
}

/**
 * Calculate Bollinger Bands
 */
function calculateBollingerBands(data: number[], period: number, stdDev: number) {
  const upperBand = [];
  const lowerBand = [];
  const middleBand = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    
    // Calculate SMA (middle band)
    const sma = slice.reduce((sum, price) => sum + price, 0) / period;
    middleBand.push(sma);
    
    // Calculate standard deviation
    const sumSquaredDiff = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0);
    const standardDeviation = Math.sqrt(sumSquaredDiff / period);
    
    // Calculate upper and lower bands
    upperBand.push(sma + (standardDeviation * stdDev));
    lowerBand.push(sma - (standardDeviation * stdDev));
  }
  
  return { upperBand, middleBand, lowerBand };
}
