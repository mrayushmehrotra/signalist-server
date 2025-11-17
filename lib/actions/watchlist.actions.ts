import { convex } from "../convex";
import { api } from "../../convex/_generated/api";

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    // For now, using email as userId - you may want to implement proper user lookup
    const symbols = await convex.query(api.watchlist.getSymbolsByUserId, { 
      userId: email 
    });
    return symbols;
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

export async function addToWatchlist(userId: string, symbol: string, company: string) {
  return await convex.mutation(api.watchlist.add, {
    userId,
    symbol,
    company,
  });
}

export async function removeFromWatchlist(userId: string, symbol: string) {
  return await convex.mutation(api.watchlist.remove, {
    userId,
    symbol,
  });
}