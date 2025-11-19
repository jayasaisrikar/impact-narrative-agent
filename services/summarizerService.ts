import { GoogleGenAI, Type } from '@google/genai';

let ai: GoogleGenAI;

function getAI() {
  if (!ai) {
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing Gemini API key: VITE_GEMINI_API_KEY');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

const summarySchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'A concise summary of exactly 50 words or fewer.',
    },
    word_count: {
      type: Type.INTEGER,
      description: 'The actual word count of the summary.',
    },
  },
  required: ['summary', 'word_count'],
};

/**
 * Retry configuration for handling model overload
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000, // Start with 1 second
  maxDelayMs: 10000, // Cap at 10 seconds
};

/**
 * Check if error is due to model overload (503 UNAVAILABLE)
 */
function isModelOverloaded(error: any): boolean {
  const errorStr = JSON.stringify(error);
  return (
    error?.code === 503 ||
    error?.status === 'UNAVAILABLE' ||
    errorStr.includes('503') ||
    errorStr.includes('UNAVAILABLE') ||
    errorStr.includes('overloaded')
  );
}

/**
 * Sleep for a given number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a 50-word summary from the given text using Gemini 2.5 Flash with retry logic
 */
export async function generateSummary(
  text: string,
  retryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ summary: string; word_count: number }> {
  if (!text || text.trim().length === 0) {
    throw new Error('Input text cannot be empty');
  }

  const prompt = `You are a professional financial analyst. Summarize the following text in exactly 50 words or less. Be precise and capture the key points.

Text to summarize:
"""
${text}
"""

Provide a concise, impactful summary suitable for investors.`;

  let lastError: any;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const response = await getAI().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: summarySchema,
          temperature: 0.3,
        },
      });

      const jsonText = response.text;
      if (!jsonText) {
        throw new Error('Empty response from Gemini API');
      }

      const result = JSON.parse(jsonText);
      
      // Validate word count
      const actualWordCount = result.summary.split(/\s+/).length;
      if (actualWordCount > 50) {
        console.warn(`Summary exceeded 50 words (${actualWordCount}), truncating...`);
        const words = result.summary.split(/\s+/).slice(0, 50);
        result.summary = words.join(' ') + '...';
        result.word_count = 50;
      }

      return result;
    } catch (error: any) {
      lastError = error;
      const isOverloaded = isModelOverloaded(error);
      
      if (isOverloaded && attempt < retryConfig.maxRetries) {
        // Calculate exponential backoff delay
        const delayMs = Math.min(
          retryConfig.initialDelayMs * Math.pow(2, attempt),
          retryConfig.maxDelayMs
        );
        
        console.warn(
          `Model overloaded (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}). ` +
          `Retrying in ${delayMs}ms...`
        );
        
        await delay(delayMs);
      } else {
        // Not an overload error or we've exhausted retries
        console.error('Summarizer error:', error);
        throw new Error(`Failed to generate summary: ${error?.message || String(error)}`);
      }
    }
  }

  // All retries exhausted
  console.error('All retry attempts exhausted. Last error:', lastError);
  throw new Error(
    `Failed to generate summary after ${retryConfig.maxRetries + 1} attempts: ${lastError?.message || String(lastError)}`
  );
}
