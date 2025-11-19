
import { createClient } from '@supabase/supabase-js';
import type { Insight, CompanyInsight } from '../types';
import { extractCompanyTicker, getCompanyName } from '../utils/companyUtils';

// --- Supabase Client Initialization ---
// Read Supabase config from Vite env variables (prefix VITE_ for browser-safe access)
function getEnvVar(key: string): string | undefined {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const v = (import.meta as any).env[key];
      if (v) return String(v);
    }
  } catch (ignore) {}
  return undefined;
}

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = (getEnvVar('VITE_SUPABASE_ANON_KEY') || '').replace(/^\"|\"$/g, '');

// A single Supabase client instance
let supabase;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('Supabase client initialized for frontend.');
  try {
    const maskedKey = SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.slice(0,6)}...${SUPABASE_ANON_KEY.slice(-4)}` : '(none)';
    console.log('Using SUPABASE_URL:', SUPABASE_URL);
    console.log('Using SUPABASE_ANON_KEY (masked):', maskedKey);
  } catch (err) {}
} else {
  console.warn(`Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.`);
}

export const fetchInsights = async (): Promise<Insight[]> => {
  if (!supabase) {
    throw new Error("Supabase client is not initialized. Please configure your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  
  console.log("Fetching insights from Supabase...");

  // The query fetches insights and joins the related post data from the 'latest_posts' table.
  // Supabase automatically maps the 'post:latest_posts(*)' to the 'post' property.
  const { data, error } = await supabase
    .from('insights')
    .select(`
      id,
      post_id,
      summary,
      implications_investor,
      implications_company,
      narratives,
      event_type,
      created_at,
      company_ticker,
      post:latest_posts (
        id,
        title,
        summary,
        url,
        published_date
      )
    `)
    .order('created_at', { ascending: false }); // Show newest insights first

  if (error) {
    console.error("Error fetching insights:", error);
    // Propagate the error to be handled by the UI component
    throw new Error(error.message || "Unknown error fetching insights from Supabase");
  }

  // Normalize post fields and extract company ticker if not already set
  const normalized = (data as any[] || []).map(insight => {
    if (insight.post) {
      if (!insight.post.published_date && insight.post.published_at) {
        insight.post.published_date = insight.post.published_at;
      }
    }
    // Extract company ticker if not already in database
    if (!insight.company_ticker && insight.post) {
      insight.company_ticker = extractCompanyTicker(insight.post.title, insight.post.summary);
    }
    return insight;
  });

  // Filter out any insights where the related post might be null (e.g., if it was deleted).
  return normalized.filter(insight => insight.post) as Insight[];
};

/**
 * Group insights by company ticker and create company-level insights
 * Returns insights grouped by company, with company metadata and aggregated information
 */
export const groupInsightsByCompany = (insights: Insight[]): CompanyInsight[] => {
  const groupedByTicker = new Map<string, Insight[]>();

  // Group insights by company_ticker
  for (const insight of insights) {
    const ticker = insight.company_ticker || 'Unknown';
    if (!groupedByTicker.has(ticker)) {
      groupedByTicker.set(ticker, []);
    }
    groupedByTicker.get(ticker)!.push(insight);
  }

  // Convert grouped data into CompanyInsight objects
  const companyInsights: CompanyInsight[] = [];

  for (const [ticker, insightsForCompany] of groupedByTicker.entries()) {
    // Collect all unique event types
    const eventTypes = Array.from(new Set(insightsForCompany.map(i => i.event_type)));

    // Synthesize narratives - deduplicate similar ones and keep most relevant
    const allNarratives = insightsForCompany.flatMap(i => i.narratives);
    const uniqueNarratives = Array.from(new Set(allNarratives.map(n => n.toLowerCase())))
      .slice(0, 6)
      .map(n => {
        // Return the original casing for the first occurrence
        return insightsForCompany
          .flatMap(i => i.narratives)
          .find(narrative => narrative.toLowerCase() === n) || n;
      });

    // Get the most recent post date
    const latestPostDate = insightsForCompany
      .map(i => i.post.published_date)
      .sort()
      .reverse()[0] || new Date().toISOString();

    // Collect all related posts
    const posts = insightsForCompany
      .map(i => i.post)
      .sort((a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime());

    // Synthesize summary and implications from all insights
    const summaries = insightsForCompany.map(i => i.summary);
    const investorImplications = insightsForCompany.map(i => i.implications_investor);
    const companyImplications = insightsForCompany.map(i => i.implications_company);

    // Create company insight by combining first insight with aggregated data
    const firstInsight = insightsForCompany[0];
    const companyInsight: CompanyInsight = {
      company_ticker: ticker,
      company_name: getCompanyName(ticker),
      summary: `${ticker} is experiencing multiple developments: ${summaries.slice(0, 2).join('; ')}${insightsForCompany.length > 2 ? '; and more.' : '.'}`,
      implications_investor: firstInsight.implications_investor,
      implications_company: firstInsight.implications_company,
      narratives: uniqueNarratives,
      event_types: eventTypes,
      related_post_count: insightsForCompany.length,
      latest_post_date: latestPostDate,
      posts: posts,
      created_at: insightsForCompany[0].created_at,
    };

    companyInsights.push(companyInsight);
  }

  // Sort by latest post date (most recent first)
  companyInsights.sort((a, b) => 
    new Date(b.latest_post_date).getTime() - new Date(a.latest_post_date).getTime()
  );

  return companyInsights;
};
