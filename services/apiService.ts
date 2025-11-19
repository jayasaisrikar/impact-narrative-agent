import { createClient } from '@supabase/supabase-js';
import type { Insight, CompanyInsight } from '../types';
import { extractCompanyTicker, getCompanyName } from '../utils/companyUtils';

let supabase: ReturnType<typeof createClient>;

function getSupabase() {
  if (!supabase) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Missing Supabase credentials: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

/**
 * Fetch all insights for a specific company ticker
 */
export async function fetchCompanyInsights(ticker: string): Promise<Insight[]> {
  try {
    const { data, error } = await getSupabase()
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
      .eq('company_ticker', ticker)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch insights: ${error.message}`);
    }

    const normalized = (data as any[] || []).map(insight => {
      if (insight.post && !insight.post.published_date && insight.post.published_at) {
        insight.post.published_date = insight.post.published_at;
      }
      if (!insight.company_ticker) {
        insight.company_ticker = extractCompanyTicker(insight.post?.title || '', insight.post?.summary || '');
      }
      return insight;
    });

    return normalized.filter(insight => insight.post) as Insight[];
  } catch (error) {
    console.error('apiService error:', error);
    throw error;
  }
}

/**
 * Extract unique tags from narratives (the "Potential Investment Narratives")
 */
export function extractTags(insights: Insight[]): string[] {
  const allNarratives = insights.flatMap(i => i.narratives || []);
  return Array.from(new Set(allNarratives)).slice(0, 10);
}

/**
 * Synthesize narratives from all insights (deduplicated)
 */
export function synthesizeNarratives(insights: Insight[]): string[] {
  const allNarratives = insights.flatMap(i => i.narratives || []);
  const unique = Array.from(new Set(allNarratives.map(n => n.toLowerCase())));
  
  return unique
    .slice(0, 6)
    .map(n => {
      return insights
        .flatMap(i => i.narratives)
        .find(narrative => narrative.toLowerCase() === n) || n;
    });
}

/**
 * Create company insight response with tags, narratives, and summary
 */
export function buildCompanyResponse(ticker: string, insights: Insight[]) {
  const tags = extractTags(insights);
  const narratives = synthesizeNarratives(insights);
  const companyName = getCompanyName(ticker);
  
  const allEventTypes = Array.from(new Set(insights.map(i => i.event_type)));
  const latestDate = insights[0]?.created_at || new Date().toISOString();
  const relatedPostCount = insights.length;
  
  const summary = insights.length > 0
    ? `${ticker} has ${relatedPostCount} recent developments spanning ${allEventTypes.join(', ')}. Key themes include ${narratives.slice(0, 2).join(' and ')}.`
    : `No insights found for ${ticker}`;

  return {
    company_ticker: ticker,
    company_name: companyName,
    tags,
    narratives,
    event_types: allEventTypes,
    related_post_count: relatedPostCount,
    latest_update: latestDate,
    summary,
  };
}

/**
 * Validate company ticker exists in our dataset
 */
export async function validateCompanyTicker(ticker: string): Promise<boolean> {
  try {
    const { count, error } = await getSupabase()
      .from('insights')
      .select('id', { count: 'exact', head: true })
      .eq('company_ticker', ticker.toUpperCase());

    if (error) return false;
    return (count || 0) > 0;
  } catch {
    return false;
  }
}
