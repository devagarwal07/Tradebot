// Trading strategies implementation

// Moving Average Crossover Strategy
export function movingAverageCrossover(data: any[], shortPeriod: number, longPeriod: number) {
  if (!data || data.length < longPeriod) {
    return { signal: 'NEUTRAL', meta: {} };
  }

  // Calculate short EMA
  const shortEMA = calculateEMA(data.map(d => d.close), shortPeriod);
  
  // Calculate long EMA
  const longEMA = calculateEMA(data.map(d => d.close), longPeriod);

  // Current values
  const currentShortEMA = shortEMA[shortEMA.length - 1];
  const previousShortEMA = shortEMA[shortEMA.length - 2];
  const currentLongEMA = longEMA[longEMA.length - 1];
  const previousLongEMA = longEMA[longEMA.length - 2];

  // Check for crossover
  const currentCrossover = currentShortEMA > currentLongEMA;
  const previousCrossover = previousShortEMA > previousLongEMA;

  // Generate signal
  let signal = 'NEUTRAL';
  if (currentCrossover && !previousCrossover) {
    signal = 'BUY'; // Bullish crossover
  } else if (!currentCrossover && previousCrossover) {
    signal = 'SELL'; // Bearish crossover
  }

  return {
    signal,
    meta: {
      shortEMA: currentShortEMA,
      longEMA: currentLongEMA,
      crossover: currentCrossover
    }
  };
}

// RSI (Relative Strength Index) Strategy
export function rsiStrategy(data: any[], period: number, overbought: number, oversold: number) {
  if (!data || data.length < period + 14) {
    return { signal: 'NEUTRAL', meta: {} };
  }

  // Calculate RSI
  const rsiValues = calculateRSI(data.map(d => d.close), period);
  
  // Current RSI value
  const currentRSI = rsiValues[rsiValues.length - 1];
  const previousRSI = rsiValues[rsiValues.length - 2];

  // Generate signal
  let signal = 'NEUTRAL';
  if (currentRSI < oversold && previousRSI >= oversold) {
    signal = 'BUY'; // Oversold condition
  } else if (currentRSI > overbought && previousRSI <= overbought) {
    signal = 'SELL'; // Overbought condition
  }

  return {
    signal,
    meta: {
      rsi: currentRSI,
      overbought,
      oversold
    }
  };
}

// MACD (Moving Average Convergence Divergence) Strategy
export function macdStrategy(data: any[], fastPeriod: number, slowPeriod: number, signalPeriod: number) {
  if (!data || data.length < slowPeriod + signalPeriod) {
    return { signal: 'NEUTRAL', meta: {} };
  }

  // Calculate MACD
  const { macdLine, signalLine, histogram } = calculateMACD(
    data.map(d => d.close),
    fastPeriod,
    slowPeriod,
    signalPeriod
  );
  
  // Current and previous values
  const currentMacd = macdLine[macdLine.length - 1];
  const currentSignal = signalLine[signalLine.length - 1];
  const currentHistogram = histogram[histogram.length - 1];
  const previousHistogram = histogram[histogram.length - 2];

  // Generate signal
  let signal = 'NEUTRAL';
  if (currentMacd > currentSignal && previousHistogram <= 0 && currentHistogram > 0) {
    signal = 'BUY'; // Bullish crossover
  } else if (currentMacd < currentSignal && previousHistogram >= 0 && currentHistogram < 0) {
    signal = 'SELL'; // Bearish crossover
  }

  return {
    signal,
    meta: {
      macd: currentMacd,
      signal: currentSignal,
      histogram: currentHistogram
    }
  };
}

// Bollinger Bands Strategy
export function bollingerBandsStrategy(data: any[], period: number, stdDev: number) {
  if (!data || data.length < period) {
    return { signal: 'NEUTRAL', meta: {} };
  }

  // Calculate Bollinger Bands
  const { middle, upper, lower } = calculateBollingerBands(
    data.map(d => d.close),
    period,
    stdDev
  );
  
  // Current values
  const currentPrice = data[data.length - 1].close;
  const currentUpper = upper[upper.length - 1];
  const currentLower = lower[lower.length - 1];
  const previousPrice = data[data.length - 2].close;
  const previousLower = lower[lower.length - 2];
  const previousUpper = upper[upper.length - 2];

  // Generate signal
  let signal = 'NEUTRAL';
  if (previousPrice <= previousLower && currentPrice > currentLower) {
    signal = 'BUY'; // Price bounced off lower band
  } else if (previousPrice >= previousUpper && currentPrice < currentUpper) {
    signal = 'SELL'; // Price bounced off upper band
  }

  return {
    signal,
    meta: {
      price: currentPrice,
      upper: currentUpper,
      middle: middle[middle.length - 1],
      lower: currentLower
    }
  };
}

// Helper functions for calculations

// Calculate EMA (Exponential Moving Average)
function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const emaData: number[] = [];
  
  // Initialize with SMA
  let ema = data.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  emaData.push(ema);
  
  // Calculate EMA for the rest of the data
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * k + ema;
    emaData.push(ema);
  }
  
  return emaData;
}

// Calculate RSI (Relative Strength Index)
function calculateRSI(data: number[], period: number): number[] {
  const rsiData: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate gains and losses
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
  
  // Calculate RSI
  let rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // Avoid division by zero
  rsiData.push(100 - (100 / (1 + rs)));
  
  // Calculate subsequent RSI values
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
    rsiData.push(100 - (100 / (1 + rs)));
  }
  
  return rsiData;
}

// Calculate MACD (Moving Average Convergence Divergence)
function calculateMACD(data: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number) {
  // Calculate fast and slow EMAs
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // Calculate MACD line (fast EMA - slow EMA)
  const macdLine: number[] = [];
  for (let i = 0; i < fastEMA.length; i++) {
    if (i >= slowEMA.length - fastEMA.length) {
      macdLine.push(fastEMA[i] - slowEMA[i + (slowEMA.length - fastEMA.length)]);
    }
  }
  
  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  // Calculate histogram (MACD line - signal line)
  const histogram: number[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + (macdLine.length - signalLine.length)] - signalLine[i]);
  }
  
  return { macdLine, signalLine, histogram };
}

// Calculate Bollinger Bands
function calculateBollingerBands(data: number[], period: number, stdDev: number) {
  const middle: number[] = [];
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, price) => sum + price, 0) / period;
    
    // Calculate standard deviation
    const squaredDiffs = slice.map(price => Math.pow(price - avg, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
    const sd = Math.sqrt(variance);
    
    middle.push(avg);
    upper.push(avg + (stdDev * sd));
    lower.push(avg - (stdDev * sd));
  }
  
  return { middle, upper, lower };
}
