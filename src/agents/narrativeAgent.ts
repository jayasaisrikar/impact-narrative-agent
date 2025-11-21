import { LlmAgent } from '@iqai/adk';
import { companyInsightsTool } from '../tools/companyInsights.js';

export const narrativeAgent = new LlmAgent({
  name: 'narrativeAgent',
  description: 'An agent that generates impact narratives for companies.',
  model: process.env.LLM_MODEL || 'gemini-2.5-flash',
  instruction: `You are an expert in crafting impact narratives for companies. 
  Your goal is to analyze company information and generate a compelling narrative about their positive impact on the world.
  Use the 'companyInsights' tool to gather necessary information.`,
  tools: [companyInsightsTool],
});
