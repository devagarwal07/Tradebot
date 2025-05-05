import { db } from './db';
import { users, strategies, settings } from '../shared/schema';

/**
 * Seed the database with initial data
 * This is useful for both local development and production deployment
 */
export async function seedDatabase() {
  try {
    console.log('Checking if seed data is needed...');
    
    // Check if users table is empty
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('No users found, seeding database with initial data...');
      
      // Create a default user
      const [user] = await db.insert(users).values({
        username: 'demo',
        password: 'demo123', // In production, use proper password hashing
      }).returning();
      
      console.log(`Created default user with ID: ${user.id}`);
      
      // Create default strategies
      const strategyData = [
        {
          name: 'Moving Average Crossover',
          description: 'Generates signals when short-term moving average crosses long-term moving average',
          parameters: JSON.stringify({
            shortPeriod: 9,
            longPeriod: 21,
          }),
        },
        {
          name: 'RSI Strategy',
          description: 'Uses Relative Strength Index to identify overbought and oversold conditions',
          parameters: JSON.stringify({
            period: 14,
            overbought: 70,
            oversold: 30,
          }),
        },
        {
          name: 'MACD Strategy',
          description: 'Uses Moving Average Convergence Divergence for trend following',
          parameters: JSON.stringify({
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
          }),
        },
        {
          name: 'Bollinger Bands Strategy',
          description: 'Uses Bollinger Bands to identify volatility-based trading opportunities',
          parameters: JSON.stringify({
            period: 20,
            stdDev: 2,
          }),
        },
      ];
      
      for (const strategy of strategyData) {
        await db.insert(strategies).values(strategy);
      }
      
      console.log(`Created ${strategyData.length} default strategies`);
      
      // Create default settings for the user
      await db.insert(settings).values({
        userId: user.id,
        apiKey: null,
        connected: false,
        notifications: JSON.stringify({
          email: true,
          sms: false,
          push: true,
        }),
        risk: JSON.stringify({
          maxLoss: 5,
          maxPositions: 3,
          stopLoss: true,
        }),
        preferences: JSON.stringify({
          theme: 'light',
          refreshInterval: 60,
          defaultTimeframe: '1D',
        }),
      });
      
      console.log('Created default settings for user');
      console.log('Database seeding completed successfully!');
    } else {
      console.log('Database already contains data, skipping seed.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// For direct execution of this file in ESM
// We can't use require.main === module in ESM
const isMainModule = import.meta.url.endsWith('/seed.ts');

if (isMainModule) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}
