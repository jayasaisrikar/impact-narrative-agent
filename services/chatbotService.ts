import { GoogleGenAI } from '@google/genai';
import type { Insight } from '../types';

// --- Gemini API Client Initialization ---
// Note: In development, set VITE_GEMINI_API_KEY in the root `.env` file.
// Be aware: embedding API keys in frontend bundles is not secure. Use a backend proxy for production.
const GEMINI_API_KEY = (import.meta as any)?.env?.VITE_GEMINI_API_KEY ?? '';
export const CHAT_PROXY_URL = (import.meta as any)?.env?.VITE_CHAT_PROXY_URL ?? 'http://localhost:8787';

export const getChatProxyUrl = () => CHAT_PROXY_URL;

// Expose initialization state so components can report helpful diagnostics to the user
export let chatbotInitError: string | null = null;
let ai: any | undefined;
if (GEMINI_API_KEY && GEMINI_API_KEY.length > 0) {
    try {
        ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    } catch (e: any) {
        ai = undefined;
        const rawMessage = (e && e.message) ? e.message : String(e);
        // Friendly hint when a browser-incompatible library is used
        const likelyEnvHint = /window is not defined|globalThis is not defined|fs\.|process\.|document is not defined/i.test(rawMessage)
            ? 'The Gemini client library appears incompatible with browser/ESM runtime. Use the included Deno agent or a server-side proxy.'
            : '';
        chatbotInitError = `${likelyEnvHint} ${rawMessage}`.trim();
        console.error('Failed to initialize Gemini client:', e);
    }
} else {
        console.warn(`
        Gemini API client is not configured.
            Please update 'VITE_GEMINI_API_KEY' in your local environment.
            The chatbot will not function in this environment (dev or preview builds).
        `);
}

function buildPrompt(question: string, contextInsights: Insight[]): string {
    // A simple way to find a company name - can be improved with more robust NLP
    const keywords = question.split(' ').filter(word => word.length > 3 && word[0] === word[0].toUpperCase());
    const companyGuess = keywords.join(' ');

    let relevantInsights = contextInsights;
    // If we have a plausible company name, filter the context
    if (companyGuess) {
        relevantInsights = contextInsights.filter(insight =>
            insight.post.title.toLowerCase().includes(companyGuess.toLowerCase()) ||
            insight.post.summary.toLowerCase().includes(companyGuess.toLowerCase())
        );
    }
    
    // If filtering results in no insights, use all insights as a fallback
    if (relevantInsights.length === 0) {
        relevantInsights = contextInsights;
    }

    const contextString = relevantInsights
        .slice(0, 10) // Limit context to the 10 most recent relevant items
        .map(insight => `
            Date: ${new Date(insight.created_at).toLocaleDateString()}
            Title: ${insight.post.title}
            Analyst Summary: ${insight.summary}
            Investor Implications: ${insight.implications_investor}
        `).join('\n\n---\n\n');

    return `
      You are the "Impact Narrative Agent," a specialized financial analyst chatbot for the mining industry.
      Your role is to answer user questions based *only* on the provided context from recent news analysis.
      Do not use any external knowledge. If the answer isn't in the context, state that you don't have enough information based on the provided documents.
      Be concise, professional, and direct in your answers. Synthesize information from multiple sources if necessary.

      CONTEXT:
      ---
      ${contextString}
      ---

      USER'S QUESTION:
      "${question}"

      Based ONLY on the context above, provide your answer:
    `;
}

export const isChatbotAvailable = (): boolean => {
    // Return true if there's an env key and the client initialized
    return !!GEMINI_API_KEY && !!ai && chatbotInitError === null;
}

export const getChatbotInitError = (): string | null => {
    // Provide specific init error (e.g. library incompatibility in the browser)
    return chatbotInitError;
}

export const getChatbotResponse = async (question: string, contextInsights: Insight[]): Promise<string> => {
    if (!ai) {
        console.debug('Client Gemini library not available in browser — attempting to call chat proxy at', CHAT_PROXY_URL);
        // Attempt server-side proxy if the client gemini client is not available or not initialised
        try {
            const resp = await fetch(`${CHAT_PROXY_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, context: contextInsights }),
            });
            const json = await resp.json();
            if (resp.ok && json?.text) return json.text;
            throw new Error(json?.error ?? `Proxy returned status ${resp.status}`);
        } catch (err) {
            console.error('Proxy call failed:', err);
            throw new Error(`Gemini API key is not configured or reachable via client library. Proxy call failed: ${err}`);
        }
    }

    const prompt = buildPrompt(question, contextInsights);
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: prompt,
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the API.");
        }
        return text;
    } catch (error: any) {
        const message = (error && error.message) ? error.message : String(error);
        console.error("Error calling Gemini API:", error);
        // Provide a more user-friendly error message
        if (message.includes('API key not valid') || message.includes('invalid API key')) {
            throw new Error("Gemini API key is not valid. Please verify VITE_GEMINI_API_KEY.");
        }
        // Bubble up the original message when useful
        throw new Error(message || "Failed to get a response from the AI agent.");
    }
};
