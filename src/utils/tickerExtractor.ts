export interface InsightResult {
  company_ticker: string;
  [key: string]: any;
}

export function extractUniqueTickers(insights: InsightResult[]): string[] {
  const tickers = insights
    .map(i => i.company_ticker)
    .filter(ticker => ticker && ticker !== 'UNKNOWN');
  
  return [...new Set(tickers)];
}
