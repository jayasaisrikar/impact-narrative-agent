/**
 * Deno Deploy Cron - Process Posts Every Hour
 * 
 * This file runs on Deno Deploy with built-in Deno.cron() for scheduled tasks
 * No external dependencies needed - fully serverless and managed
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { generateInsightForPost, generateChatResponse, validateApiKey } from "./services/geminiService.ts";

declare const Deno: any;

// Load environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");
const GEMINI_API_KEY = Deno.env.get('VITE_GEMINI_API_KEY') || Deno.env.get('GEMINI_API_KEY') || '';

// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Main function to process new posts
 */
async function processNewPosts() {
  console.log(`[${new Date().toISOString()}] Starting scheduled post processing...`);

  try {
    // 1. Fetch post_ids that already have insights
    const { data: insightPostIds, error: insightError } = await supabase
      .from("insights")
      .select("post_id");

    if (insightError) {
      console.error("Error fetching existing insight post_ids:", insightError);
      return;
    }

    const processedPostIds = (insightPostIds || []).map(i => i.post_id);
    console.log(`Processed posts: ${processedPostIds.length}`);

    // 2. Fetch new posts that need insights
    let postsQuery = supabase.from("latest_posts").select("*").limit(10);
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

    // 3. For each new post, generate an insight
    for (const post of newPosts) {
      try {
        console.log(`  → Processing post #${post.id}: ${post.title.slice(0, 50)}...`);
        
        const insight = await generateInsightForPost(post);
        
        // 4. Insert the insight into the database
        const { error: insertError } = await supabase
          .from("insights")
          .insert([{
            post_id: post.id,
            insight: insight.insight,
            sentiment: insight.sentiment,
            tags: insight.tags,
            risk_level: insight.risk_level,
          }]);

        if (insertError) {
          console.error(`    ✗ Error inserting insight for post #${post.id}:`, insertError);
        } else {
          console.log(`    ✓ Insight generated for post #${post.id}`);
        }
      } catch (error) {
        console.error(`  ✗ Error processing post #${post.id}:`, error);
      }
    }

    console.log(`✅ Batch processing completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("Fatal error in processNewPosts:", error);
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
