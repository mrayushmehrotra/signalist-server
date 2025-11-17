# Server

This is the backend server for Signalist, built with Bun and TypeScript.

## Getting Started

1. Install dependencies:
```bash
bun install
```

2. Set up Convex:
```bash
npx convex dev
```

3. Set up environment variables:
Copy `.env.example` to `.env` and configure:
```
CONVEX_URL=your_convex_deployment_url
BETTER_AUTH_SECRET=your_auth_secret
INNGEST_EVENT_KEY=your_inngest_key
FINNHUB_API_KEY=your_finnhub_api_key
RESEND_API_KEY=your_resend_api_key
```

4. Run the development server:
```bash
bun run dev
```

The server will be available at [http://localhost:3001](http://localhost:3001).

## Features

- User authentication with Better Auth
- Convex database integration
- Background job processing with Inngest
- Email services with Resend/Nodemailer
- Stock data integration with Finnhub API
- Watchlist management

## Tech Stack

- Bun runtime
- TypeScript
- Convex for database and real-time features
- Better Auth for authentication
- Inngest for background jobs
- Resend for email services

## API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/stocks/search` - Search stocks
- `GET /api/watchlist/:userId` - Get user watchlist
- `POST /api/watchlist` - Add to watchlist
- `DELETE /api/watchlist/:userId/:symbol` - Remove from watchlist
- `POST /api/inngest` - Inngest webhook endpoint

## Database

The server uses Convex for data persistence with the following schema:
- Watchlist items with user associations
- User data (handled by Better Auth)

## Convex Functions

- `watchlist.getByUserId` - Get all watchlist items for a user
- `watchlist.getSymbolsByUserId` - Get watchlist symbols for a user
- `watchlist.add` - Add item to watchlist
- `watchlist.remove` - Remove item from watchlist