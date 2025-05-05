# Automated Stock Trading Platform

A full-stack application for automated stock trading using AngelOne's API, built with React, Express, and PostgreSQL.

## Features

- Real-time stock market data viewing
- Multiple trading strategy implementation (MACD, RSI, Moving Averages, Bollinger Bands)
- Automated trade execution based on selected strategies
- Comprehensive portfolio tracking
- Performance analytics
- Risk analysis
- User settings and preferences management

## Technologies Used

- **Frontend:** React, TailwindCSS, Shadcn/UI, React Query, wouter
- **Backend:** Express.js, Passport.js
- **Database:** PostgreSQL with Drizzle ORM
- **Charting:** Lightweight Charts
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL database
- AngelOne trading account with API access

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgresql://username:password@localhost:5432/trading_app
ANGELONE_API_KEY=your_angelone_api_key
SESSION_SECRET=your_session_secret
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Push the database schema:
   ```bash
   npm run db:push
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

This application is configured for deployment on Vercel.

### Deploying to Vercel

1. Fork this repository to your GitHub account
2. Connect your GitHub repository to Vercel
3. Add the required environment variables in Vercel:
   - `DATABASE_URL`
   - `ANGELONE_API_KEY`
   - `SESSION_SECRET`
4. Deploy!

## API Reference

### Authentication Endpoints

- `POST /api/auth/login` - Login with username and password
- `POST /api/auth/logout` - Logout current user

### Stock Data Endpoints

- `GET /api/stocks/search?query=<query>` - Search for stocks
- `GET /api/stocks/<symbol>` - Get stock details
- `GET /api/stocks/<symbol>/chart?timeframe=<1D|1W|1M|3M|1Y>` - Get stock chart data

### Trading Endpoints

- `GET /api/trading/orders` - Get active orders
- `GET /api/trading/history` - Get trade history
- `POST /api/trading/buy` - Place buy order
- `POST /api/trading/sell` - Place sell order
- `DELETE /api/trading/orders/:id` - Cancel order

### Strategy Endpoints

- `GET /api/strategies` - Get available strategies
- `POST /api/strategies/start` - Start a strategy
- `POST /api/strategies/stop/:id` - Stop a strategy

### Portfolio Endpoints

- `GET /api/portfolio` - Get portfolio summary and positions

### Settings Endpoints

- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings
- `POST /api/settings/verify-key` - Verify AngelOne API key

## License

This project is licensed under the MIT License
