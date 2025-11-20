/**
 * Deno Deploy Cron - Process Posts Every Hour
 * 
 * This file runs on Deno Deploy with built-in Deno.cron() for scheduled tasks
 * No external dependencies needed - fully serverless and managed
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { generateInsightForPost, generateCompanyInsightForPosts } from "./services/geminiService.ts";
import { extractCompanyTicker, getCompanyName } from "./utils/companyUtils.ts";

declare const Deno: any;

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function processNewPosts() {
  console.log(`[${new Date().toISOString()}] Starting scheduled post processing...`);

  try {
    const { data: insightPostIds, error: insightError } = await supabase
      .from("insights")
      .select("post_id");

    if (insightError) {
      console.error("Error fetching existing insight post_ids:", insightError);
      return;
    }

    const processedPostIds = (insightPostIds || []).map(i => i.post_id);
    console.log(`Processed posts: ${processedPostIds.length}`);

    let postsQuery = supabase.from("latest_posts").select("*").limit(50);
    if (processedPostIds && processedPostIds.length > 0) {
      const formattedIds = processedPostIds
        .filter(Boolean)
        .map(id => (typeof id === 'string' && isNaN(Number(id)) ? `'${id}'` : id))
        .join(',');
      postsQuery = postsQuery.not("id", "in", `(${formattedIds})`);
    }

    const { data: newPosts, error: postsError } = await postsQuery;

    if (postsError) {
      console.error("Error fetching new posts:", postsError);
      return;
    }

    if (!newPosts || newPosts.length === 0) {
      console.log("✅ No new posts to process");
      return;
    }

    console.log(`Processing ${newPosts.length} new posts...`);

    for (const post of newPosts) {
      try {
        const insight = await generateInsightForPost(post);
        if (!insight) {
          console.warn(`Skipping post #${post.id}: no insight generated`);
          continue;
        }

        const ticker = extractCompanyTicker(post.title, post.summary);
        
        const { error: insertError } = await supabase
          .from("insights")
          .insert([{
            post_id: post.id,
            summary: insight.summary,
            implications_investor: insight.implications_investor,
            implications_company: insight.implications_company,
            narratives: insight.narratives,
            event_type: insight.event_type,
            company_ticker: ticker,
          }]);

        if (insertError) {
          console.error(`Error inserting insight for post #${post.id}:`, insertError);
        } else {
          console.log(`✓ Insight generated for post #${post.id}`);
        }
      } catch (error) {
        console.error(`Error processing post #${post.id}:`, error);
      }
    }

    await generateCompanyInsights();
    console.log(`✅ Batch processing completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("Fatal error in processNewPosts:", error);
  }
}

async function generateCompanyInsights() {
  console.log("Generating company-level insights...");

  try {
    const { data: insights, error } = await supabase
      .from("insights")
      .select("*");

    if (error) {
      console.error("Error fetching insights:", error);
      return;
    }

    const groupedByTicker = new Map<string, any[]>();
    
    for (const insight of insights || []) {
      const ticker = insight.company_ticker || 'Unknown';
      if (!groupedByTicker.has(ticker)) {
        groupedByTicker.set(ticker, []);
      }
      groupedByTicker.get(ticker)!.push(insight);
    }

    for (const [ticker, insightsForCompany] of groupedByTicker.entries()) {
      if (ticker === 'Unknown' || insightsForCompany.length === 0) continue;

      try {
        const { data: posts, error: postsError } = await supabase
          .from("latest_posts")
          .select("*")
          .in("id", insightsForCompany.map(i => i.post_id));

        if (postsError || !posts) {
          console.warn(`Failed to fetch posts for ${ticker}`);
          continue;
        }

        const companyName = getCompanyName(ticker);
        const companyInsight = await generateCompanyInsightForPosts(companyName, posts);

        if (!companyInsight) {
          console.warn(`Failed to generate company insight for ${ticker}`);
          continue;
        }

        const latestPostDate = posts
          .map(p => new Date(p.published_date).getTime())
          .sort((a, b) => b - a)[0] || new Date().getTime();

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
          console.log(`✓ Company insight updated for ${ticker}`);
        }
      } catch (error) {
        console.error(`Error processing company insight for ${ticker}:`, error);
      }
    }
  } catch (error) {
    console.error("Error generating company insights:", error);
  }
}

/**
 * Register cron job - runs every hour
 * Schedule format: minute hour day month weekday
 * "0 * * * *" = every hour at minute 0
 */
Deno.cron("process_posts_hourly", "0 * * * *", async () => {
  await processNewPosts();
});

console.log("✅ Deno Deploy Cron scheduled: Process posts every hour");

// Keep the process alive
Deno.serve(() => new Response("Deno Deploy Cron Service", { status: 200 }));
