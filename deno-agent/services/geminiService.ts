
// Fix: Use the recommended '@google/genai' package instead of the deprecated '@google/generative-ai'.
import { GoogleGenAI, Type } from "npm:@google/genai";
import type { Post, EventType } from "../../types.ts";

// Fix: Add Deno global type declaration to resolve "Cannot find name 'Deno'" error.
declare const Deno: any;

// Read from VITE_GEMINI_API_KEY or fall back to GEMINI_API_KEY
const GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY") || Deno.env.get("GEMINI_API_KEY");
if (!GEMINI_API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY or GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const insightSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A concise summary of the news event, focusing on the key facts." },
        implications_investor: { type: Type.STRING, description: "Analysis of what this event means for current and potential investors." },
        implications_company: { type: Type.STRING, description: "Analysis of what this event means for the company and its sector." },
        narratives: {
            type: Type.ARRAY,
            description: "An array of 3-4 short, catchy phrases that represent potential investment angles or storylines.",
            items: { type: Type.STRING }
        },
        event_type: { 
            type: Type.STRING, 
            description: "Categorize the event into one of the specified types.",
            enum: ["financing", "expansion", "regulation", "market", "technology", "exploration", "m&a"]
        }
    },
    required: ["summary", "implications_investor", "implications_company", "narratives", "event_type"]
};

const companyInsightSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A comprehensive summary synthesizing all recent news about this company." },
        implications_investor: { type: Type.STRING, description: "Analysis of what these developments mean for investors - consolidated perspective across all posts." },
        implications_company: { type: Type.STRING, description: "Strategic analysis of what these developments mean for the company and its sector." },
        narratives: {
            type: Type.ARRAY,
            description: "An array of 4-6 synthesized narratives that capture the key investment themes and storylines emerging from all posts.",
            items: { type: Type.STRING }
        },
        event_types: {
            type: Type.ARRAY,
            description: "List of unique event types found across all posts.",
            items: { type: Type.STRING }
        }
    },
    required: ["summary", "implications_investor", "implications_company", "narratives", "event_types"]
};

// Helper: sleep for given milliseconds
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Try to parse retry delay (seconds) from different shapes of error objects returned by the genai client / Gemini API
function extractRetryDelaySeconds(err: any): number | null {
  try {
    // 1) Many errors include an `error` object with `details` array
    const details = err?.error?.details ?? err?.details;
    if (Array.isArray(details)) {
      for (const d of details) {
        const t = d?.['@type'] ?? d?.type ?? '';
        if (typeof t === 'string' && t.includes('RetryInfo') && d?.retryDelay) {
          // retryDelay often looks like "47s" or "47.416859511s"
          const s = String(d.retryDelay);
          const match = s.match(/([0-9]+(?:\.[0-9]+)?)/);
          if (match) return Math.ceil(parseFloat(match[1]));
        }
      }
    }

    // 2) Sometimes the error message is JSON string containing `retryDelay`
    const msg = err?.message ?? err?.toString?.();
    if (typeof msg === 'string') {
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error?.details && Array.isArray(parsed.error.details)) {
          for (const d of parsed.error.details) {
            if (d?.['@type']?.includes('RetryInfo') && d?.retryDelay) {
              const s = String(d.retryDelay);
              const match = s.match(/([0-9]+(?:\.[0-9]+)?)/);
              if (match) return Math.ceil(parseFloat(match[1]));
            }
          }
        }
      } catch (_e) {
        // not JSON; fallback
      }

      // fallback: parse textual "Please retry in 47.416859511s." messages
      const textual = msg.match(/retry in\s*([0-9]+(?:\.[0-9]+)?)s/i);
      if (textual) return Math.ceil(parseFloat(textual[1]));
    }
  } catch (e) {
    // ignore parse errors
  }
  return null;
}

function buildCompanyInsightPrompt(companyName: string, posts: Post[]): string {
  const postsText = posts.map((p, i) => `
    Post ${i + 1}:
    - Title: "${p.title}"
    - Summary: "${p.summary}"
    - Published: ${p.published_date}
  `).join('\n');

  return `
    You are a world-class financial analyst specializing in the mining and metals industry, with a focus on providing institutional investor-grade insights.
    
    Analyze the following collection of recent news items about ${companyName} and provide a comprehensive, company-level insight that synthesizes all the information.
    
    Company: ${companyName}
    Recent News Items:
    ${postsText}
    
    Based on ALL the information above, generate a structured JSON output that:
    1. Synthesizes a coherent narrative from all posts
    2. Identifies overarching themes and patterns
    3. Provides strategic implications for the company and investors
    4. Deduplicates and synthesizes narratives - avoid repeating similar themes
    5. Lists all unique event types present across the posts
    
    Be objective, direct, and focus on material insights. This is for sophisticated investors who understand the mining sector.
  `;
}

export async function generateCompanyInsightForPosts(companyName: string, posts: Post[]): Promise<any> {
  if (!posts || posts.length === 0) {
    console.warn(`Cannot generate company insight for ${companyName}: no posts provided.`);
    return null;
  }

  const prompt = buildCompanyInsightPrompt(companyName, posts);
  const maxRetries = 5;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: companyInsightSchema,
          temperature: 0.5,
        },
      });

      const jsonText = response.text;
      if (!jsonText) {
        throw new Error("Gemini API returned an empty response.");
      }

      const parsedJson = JSON.parse(jsonText);
      return parsedJson;

    } catch (error: any) {
      // Determine whether to retry
      const status = error?.status ?? error?.error?.code ?? error?.error?.status;
      const isRateLimit = status === 429 || (error?.message && /quota|rate limit|RESOURCE_EXHAUSTED/i.test(error.message));

      console.error(`Error generating company insight for ${companyName} (attempt ${attempt}):`, error?.message ?? error);

      if (error?.message && error.message.includes('SAFETY')) {
        console.warn('Content was blocked due to safety settings. Not retrying.');
        return null;
      }

      if (isRateLimit && attempt < maxRetries) {
        const retrySeconds = extractRetryDelaySeconds(error) ?? Math.min(60, Math.pow(2, attempt + 1));
        const waitMs = Math.ceil(retrySeconds * 1000);
        console.warn(`Rate limit / quota exceeded. Retrying in ${retrySeconds}s (attempt ${attempt + 1}/${maxRetries})...`);
        await sleep(waitMs);
        continue;
      }

      console.error(`Failed to generate company insight for ${companyName}. ${attempt >= maxRetries ? 'Max retries reached.' : 'Not retrying.'}`);
      return null;
    }
  }
  return null;
}

