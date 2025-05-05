import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Set up Neon WebSocket constructor
neonConfig.webSocketConstructor = ws;

// Check for database URL environment variable
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a singleton pool for serverless environments to avoid connection limits
let poolInstance: Pool | null = null;

export function getPool() {
  if (!poolInstance) {
    poolInstance = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return poolInstance;
}

// Initialize Drizzle ORM with the pool
export const db = drizzle({ client: getPool(), schema });

// Helper function to close the pool (important for cleanup in serverless environments)
export async function closePool() {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
}
