import { InMemoryRunner } from '@iqai/adk';
import { narrativeAgent } from './agents/narrativeAgent.js';
import { InsightProcessor } from './services/insightProcessor.js';
import * as dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();
app.use(express.json());

const runner = new InMemoryRunner(narrativeAgent);
const insightProcessor = new InsightProcessor();

app.post('/api/chat', async (req, res) => {
  const { message, sessionId = 'default-session', userId = 'default-user' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Ensure session exists
    const appName = (runner as any).appName || 'InMemoryRunner';
    const sessionService = (runner as any).sessionService;
    let session = await sessionService.getSession(appName, userId, sessionId);
    if (!session) {
      await sessionService.createSession(appName, userId, {}, sessionId);
    }

    const events = runner.runAsync({
      userId,
      sessionId,
      newMessage: { role: 'user', parts: [{ text: message }] },
    });

    for await (const event of events) {
      const e = event as any;
      if (e.type === 'model_response') {
         const text = e.content?.parts?.[0]?.text || '';
         res.write(text);
      }
    }
    
    res.end();
  } catch (error) {
    console.error('Error running agent:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.end();
    }
  }
});

app.post('/api/process-posts', async (req, res) => {
  try {
    const { limit = 10 } = req.body;
    const results = await insightProcessor.processLatestPosts(limit);
    res.json(results);
  } catch (error: any) {
    console.error('❌ Fatal error processing posts:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/generate-company-insights', async (req, res) => {
  try {
    const { newInsightIds } = req.body;
    const results = await insightProcessor.generateCompanyInsights(newInsightIds);
    res.json(results);
  } catch (error: any) {
    console.error('❌ Fatal error generating company insights:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/insights/status', async (req, res) => {
  try {
    const { supabase } = await import('./lib/supabase.js');
    
    const { count: totalPosts } = await supabase
      .from('latest_posts')
      .select('*', { count: 'exact', head: true });
    
    const { count: processedInsights } = await supabase
      .from('insights')
      .select('*', { count: 'exact', head: true });
    
    const { data: companyInsights } = await supabase
      .from('company_insights')
      .select('company_ticker, related_post_count, created_at');

    res.json({
      totalPosts: totalPosts || 0,
      processedPosts: processedInsights || 0,
      companies: companyInsights?.length || 0,
      companyDetails: companyInsights || []
    });
  } catch (error: any) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Impact Narrative Agent running on port ${port}`);
});
