import { supabase } from '../lib/supabase.js';

export async function getUnprocessedPostIds(latestPostIds: number[]): Promise<number[]> {
  if (latestPostIds.length === 0) return [];

  const { data, error } = await supabase
    .from('insights')
    .select('post_id')
    .in('post_id', latestPostIds);

  if (error) throw error;

  const processedIds = new Set(data?.map(i => i.post_id) || []);
  return latestPostIds.filter(id => !processedIds.has(id));
}
