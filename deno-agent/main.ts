/**
 * Impact Narrative Agent - Deno Worker
 * 
 * This script runs on a schedule (e.g., hourly via Deno Deploy cron job).
 * 1. Connects to Supabase.
 * 2. Fetches new posts from `latest_posts` that don't have an associated insight yet.
 * 3. For each new post, it calls the Gemini API to generate a structured insight.
 * 4. It validates the Gemini response.
 * 5. It inserts the new, structured insight into the `insights` table.
 * 
 * To run locally:
 * 1. Create a `.env` file in the project root with your Supabase and Gemini keys.
 * 2. Run from the project root: `deno run --allow-env --allow-net --allow-read deno-agent/main.ts`
 * 
 * Note: Environment variables are loaded from the root .env file via Deno Deploy or system environment.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
// Load .env if present, but don't fail the process if example vars are missing.
// Previously a static import caused a hard crash when the example file
// declared variables that weren't provided in the environment. Use a
// dynamic import and ignore load-time errors so local missing env vars
// won't terminate the process on Deno Deploy.
try {
  // top-level await is supported in Deno modules
  await import("https://deno.land/std@0.224.0/dotenv/load.ts");
} catch (e) {
  // If dotenv fails because required example vars are missing, continue without loading .env
  console.warn("Optional .env load skipped or failed:", e?.message ?? e);
}
import { generateInsightForPost, generateChatResponse, validateApiKey } from "./services/geminiService.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type { Post } from "../types.ts";
import { extractCompanyTicker } from "./utils/companyUtils.ts";

// Fix: Add Deno global type declaration to resolve "Cannot find name 'Deno'" error.
declare const Deno: any;

// Accept either server-style names (SUPABASE_URL / SUPABASE_SERVICE_KEY)
// or Vite-style names (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) so
// local `.env` files created for the frontend still work for local dev.
const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
let supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY") || Deno.env.get("VITE_SUPABASE_ANON_KEY");
if (!Deno.env.get("SUPABASE_SERVICE_KEY") && Deno.env.get("VITE_SUPABASE_ANON_KEY")) {
  console.warn("Using VITE_SUPABASE_ANON_KEY as Supabase key fallback. For server-side tasks prefer SUPABASE_SERVICE_KEY.");
}
const GEMINI_API_KEY = Deno.env.get('VITE_GEMINI_API_KEY') || Deno.env.get('GEMINI_API_KEY') || '';
function maskKey(key: string): string {
  if (!key || key.length < 10) return `length ${key.length}`;
  return `${key.slice(0, 4)}...${key.slice(-4)} (len=${key.length})`;
}

let supabase: any | undefined;
let supabaseEnabled = false;
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase URL and/or Service Key were not provided in environment variables. Supabase tasks will be disabled. The HTTP chat endpoint will still run.");
} else {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  supabaseEnabled = true;
}
if (GEMINI_API_KEY) {
  console.log('GEMINI_API_KEY provided (masked):', maskKey(GEMINI_API_KEY));
} else {
  console.warn('GEMINI_API_KEY is not set in the environment. Chat requests will fail with API_KEY_INVALID until you set it.');
}

async function processNewPosts() {
  console.log("Starting agent run...");

  // 1. Fetch post_ids that already have insights
  if (!supabaseEnabled) {
    console.log('Supabase not configured - skipping `processNewPosts` work.');
    return;
  }
  const { data: insightPostIds, error: insightError } = await supabase
    .from("insights")
    .select("post_id");

  if (insightError) {
    console.error("Error fetching existing insight post_ids:", insightError);
    return;
  }
  
  const processedPostIds = (insightPostIds || []).map(i => i.post_id);
  console.log(`Processed post ids (from insights): ${JSON.stringify(processedPostIds)}`);

  // Debug: Fetch latest_posts ids and compute any unprocessed IDs for easier inspection.
  const { data: allLatestPosts, error: allPostsError } = await supabase
    .from('latest_posts')
    .select('id, title, published_date')
    .order('published_date', { ascending: false })
    .limit(50);
  if (allPostsError) {
    console.error('Error fetching latest_posts ids for debug:', allPostsError);
  } else {
    const latestPostIds = (allLatestPosts || []).map(p => p.id);
    const unprocessedIds = latestPostIds.filter(id => !processedPostIds.includes(id));
    console.log(`Latest post ids (recent): ${JSON.stringify(latestPostIds)}`);
    console.log(`Unprocessed latest_posts ids: ${JSON.stringify(unprocessedIds)}`);
  }

  // 2. Fetch latest_posts that have not been processed
  // Build the latest_posts query. If there are processed posts, exclude them using NOT IN.
  let postsQuery = supabase.from("latest_posts").select("*").limit(10);
  if (processedPostIds && processedPostIds.length > 0) {
    // Ensure numeric IDs remain unquoted, string IDs are quoted for SQL
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
    console.log("No new posts to process. Agent run finished.");
    return;
  }

  console.log(`Found ${newPosts.length} new posts to process.`);

  // 3. Process each new post
  for (const post of newPosts as Post[]) {
    try {
      console.log(`Processing post ID: ${post.id} - "${post.title}"`);
      const insightData = await generateInsightForPost(post);

      if (insightData) {
        // Extract company ticker from post title/summary
        const companyTicker = extractCompanyTicker(post.title, post.summary);
        
        // 4. Insert into insights table
        const { error: insertError } = await supabase.from("insights").insert({
          post_id: post.id,
          company_ticker: companyTicker,
          ...insightData,
        });

        if (insertError) {
          console.error(`Failed to insert insight for post ${post.id}:`, insertError);
        } else {
          console.log(`Successfully generated and saved insight for post ${post.id}${companyTicker ? ` (company: ${companyTicker})` : ''}.`);
        }
      }
    } catch (e) {
      console.error(`An error occurred while processing post ${post.id}:`, e.message);
    }
  }

  console.log("Agent run completed.");
}


// Self-invoking async function to run the process
(async () => {
    await processNewPosts();
})();

// For Deno Deploy, you can export a default handler for HTTP triggers or cron jobs.
// For both Deno Deploy and local development, provide a minimal HTTP handler
// POST /chat - accepts JSON { question: string, context: Post[] }
// GET /run - trigger the cron job manually
export default async function handler(req?: Request) {
  if (!req) {
    return new Response('No request provided', { status: 400 });
  }
  const url = new URL(req.url);
  if (url.pathname === '/chat' && req.method === 'POST') {
    try {
      // Read raw request body so we can log exactly what arrived and diagnose parse errors
      let rawBody = '';
      try {
        rawBody = await req.text();
      } catch (readErr: any) {
        console.error('Failed to read raw request body:', readErr);
      }
      // If the body is empty, return 400
      if (!rawBody || rawBody.trim().length === 0) {
        const headers = new Headers({ 'content-type': 'application/json' });
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(JSON.stringify({ error: 'Empty request body' }), { status: 400, headers });
      }
      // Attempt to parse JSON and return a helpful 400 error when invalid JSON is supplied
      let body: any;
      try {
        body = JSON.parse(rawBody);
      } catch (parseErr: any) {
        console.error('Invalid JSON body received:', rawBody);
        const headers = new Headers({ 'content-type': 'application/json' });
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(JSON.stringify({ error: `Invalid JSON body: ${parseErr?.message || String(parseErr)}`, raw: rawBody }), { status: 400, headers });
      }
      const { question, context } = body;
      if (!question) {
        const headers = new Headers({ 'content-type': 'application/json' });
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(JSON.stringify({ error: 'Missing required property `question` in request body.' }), { status: 400, headers });
      }
            try {
              const answer = await generateChatResponse(question, context || []);
              const headers = new Headers({ 'content-type': 'application/json' });
              headers.set('Access-Control-Allow-Origin', '*');
              headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
              headers.set('Access-Control-Allow-Headers', 'Content-Type');
              return new Response(JSON.stringify({ text: answer }), { status: 200, headers });
            } catch (e: any) {
              // If it is a key / auth issue we can provide a helpful 401
              const headers = new Headers({ 'content-type': 'application/json' });
              headers.set('Access-Control-Allow-Origin', '*');
              if ((e?.message ?? '').toLowerCase().includes('gemini api key')) {
                return new Response(JSON.stringify({ error: e.message }), { status: 401, headers });
              }
              return new Response(JSON.stringify({ error: e?.message ?? String(e) }), { status: 500, headers });
            }
      // Response returned above inside inner try block
    } catch (e: any) {
      console.error('Chat handler error:', e);
      return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
    }
  }
  if (url.pathname === '/run' && req.method === 'GET') {
    await processNewPosts();
    const headers = new Headers({ 'content-type': 'application/json' });
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return new Response(JSON.stringify({ status: 'ok', message: 'Agent run triggered' }), { status: 200, headers });
  }
  if (url.pathname === '/validate' && req.method === 'GET') {
    const { ok, message, code, reason } = await validateApiKey();
    const headers = new Headers({ 'content-type': 'application/json' });
    headers.set('Access-Control-Allow-Origin', '*');
    // Provide a more structured response including short code and reason when possible
    return new Response(JSON.stringify({ ok, message, code, reason }), { status: ok ? 200 : 401, headers });
  }
  // Health/default Handler
  if (url.pathname === '/' || url.pathname === '/health') {
    const headers = new Headers({ 'content-type': 'application/json' });
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return new Response(JSON.stringify({ status: 'ok', message: 'Deno Agent running. Use /chat POST to call the chat, and GET /run to trigger processing.' }), { status: 200, headers });
  }
  return new Response('Not found', { status: 404 });
}

// If run as a script locally, start a small server to handle chat proxy requests and a manual run trigger
if (import.meta.main) {
  const port = Number(Deno.env.get('DENO_AGENT_PORT') || '8787');
  console.log(`Starting Deno-agent HTTP server on :${port}`);
  serve(async (req: Request) => {
    // Return CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: new Headers({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }),
      });
    }
    try {
      return await handler(req);
    } catch (e) {
      console.error('Server handler error:', e);
      return new Response('Internal error', { status: 500 });
    }
  }, { port });
}