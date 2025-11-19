/**
 * Company Extraction and Mapping Utilities
 * Handles extraction of company tickers from post titles and provides company metadata.
 */

export const COMPANY_TICKERS = [
  "MARA",
  "RIOT",
  "CORZ",
  "BTDR",
  "CLSK",
  "IREN",
  "HUT",
  "WULF",
  "CIFR",
  "FUFU",
  "BITF",
  "BTBT",
  "CAN",
  "CANG",
  "ARBK",
];

export const NON_NASDAQ_COMPANIES = ["PHX", "NB2", "HIVE"];

/**
 * Full company name mappings for tickers
 */
export const COMPANY_NAME_MAP: Record<string, string> = {
  MARA: "Marathon Digital",
  RIOT: "Riot Platforms",
  CORZ: "Core Scientific",
  BTDR: "Bitdeer Technologies",
  CLSK: "CleanSpark",
  IREN: "IREN",
  HUT: "Hut 8 Mining",
  WULF: "TeraWulf",
  CIFR: "Cipher Mining",
  FUFU: "Fusionist",
  BITF: "Bitfarms",
  BTBT: "Bit Digital",
  CAN: "Canaan",
  CANG: "Canaan Inc",
  ARBK: "Ark Global Acquisition",
  PHX: "Phoenix Group",
  NB2: "Northern Data",
  HIVE: "HIVE Blockchain",
};

/**
 * Keyword patterns to identify companies in post titles
 * Maps company ticker to patterns that might appear in titles
 */
export const COMPANY_KEYWORDS_MAP: Record<string, string[]> = {
  MARA: ["Marathon Digital", "Marathon", "MARA"],
  RIOT: ["Riot Platforms", "Riot", "RIOT"],
  CORZ: ["Core Scientific", "Core", "CORZ"],
  BTDR: ["Bitdeer", "BTDR"],
  CLSK: ["CleanSpark", "Clean Spark", "CLSK"],
  IREN: ["IREN"],
  HUT: ["Hut 8", "Hut8", "HUT"],
  WULF: ["TeraWulf", "Tera Wulf", "WULF"],
  CIFR: ["Cipher Mining", "Cipher", "CIFR"],
  FUFU: ["Fusionist", "FUFU"],
  BITF: ["Bitfarms", "BITF"],
  BTBT: ["Bit Digital", "BTBT"],
  CAN: ["Canaan", "CAN"],
  CANG: ["Canaan", "CANG"],
  ARBK: ["Ark Global", "ARBK"],
  PHX: ["Phoenix Group", "Phoenix", "PHX"],
  NB2: ["Northern Data", "Northern", "NB2"],
  HIVE: ["HIVE", "Hive Blockchain"],
};

/**
 * Extract company ticker from post title and summary
 * Uses keyword matching to identify which company the post is about
 * Returns the first matching ticker found, or null if none match
 */
export function extractCompanyTicker(title: string, summary: string = ""): string | null {
  const textToSearch = `${title} ${summary}`.toLowerCase();
  
  // Check each company's keywords
  for (const [ticker, keywords] of Object.entries(COMPANY_KEYWORDS_MAP)) {
    for (const keyword of keywords) {
      if (textToSearch.includes(keyword.toLowerCase())) {
        return ticker;
      }
    }
  }
  
  return null;
}

/**
 * Get company display name from ticker
 */
export function getCompanyName(ticker: string): string {
  return COMPANY_NAME_MAP[ticker] || ticker;
}

/**
 * Check if a company is listed on NASDAQ
 */
export function isNasdaqListed(ticker: string): boolean {
  return !NON_NASDAQ_COMPANIES.includes(ticker);
}

/**
 * Get all available company tickers (both NASDAQ and non-NASDAQ)
 */
export function getAllCompanyTickers(): string[] {
  return [...COMPANY_TICKERS, ...NON_NASDAQ_COMPANIES];
}
