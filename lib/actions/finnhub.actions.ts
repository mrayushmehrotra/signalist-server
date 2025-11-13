import { getDateRange, validateArticle, formatArticle } from "@/lib/utils";
import { POPULAR_STOCK_SYMBOLS } from "@/lib/constants";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";

// --- Simple in-memory cache with TTL ---
const memoryCache = new Map<string, { value: any; expiry: number }>();

function memoize<T>(key: string, ttlSeconds: number, fetchFn: () => Promise<T>): Promise<T> {
  const cached = memoryCache.get(key);
  const now = Date.now();

  if (cached && cached.expiry > now) {
    return Promise.resolve(cached.value as T);
  }

  return fetchFn().then((value) => {
    memoryCache.set(key, { value, expiry: now + ttlSeconds * 1000 });
    return value;
  });
}

// --- Helper to fetch JSON safely ---
async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch failed ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

// --- Fetch News ---
export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    const range = getDateRange(5);
    if (!FINNHUB_API_KEY) throw new Error("FINNHUB API key is not configured");

    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    // If specific symbols are requested
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.map(async (sym) => {
          const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${FINNHUB_API_KEY}`;
          try {
            const articles = await memoize(url, 300, async () =>
              fetchJSON<RawNewsArticle[]>(url)
            );
            perSymbolArticles[sym] = (articles || []).filter(validateArticle);
          } catch (e) {
            console.error("Error fetching company news for", sym, e);
            perSymbolArticles[sym] = [];
          }
        }),
      );

      const collected: MarketNewsArticle[] = [];
      for (let round = 0; round < maxArticles; round++) {
        for (const sym of cleanSymbols) {
          const list = perSymbolArticles[sym] || [];
          if (!list.length) continue;
          const article = list.shift();
          if (article && validateArticle(article)) {
            collected.push(formatArticle(article, true, sym, round));
          }
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length) {
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
    }

    // General news fallback
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${FINNHUB_API_KEY}`;
    const general = await memoize(generalUrl, 300, async () =>
      fetchJSON<RawNewsArticle[]>(generalUrl)
    );

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break;
    }

    return unique
      .slice(0, maxArticles)
      .map((a, idx) => formatArticle(a, false, undefined, idx));
  } catch (err) {
    console.error("getNews error:", err);
    throw new Error("Failed to fetch news");
  }
}

// --- Search Stocks ---
export async function searchStocks(query?: string): Promise<StockWithWatchlistStatus[]> {
  try {
    if (!FINNHUB_API_KEY) {
      console.error("FINNHUB API key not configured");
      return [];
    }

    const trimmed = (query || "").trim();
    let results: FinnhubSearchResult[] = [];

    if (!trimmed) {
      // Fetch profiles of top popular symbols
      const profiles = await Promise.all(
        POPULAR_STOCK_SYMBOLS.slice(0, 10).map(async (sym) => {
          const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${FINNHUB_API_KEY}`;
          try {
            const profile = await memoize(url, 3600, async () => fetchJSON<any>(url));
            return { sym, profile };
          } catch (e) {
            console.error("Error fetching profile2 for", sym, e);
            return { sym, profile: null };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          if (!profile?.name && !profile?.ticker) return undefined;
          const symbol = sym.toUpperCase();
          const name = profile.name || profile.ticker;
          const exchange = profile.exchange || "US";
          const r: FinnhubSearchResult = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: "Common Stock",
          };
          (r as any).__exchange = exchange;
          return r;
        })
        .filter((r): r is FinnhubSearchResult => Boolean(r));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${FINNHUB_API_KEY}`;
      const data = await memoize(url, 1800, async () => fetchJSON<FinnhubSearchResponse>(url));
      results = Array.isArray(data?.result) ? data.result : [];
    }

    return results.slice(0, 15).map((r) => ({
      symbol: r.symbol.toUpperCase(),
      name: r.description || r.symbol,
      exchange: (r as any).__exchange || "US",
      type: r.type || "Stock",
      isInWatchlist: false,
    }));
  } catch (err) {
    console.error("Error in stock search:", err);
    return [];
  }
}
