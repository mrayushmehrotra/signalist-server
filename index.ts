import { serve } from "bun";
import { auth } from "./lib/better-auth/auth";
import { inngest } from "./lib/inngest/client";
import { sendDailyNewsSummary, sendSignUpEmail } from "./lib/inngest/functions";
import { searchStocks } from "./lib/actions/finnhub.actions";
import { getWatchlistSymbolsByEmail } from "./lib/actions/watchlist.actions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
  "Access-Control-Allow-Credentials": "true",
};

const server = serve({
  port: process.env.PORT || 3001,
  async fetch(req) {
    const url = new URL(req.url);
    
    // Handle OPTIONS for auth endpoints first
    if (req.method === "OPTIONS" && url.pathname.startsWith("/api/auth")) {
      return new Response(null, { status: 200, headers: corsHeaders });
    }
    
    // Better Auth endpoints
    if (url.pathname.startsWith("/api/auth")) {
      console.log("Auth request:", req.method, url.pathname);
      try {
        const response = await auth.handler(req);
        // Ensure CORS headers are present
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      } catch (error) {
        console.error("Auth handler error:", error);
        return new Response(JSON.stringify({ error: "Auth handler failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    
    // Inngest webhook
    if (url.pathname === "/api/inngest") {
      const { serve: inngestServe } = await import("inngest/bun");
      const handler = inngestServe({
        client: inngest,
        functions: [sendSignUpEmail, sendDailyNewsSummary],
      });
      return handler(req);
    }
    
    // Stock search API
    if (url.pathname === "/api/stocks/search") {
      try {
        const query = url.searchParams.get("q");
        const stocks = await searchStocks(query || undefined);
        return new Response(JSON.stringify(stocks), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to search stocks" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    
    // Watchlist API
    if (url.pathname.startsWith("/api/watchlist")) {
      const method = req.method;
      
      if (method === "GET") {
        const pathParts = url.pathname.split("/");
        const userId = pathParts[3];
        
        if (userId) {
          try {
            // Get user email from session or user ID lookup
            const symbols = await getWatchlistSymbolsByEmail(userId);
            return new Response(JSON.stringify(symbols), {
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          } catch (error) {
            return new Response(JSON.stringify({ error: "Failed to get watchlist" }), {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
        }
      }
    }
    
    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }
    
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }
    
    return new Response("Not Found", { 
      status: 404,
      headers: corsHeaders
    });
  },
});

console.log(`Server running on port ${server.port}`);