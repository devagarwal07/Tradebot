import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as stockController from "./controllers/stockController";
import * as tradingController from "./controllers/tradingController";
import * as backtestController from "./controllers/backtestController";

export async function registerRoutes(app: Express): Promise<Server | Express> {
  // Stock routes
  app.get("/api/stocks/search", stockController.searchStocks);
  app.get("/api/stocks/:symbol", stockController.getStockDetails);
  app.get("/api/stocks/chart", stockController.getStockChart);

  // Trading routes
  app.get("/api/trading/active", tradingController.getActiveOrders);
  app.get("/api/trading/history", tradingController.getTradeHistory);
  app.post("/api/trading/start", tradingController.startTrading);
  app.post("/api/trading/stop/:id", tradingController.stopTrading);
  app.post("/api/trading/cancel/:id", tradingController.cancelOrder);
  app.post("/api/trading/buy", tradingController.placeManualBuyOrder);
  app.post("/api/trading/sell", tradingController.placeManualSellOrder);

  // Performance and analytics routes
  app.get("/api/performance/metrics", tradingController.getPerformanceMetrics);
  app.get("/api/performance/strategies", tradingController.getStrategyPerformance);
  app.get("/api/performance/risk", tradingController.getRiskAnalysis);
  app.get("/api/portfolio", tradingController.getPortfolio);

  // Strategy routes
  app.get("/api/strategies", tradingController.getStrategies);

  // Settings routes
  app.get("/api/settings", tradingController.getSettings);
  app.post("/api/settings", tradingController.saveSettings);

  // Authentication routes
  app.post("/api/auth/verify-api-key", tradingController.verifyApiKey);
  
  // Backtesting routes
  app.post("/api/backtest/run", backtestController.runBacktestController);
  app.get("/api/backtest/list", backtestController.getUserBacktestsController);
  app.get("/api/backtest/strategies", backtestController.getBacktestStrategiesController);
  app.get("/api/backtest/:id", backtestController.getBacktestDetailsController);

  // For non-serverless environments, create and return an HTTP server
  if (process.env.NODE_ENV !== 'production' || process.env.SERVER_MODE === 'standalone') {
    const httpServer = createServer(app);
    return httpServer;
  }
  
  // For serverless environments, just return the Express app
  return app;
}
