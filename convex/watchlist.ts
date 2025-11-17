import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("watchlist")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getSymbolsByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("watchlist")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return items.map(item => item.symbol);
  },
});

export const add = mutation({
  args: {
    userId: v.string(),
    symbol: v.string(),
    company: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("watchlist")
      .withIndex("by_user_symbol", (q) => 
        q.eq("userId", args.userId).eq("symbol", args.symbol)
      )
      .first();

    if (existing) {
      throw new Error("Symbol already in watchlist");
    }

    return await ctx.db.insert("watchlist", {
      userId: args.userId,
      symbol: args.symbol.toUpperCase(),
      company: args.company,
      addedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    userId: v.string(),
    symbol: v.string(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("watchlist")
      .withIndex("by_user_symbol", (q) => 
        q.eq("userId", args.userId).eq("symbol", args.symbol)
      )
      .first();

    if (!item) {
      throw new Error("Item not found");
    }

    await ctx.db.delete(item._id);
  },
});