import { serve } from "bun";
import { inngest } from "./lib/inngest/client";
import { sendDailyNewsSummary, sendSignUpEmail } from "./lib/inngest/functions";
import { searchStocks } from "./lib/actions/finnhub.actions";
import { getWatchlistSymbolsByEmail, addToWatchlist, removeFromWatchlist } from "./lib/actions/watchlist.actions";

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
    
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }
    
    // Better Auth routes - proxy to Convex
    if (url.pathname.startsWith("/api/auth")) {
      const convexUrl = process.env.CONVEX_URL;
      if (!convexUrl) {
        return new Response(JSON.stringify({ error: "Convex URL not configured" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      
      const authPath = url.pathname.replace('/api/auth', '');
      const convexAuthUrl = `${convexUrl.replace('.cloud', '.site')}/auth${authPath}${url.search}`;
      
      try {
        const response = await fetch(convexAuthUrl, {
          method: req.method,
          headers: req.headers,
          body: req.method !== 'GET' ? await req.text() : undefined,
        });
        
        const responseHeaders = new Headers(corsHeaders);
        response.headers.forEach((value, key) => {
          if (!key.toLowerCase().startsWith('access-control-')) {
            responseHeaders.set(key, value);
          }
        });
        
        return new Response(response.body, {
          status: response.status,
          headers: responseHeaders,
        });
      } catch (error) {
        console.error("Auth proxy error:", error);
        return new Response(JSON.stringify({ error: "Auth request failed" }), {
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
    
    // Watchlist APIs
    if (url.pathname.startsWith("/api/watchlist")) {
      const method = req.method;
      
      if (method === "GET") {
        const pathParts = url.pathname.split("/");
        const userId = pathParts[3];
        
        if (userId) {
          try {
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
      
      if (method === "POST") {
        try {
          const { userId, symbol, company } = await req.json();
          await addToWatchlist(userId, symbol, company);
          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: "Failed to add to watchlist" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }
      
      if (method === "DELETE") {
        const pathParts = url.pathname.split("/");
        const userId = pathParts[3];
        const symbol = pathParts[4];
        
        if (userId && symbol) {
          try {
            await removeFromWatchlist(userId, symbol);
            return new Response(JSON.stringify({ success: true }), {
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          } catch (error) {
            return new Response(JSON.stringify({ error: "Failed to remove from watchlist" }), {
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
    
    return new Response("Not Found", { 
      status: 404,
      headers: corsHeaders
    });
  },
});

console.log(`Server running on port ${server.port}`);
console.log("Better Auth initialized successfully");