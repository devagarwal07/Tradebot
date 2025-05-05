import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Stock schema
export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  lastPrice: doublePrecision("last_price"),
  change: doublePrecision("change"),
  changePercent: doublePrecision("change_percent"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStockSchema = createInsertSchema(stocks).pick({
  symbol: true,
  name: true,
  lastPrice: true,
  change: true,
  changePercent: true,
});

export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stocks.$inferSelect;

// Trading strategies schema
export const strategies = pgTable("strategies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  parameters: jsonb("parameters").notNull(),
});

export const insertStrategySchema = createInsertSchema(strategies).pick({
  name: true,
  description: true,
  parameters: true,
});

export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Strategy = typeof strategies.$inferSelect;

// User Strategy Instances
export const userStrategies = pgTable("user_strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  strategyId: integer("strategy_id").notNull().references(() => strategies.id),
  stockSymbol: text("stock_symbol").notNull(),
  isActive: boolean("is_active").default(false),
  parameters: jsonb("parameters").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserStrategySchema = createInsertSchema(userStrategies).pick({
  userId: true,
  strategyId: true,
  stockSymbol: true,
  isActive: true,
  parameters: true,
});

export type InsertUserStrategy = z.infer<typeof insertUserStrategySchema>;
export type UserStrategy = typeof userStrategies.$inferSelect;

// Trades schema
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  userStrategyId: integer("user_strategy_id").references(() => userStrategies.id),
  stockSymbol: text("stock_symbol").notNull(),
  type: text("type").notNull(), // BUY or SELL
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  profit: doublePrecision("profit"),
  status: text("status").notNull(), // OPEN, COMPLETED, CANCELLED
  orderTime: timestamp("order_time").defaultNow(),
  executionTime: timestamp("execution_time"),
  trigger: text("trigger").notNull(), // What triggered the trade (e.g., "MA Crossover")
});

export const insertTradeSchema = createInsertSchema(trades).pick({
  userId: true,
  userStrategyId: true,
  stockSymbol: true,
  type: true,
  quantity: true,
  price: true,
  totalAmount: true,
  profit: true,
  status: true,
  trigger: true,
});

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;

// Portfolio schema
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  totalValue: doublePrecision("total_value").notNull(),
  investedAmount: doublePrecision("invested_amount").notNull(),
  profit: doublePrecision("profit").notNull(),
  profitPercent: doublePrecision("profit_percent").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPortfolioSchema = createInsertSchema(portfolios).pick({
  userId: true,
  totalValue: true,
  investedAmount: true,
  profit: true,
  profitPercent: true,
});

export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolios.$inferSelect;

// Portfolio positions
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id),
  stockSymbol: text("stock_symbol").notNull(),
  quantity: integer("quantity").notNull(),
  averageBuyPrice: doublePrecision("average_buy_price").notNull(),
  currentValue: doublePrecision("current_value").notNull(),
  profit: doublePrecision("profit").notNull(),
  profitPercent: doublePrecision("profit_percent").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPositionSchema = createInsertSchema(positions).pick({
  portfolioId: true,
  stockSymbol: true,
  quantity: true,
  averageBuyPrice: true,
  currentValue: true,
  profit: true,
  profitPercent: true,
});

export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;

// User settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  apiKey: text("api_key"),
  connected: boolean("connected").default(false),
  notifications: jsonb("notifications").notNull().default({}),
  risk: jsonb("risk").notNull().default({}),
  preferences: jsonb("preferences").notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  userId: true,
  apiKey: true,
  connected: true,
  notifications: true,
  risk: true,
  preferences: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Define relations for the users table
export const usersRelations = relations(users, ({ many }) => ({
  settings: many(settings),
  userStrategies: many(userStrategies),
  trades: many(trades),
  portfolios: many(portfolios),
}));

// Define relations for the strategies table
export const strategiesRelations = relations(strategies, ({ many }) => ({
  userStrategies: many(userStrategies),
}));

// Define relations for the userStrategies table
export const userStrategiesRelations = relations(userStrategies, ({ one, many }) => ({
  user: one(users, {
    fields: [userStrategies.userId],
    references: [users.id],
  }),
  strategy: one(strategies, {
    fields: [userStrategies.strategyId],
    references: [strategies.id],
  }),
  trades: many(trades),
}));

// Define relations for the trades table
export const tradesRelations = relations(trades, ({ one }) => ({
  user: one(users, {
    fields: [trades.userId],
    references: [users.id],
  }),
  userStrategy: one(userStrategies, {
    fields: [trades.userStrategyId],
    references: [userStrategies.id],
  }),
}));

// Define relations for the portfolios table
export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  user: one(users, {
    fields: [portfolios.userId],
    references: [users.id],
  }),
  positions: many(positions),
}));

// Define relations for the positions table
export const positionsRelations = relations(positions, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [positions.portfolioId],
    references: [portfolios.id],
  }),
}));

// Define relations for the settings table
export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.userId],
    references: [users.id],
  }),
}));

// Backtesting tables
export const backtests = pgTable("backtests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  strategyId: integer("strategy_id").notNull().references(() => strategies.id),
  stockSymbol: text("stock_symbol").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  initialCapital: doublePrecision("initial_capital").notNull(),
  finalCapital: doublePrecision("final_capital").notNull(),
  totalTrades: integer("total_trades").notNull(),
  winningTrades: integer("winning_trades").notNull(),
  losingTrades: integer("losing_trades").notNull(),
  parameters: jsonb("parameters").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBacktestSchema = createInsertSchema(backtests).pick({
  userId: true,
  strategyId: true,
  stockSymbol: true,
  startDate: true,
  endDate: true,
  initialCapital: true,
  finalCapital: true,
  totalTrades: true,
  winningTrades: true,
  losingTrades: true,
  parameters: true,
});

export type InsertBacktest = z.infer<typeof insertBacktestSchema>;
export type Backtest = typeof backtests.$inferSelect;

export const backtestTrades = pgTable("backtest_trades", {
  id: serial("id").primaryKey(),
  backtestId: integer("backtest_id").notNull().references(() => backtests.id),
  type: text("type", { enum: ["BUY", "SELL"] }).notNull(),
  date: timestamp("date").notNull(),
  price: doublePrecision("price").notNull(),
  quantity: integer("quantity").notNull(),
  profit: doublePrecision("profit"),
});

export const insertBacktestTradeSchema = createInsertSchema(backtestTrades).pick({
  backtestId: true,
  type: true,
  date: true,
  price: true,
  quantity: true,
  profit: true,
});

export type InsertBacktestTrade = z.infer<typeof insertBacktestTradeSchema>;
export type BacktestTrade = typeof backtestTrades.$inferSelect;

// Relations
export const backtestsRelations = relations(backtests, ({ one, many }) => ({
  user: one(users, { fields: [backtests.userId], references: [users.id] }),
  strategy: one(strategies, { fields: [backtests.strategyId], references: [strategies.id] }),
  trades: many(backtestTrades),
}));

export const backtestTradesRelations = relations(backtestTrades, ({ one }) => ({
  backtest: one(backtests, { fields: [backtestTrades.backtestId], references: [backtests.id] }),
}));

// Update user relations to include backtests
export const usersRelationsWithBacktests = relations(users, ({ many }) => ({
  ...usersRelations.config,
  backtests: many(backtests),
}));
