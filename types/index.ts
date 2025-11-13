// Server-side type definitions

export interface SignUpFormData {
  email: string;
  password: string;
  fullName: string;
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface RawNewsArticle {
  id: number;
  headline?: string;
  summary?: string;
  url?: string;
  datetime?: number;
  source?: string;
  image?: string;
  category?: string;
  related?: string;
}

export interface MarketNewsArticle {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  image: string;
  category: string;
  related: string;
}

export interface FinnhubSearchResult {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
}

export interface FinnhubSearchResponse {
  result: FinnhubSearchResult[];
}

export interface StockWithWatchlistStatus {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  isInWatchlist: boolean;
}

export interface Alert {
  alertType: 'upper' | 'lower';
  threshold: number;
}