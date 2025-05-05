import { Express, Request, Response, NextFunction } from 'express';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import memorystore from 'memorystore';
import { registerRoutes } from '../server/routes';
import { seedDatabase } from '../server/seed';
import { angelOneApi } from '../server/utils/angelOne';

// Initialize AngelOne API if key is set
if (process.env.ANGELONE_API_KEY) {
  angelOneApi.reinitializeAPI().catch((err) => {
    console.error('Failed to initialize AngelOne API:', err);
  });
} else {
  console.warn('AngelOne API Key not found. API will not be fully functional.');
}

// Seed the database if needed - this is async but we don't need to await it in serverless
// since Vercel will keep the container warm after the first request
seedDatabase().catch(err => {
  console.error('Database seeding error:', err);
});

// Create Express memory store
const MemoryStore = memorystore(session);

// Configure Express
const app = express();

// Setup API parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'trading-app-secret',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: { secure: process.env.NODE_ENV === 'production' },
  }),
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Error Handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error',
  });
});

// Register all API routes
registerRoutes(app);

// Add a wildcard handler for Vercel
app.all('*', (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' });
});

// Export for serverless environment
export default app;
