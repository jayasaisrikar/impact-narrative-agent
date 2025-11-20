import { createClient } from '@supabase/supabase-js';
import type { CompanyInsight } from '../types';

let supabase: ReturnType<typeof createClient>;

function getSupabase() {
  if (!supabase) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

export async function fetchCompanyInsight(ticker: string): Promise<CompanyInsight | null> {
  try {
    const { data, error } = await getSupabase()
      .from('company_insights')
      .select('*')
      .eq('company_ticker', ticker.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as CompanyInsight;
  } catch (error) {
    console.error('Failed to fetch company insight:', error);
    throw error;
  }
}
