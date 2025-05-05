import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import memorystore from "memorystore";
import { createServer, Server } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { angelOneApi } from "./utils/angelOne";

// Initialize AngelOne API if key is set
if (process.env.ANGELONE_API_KEY) {
  angelOneApi.reinitializeAPI().catch((err) => {
    console.error('Failed to initialize AngelOne API:', err);
  });
} else {
  console.warn('AngelOne API Key not found. API will not be fully functional.');
}

// Create Express app and configure middleware
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create Express memory store for sessions
const MemoryStore = memorystore(session);

// Setup session - compatible with both Replit and Vercel
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

// Initialize passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Set environment flag for server mode - used in routes.ts
process.env.SERVER_MODE = 'standalone';

// Main initialization function
(async () => {
  // Register routes and get server or app based on environment
  const serverOrApp = await registerRoutes(app);
  let server: Server;
  
  // If serverOrApp is already a Server instance, use it directly
  if (serverOrApp instanceof Server) {
    server = serverOrApp;
  } else {
    // Otherwise, create a server from the Express app
    server = createServer(app);
  }

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

  // Setup static file serving based on environment
  if (app.get("env") === "development") {
    await setupVite(app, server as any);
  } else {
    serveStatic(app);
  }

  // Start server
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