function buildPrompt(post: Post): string {
  return `
    You are a world-class financial analyst specializing in the mining and metals industry. Your audience is sophisticated investors.
    Analyze the following news item and provide a structured, insightful analysis. Be objective and avoid hype.

    News Item:
    - Title: "${post.title}"
    - Summary: "${post.summary}"
    - URL: ${post.url}
    
    Based on this information, generate a structured JSON output with your analysis.
    The "narratives" should be succinct, actionable themes an investor could use.
    The "implications" should be clear and direct.
  `;
}

export async function generateInsightForPost(post: Post) {
  const prompt = buildPrompt(post);

  const maxRetries = 5;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: insightSchema,
          temperature: 0.5,
        },
      });

      const jsonText = response.text;
      if (!jsonText) {
        throw new Error("Gemini API returned an empty response.");
      }

      const parsedJson = JSON.parse(jsonText);
      return parsedJson;

    } catch (error: any) {
      // Determine whether to retry
      const status = error?.status ?? error?.error?.code ?? error?.error?.status;
      const isRateLimit = status === 429 || (error?.message && /quota|rate limit|RESOURCE_EXHAUSTED/i.test(error.message));

      console.error(`Error generating insight with Gemini for post ID ${post.id} (attempt ${attempt}):`, error?.message ?? error);

      if (error?.message && error.message.includes('SAFETY')) {
        console.warn('Content was blocked due to safety settings. Not retrying.');
        return null;
      }

      if (isRateLimit && attempt < maxRetries) {
        // Prefer server-provided retry delay when available
        const retrySeconds = extractRetryDelaySeconds(error) ?? Math.min(60, Math.pow(2, attempt + 1));
        const waitMs = Math.ceil(retrySeconds * 1000);
        console.warn(`Rate limit / quota exceeded. Retrying in ${retrySeconds}s (attempt ${attempt + 1}/${maxRetries})...`);
        await sleep(waitMs);
        continue;
      }

      // Non-retriable or max attempts reached
      console.error(`Failed to generate insight for post ID ${post.id}. ${attempt >= maxRetries ? 'Max retries reached.' : 'Not retrying.'}`);
      return null;
    }
  }
  return null;
}

// Build a chat prompt similar to the frontend's `buildPrompt` for context-aware answer generation
export function buildChatPrompt(question: string, contextInsights: Post[]) {
  const keywords = question.split(' ').filter(word => word.length > 3 && word[0] === word[0].toUpperCase());
  const companyGuess = keywords.join(' ');
  let relevant = contextInsights;
  if (companyGuess) {
      relevant = contextInsights.filter(i =>
          (i.title || '').toLowerCase().includes(companyGuess.toLowerCase()) ||
          (i.summary || '').toLowerCase().includes(companyGuess.toLowerCase())
      );
  }
  if (!relevant || relevant.length === 0) relevant = contextInsights;
  const contextString = relevant.slice(0, 10).map(item => `Date: ${item.published_date}\nTitle: ${item.title}\nSummary: ${item.summary}`).join('\n\n---\n\n');
  return `You are the Impact Narrative Agent. Answer concisely and based ONLY on the context below.\nCONTEXT:\n${contextString}\n---\nQUESTION:\n${question}`;
}

export async function generateChatResponse(question: string, contextInsights: Post[]) {
  try {
    const prompt = buildChatPrompt(question, contextInsights || []);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.0 },
    });
    const text = response?.text;
    return text ?? null;
  } catch (e: any) {
    console.error('Error generating chat response:', e);
    const message = e?.message ?? String(e);
    if (message.includes('API Key not found') || message.includes('API_KEY_INVALID') || message.includes('invalid API key')) {
      throw new Error('Gemini API key is invalid or missing in the Deno agent. Please set GEMINI_API_KEY in deno-agent/.env and verify the key.');
    }
    throw e;
  }
}

// Validate (test) the API key by performing a small request
export async function validateApiKey(): Promise<{ ok: boolean; message?: string; code?: number; reason?: string }> {
  try {
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'Say hello.' });
    if (res && res?.text) return { ok: true };
    return { ok: false, message: 'No response from model' };
  } catch (err: any) {
    // Try to extract useful information from the error object returned by the client
    console.error('API key validation failed:', err?.message ?? err);
    let message = err?.message ?? String(err);
    let code: number | undefined = undefined;
    let reason: string | undefined = undefined;
    try {
      // Sometimes the message is a JSON string; attempt to parse and extract readable info
      const parsed = JSON.parse(message);
      if (parsed?.error?.message) message = parsed.error.message;
      else if (parsed?.message) message = parsed.message;
      if (parsed?.error?.code) code = parsed.error.code;
      if (parsed?.error?.details && Array.isArray(parsed.error.details) && parsed.error.details[0]?.reason) {
        reason = parsed.error.details[0].reason;
      }
    } catch (e) {
      // not JSON; fallback to raw message
    }
    return { ok: false, message, code, reason };
  }
}