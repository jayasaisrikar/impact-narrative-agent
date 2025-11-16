
import { createClient } from '@supabase/supabase-js';
import type { Insight } from '../types';

// --- Supabase Client Initialization ---
// Attempt to read Supabase config from Vite env variables (prefix VITE_ for Vite) or from process env
function getEnvVar(key: string): string | undefined {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const v = (import.meta as any).env[key];
      if (v) return String(v);
    }
  } catch (ignore) {}
  if (typeof process !== 'undefined' && (process.env as any)[key]) {
    return String((process.env as any)[key]);
  }
  return undefined;
}

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = (getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY') || '').replace(/^\"|\"$/g, '');

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

  // Normalize post fields: support posts that have `published_at` (legacy) or `published_date`.
  const normalized = (data as any[] || []).map(insight => {
    if (insight.post) {
      if (!insight.post.published_date && insight.post.published_at) {
        insight.post.published_date = insight.post.published_at;
      }
    }
    return insight;
  });

  // Filter out any insights where the related post might be null (e.g., if it was deleted).
  return normalized.filter(insight => insight.post) as Insight[];
};