import { supabase } from '../lib/supabase.js';

export interface Post {
  id: number;
  content: string;
  created_at: string;
  [key: string]: any;
}

export interface Insight {
  post_id: number;
  summary: string;
  implications_investor: string;
  implications_company: string;
  narratives: string[];
  event_type: string;
  company_ticker: string;
}

export interface CompanyInsight {
  company_ticker: string;
  summary: string;
  implications_investor: string;
  implications_company: string;
  narratives: string[];
  event_types: string[];
  related_post_count: number;
  latest_post_date: string;
}

export const insightService = {
  async getUnprocessedPosts(limit = 10): Promise<Post[]> {
    // Get IDs of posts already processed
    // Note: For large datasets, this should be optimized (e.g., using a join or a flag on the posts table)
    const { data: processedIds } = await supabase
      .from('insights')
      .select('post_id');
    
    const processedPostIds = processedIds?.map(p => p.post_id) || [];

    let query = supabase
      .from('latest_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (processedPostIds.length > 0) {
      // Supabase filter for 'not in'
      query = query.not('id', 'in', `(${processedPostIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Post[];
  },

  async saveInsight(insight: Insight) {
    const { error } = await supabase
      .from('insights')
      .insert(insight);
    if (error) throw error;
  },

  async getUniqueTickers(): Promise<string[]> {
    const { data, error } = await supabase
      .from('insights')
      .select('company_ticker');
    
    if (error) throw error;
    const tickers = [...new Set(data?.map(d => d.company_ticker).filter(Boolean))];
    return tickers as string[];
  },

  async getInsightsByTicker(ticker: string): Promise<Insight[]> {
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .eq('company_ticker', ticker);
    
    if (error) throw error;
    return data as Insight[];
  },

  async getLatestPostDateForTicker(ticker: string): Promise<string> {
    // Join insights and latest_posts to find the max created_at
    const { data, error } = await supabase
      .from('insights')
      .select('post_id, latest_posts!inner(created_at)')
      .eq('company_ticker', ticker)
      .order('latest_posts(created_at)', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (data && data.length > 0) {
      return (data[0] as any).latest_posts.created_at;
    }
    return new Date().toISOString();
  },

  async saveCompanyInsight(insight: CompanyInsight) {
    const { error } = await supabase
      .from('company_insights')
      .upsert(insight, { onConflict: 'company_ticker' });
    if (error) throw error;
  }
};
