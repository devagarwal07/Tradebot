# AngelOne Automated Trading Platform

An automated stock trading platform that uses AngelOne for executing trades based on user-selected strategies.

## Features

- 📈 Stock search and real-time market data
- 🤖 Automated trading with configurable strategies
- 📊 Performance tracking and analytics
- 💼 Portfolio management
- 🔐 Secure API integration with AngelOne
- 🗄️ Persistent data storage with PostgreSQL database

## Tech Stack

- **Frontend**: React, TailwindCSS, Shadcn UI components
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Trading**: AngelOne API integration
- **Charts**: Lightweight Charts

## Deploying to Vercel

### Prerequisites

1. Create a Vercel account at https://vercel.com
2. Install the Vercel CLI: `npm i -g vercel`
3. Have your PostgreSQL database URL ready (Neon, Railway, etc.)

### Steps to Deploy

1. Clone this repository
2. Copy `.env.example` to `.env` and fill in your database credentials and AngelOne API key
3. Run `vercel login` to log into your Vercel account
4. Run `vercel` in the project root directory to deploy
5. When prompted, set the following environment variables:
   - `DATABASE_URL`: Your PostgreSQL database connection string
   - `ANGELONE_API_KEY`: Your AngelOne API key
   - `SESSION_SECRET`: A secret string for securing sessions
   - `SERVER_MODE`: Set to `serverless` for Vercel deployment

### Project Structure for Vercel

The project uses a hybrid approach that works both locally and on Vercel:

- `/api` directory: Contains serverless functions for Vercel
- `/server` directory: Contains the full Express server for local development
- `/client` directory: Contains the React frontend

The `vercel.json` configuration routes API requests to serverless functions and all other requests to the static frontend.

## Local Development

1. Install dependencies: `npm install`
2. Create a PostgreSQL database and update your `.env` file
3. Push the database schema: `npm run db:push`
4. Start the development server: `npm run dev`

## License

MIT
