import { serve } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/better-auth/auth";
import { inngest } from "./lib/inngest/client";
import { serve as inngestServe } from "inngest/hono";
import { sendDailyNewsSummary, sendSignUpEmail } from "./lib/inngest/functions";
import { searchStocks } from "./lib/actions/finnhub.actions";
import { getWatchlistSymbolsByEmail, addToWatchlist, removeFromWatchlist } from "./lib/actions/watchlist.actions";

const app = new Hono();

// CORS middleware
app.use(
  "*",
  cors({
    origin: "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    credentials: true,
  })
);

// Better Auth routes
app.use("/api/auth/*", async (c) => {
  console.log("Auth request:", c.req.method, c.req.path);
  try {
    return await auth.handler(c.req.raw);
  } catch (error) {
    console.error("Auth handler error:", error);
    return c.json({ error: "Auth handler failed" }, 500);
  }
});

// Inngest webhook
app.use("/api/inngest", inngestServe({
  client: inngest,
  functions: [sendSignUpEmail, sendDailyNewsSummary],
}));

// Stock search API
app.get("/api/stocks/search", async (c) => {
  try {
    const query = c.req.query("q");
    const stocks = await searchStocks(query);
    return c.json(stocks);
  } catch (error) {
    return c.json({ error: "Failed to search stocks" }, 500);
  }
});

// Watchlist APIs
app.get("/api/watchlist/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const symbols = await getWatchlistSymbolsByEmail(userId);
    return c.json(symbols);
  } catch (error) {
    return c.json({ error: "Failed to get watchlist" }, 500);
  }
});

app.post("/api/watchlist", async (c) => {
  try {
    const { userId, symbol, company } = await c.req.json();
    await addToWatchlist(userId, symbol, company);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to add to watchlist" }, 500);
  }
});

app.delete("/api/watchlist/:userId/:symbol", async (c) => {
  try {
    const userId = c.req.param("userId");
    const symbol = c.req.param("symbol");
    await removeFromWatchlist(userId, symbol);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to remove from watchlist" }, 500);
  }
});

// Health check endpoint
app.get("/health", (c) => {
  return c.text("OK");
});

const port = process.env.PORT || 3001;

serve({
  fetch: app.fetch,
  port: Number(port),
});

console.log(`Server running on port ${port}`);