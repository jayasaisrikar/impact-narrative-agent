import { createClient } from "npm:@supabase/supabase-js@2";
import { generateCompanyInsightForPosts } from "../services/geminiService.ts";
import { getCompanyName } from "../utils/companyUtils.ts";

declare const Deno: any;

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateCompanyInsights() {
  console.log("Fetching all insights...");

  const { data: insights, error } = await supabase
    .from("insights")
    .select("*");

  if (error) {
    console.error("Error fetching insights:", error);
    Deno.exit(1);
  }

  const groupedByTicker = new Map<string, any[]>();
  
  for (const insight of insights || []) {
    const ticker = insight.company_ticker || 'Unknown';
    if (!groupedByTicker.has(ticker)) {
      groupedByTicker.set(ticker, []);
    }
    groupedByTicker.get(ticker)!.push(insight);
  }

  console.log(`Found ${groupedByTicker.size} companies`);

  for (const [ticker, insightsForCompany] of groupedByTicker.entries()) {
    if (ticker === 'Unknown' || insightsForCompany.length === 0) continue;

    try {
      console.log(`\nProcessing ${ticker} (${insightsForCompany.length} insights)...`);

      const { data: posts, error: postsError } = await supabase
        .from("latest_posts")
        .select("*")
        .in("id", insightsForCompany.map(i => i.post_id));

      if (postsError || !posts) {
        console.warn(`Failed to fetch posts for ${ticker}`);
        continue;
      }

      const companyName = getCompanyName(ticker);
      console.log(`Generating insight for ${companyName}...`);
      
      const companyInsight = await generateCompanyInsightForPosts(companyName, posts);

      if (!companyInsight) {
        console.warn(`Failed to generate company insight for ${ticker}`);
        continue;
      }

      const latestPostDate = posts
        .map(p => new Date(p.published_date).getTime())
        .sort((a, b) => b - a)[0] || new Date().getTime();

      console.log(`Upserting company insight for ${ticker}...`);

      const { error: upsertError } = await supabase
        .from("company_insights")
        .upsert([{
          company_ticker: ticker,
          summary: companyInsight.summary,
          implications_investor: companyInsight.implications_investor,
          implications_company: companyInsight.implications_company,
          narratives: companyInsight.narratives,
          event_types: companyInsight.event_types,
          related_post_count: insightsForCompany.length,
          latest_post_date: new Date(latestPostDate).toISOString(),
          updated_at: new Date().toISOString(),
        }], 
        { onConflict: 'company_ticker' });

      if (upsertError) {
        console.error(`Error upserting company insight for ${ticker}:`, upsertError);
      } else {
        console.log(`✓ Company insight created for ${ticker}`);
      }
    } catch (error) {
      console.error(`Error processing company insight for ${ticker}:`, error);
    }
  }

  console.log("\n✅ Done!");
}

await generateCompanyInsights();
