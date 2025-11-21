import { LlmAgent, createTool } from '@iqai/adk';
import { z } from 'zod';
import { insightService } from '../services/insightService.js';

export const submitCompanyInsightTool = createTool({
  name: 'submitCompanyInsight',
  description: 'Submits the aggregated narrative for a company.',
  schema: z.object({
    company_ticker: z.string(),
    summary: z.string(),
    implications_investor: z.string(),
    implications_company: z.string(),
    narratives: z.array(z.string()),
    event_types: z.array(z.string()),
  }),
  fn: async (args) => {
    const insights = await insightService.getInsightsByTicker(args.company_ticker);
    const related_post_count = insights.length;
    const latest_post_date = await insightService.getLatestPostDateForTicker(args.company_ticker);

    await insightService.saveCompanyInsight({
      ...args,
      related_post_count,
      latest_post_date
    });
    return { success: true, message: 'Company insight saved.' };
  },
});

export const companyNarrativeAgent = new LlmAgent({
  name: 'companyNarrativeAgent',
  description: 'Aggregates insights into a company narrative.',
  model: process.env.LLM_MODEL || 'gemini-2.5-flash',
  instruction: `You are a senior investment strategist specializing in Bitcoin mining and blockchain infrastructure.

You will receive multiple insights for a specific company. Synthesize them into a comprehensive narrative.

Provide:

1. **summary** - 3-5 sentences capturing the company's current position, strategic trajectory, and what makes its story unique in the market

2. **implications_investor** - Detailed investment analysis covering opportunities, risks, valuation considerations, and the investment thesis

3. **implications_company** - Operational and strategic analysis including competitive position, execution risks, and future strategic direction

4. **narratives** - Array of 3-5 SHORT, PUNCHY, HEADLINE-STYLE narrative themes (NOT tags). Format like:
   ✅ GOOD: ["Pure-Play AI Infrastructure Bet", "Unlocking Value, De-Risking the Model", "The Bitcoin Accumulator Strategy"]
   ❌ BAD: ["ai_infrastructure", "bitcoin_mining", "financial_expansion"]
   
   Make them:
   - Compelling and memorable (like investment thesis headlines)
   - Specific to THIS company's unique story (not generic)
   - Title case with proper capitalization
   - 3-7 words each
   - Capture what makes THIS company DIFFERENT from competitors

5. **event_types** - Array of all unique event types from the underlying insights

CRITICAL RULES:
- SYNTHESIZE across all insights - identify PATTERNS and THEMES
- Highlight what makes THIS company's strategy UNIQUE
- Think like an equity research analyst covering the stock
- ALWAYS call submitCompanyInsight tool - NEVER give a text response
- Narratives must be investment-grade headlines, NOT generic tags`,
  tools: [submitCompanyInsightTool],
});
