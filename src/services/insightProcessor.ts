import { InMemoryRunner } from '@iqai/adk';
import { postAnalysisAgent } from '../agents/postAnalysisAgent.js';
import { companyNarrativeAgent } from '../agents/companyNarrativeAgent.js';
import { supabase } from '../lib/supabase.js';
import { getUnprocessedPostIds } from '../utils/postFilter.js';
import { extractUniqueTickers } from '../utils/tickerExtractor.js';

interface ProcessResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ postId?: number; ticker?: string; error: string }>;
  processedPostIds?: number[];
}

export class InsightProcessor {
  private postAnalysisRunner: InMemoryRunner;
  private companyNarrativeRunner: InMemoryRunner;

  private readonly pollIntervalMs: number;
  private readonly autoFlowEnabled: boolean;
  private flowTimer?: NodeJS.Timeout;
  private flowRunning = false;

  constructor() {
    this.postAnalysisRunner = new InMemoryRunner(postAnalysisAgent);
    this.companyNarrativeRunner = new InMemoryRunner(companyNarrativeAgent);
    this.pollIntervalMs = this.resolvePollIntervalMs();
    this.autoFlowEnabled = process.env.DISABLE_INSIGHT_FLOW !== 'true';

    if (this.autoFlowEnabled) {
      this.startScheduledFlow();
    } else {
      console.log('Automatic insight flow disabled via DISABLE_INSIGHT_FLOW=true');
    }
  }

  async runFullFlow(limit?: number): Promise<ProcessResult> {
    const limitMessage = limit ? ` (limit ${limit})` : '';
    console.log(`\n🚀 Starting full insight synchronization${limitMessage}`);
    const result = await this.processLatestPosts(limit);
    const processedPostIds = result.processedPostIds ?? [];

    if (!processedPostIds.length) {
      console.log('🤖 No new minermag posts processed, skipping company insight generation');
      return result;
    }

    const newInsightIds = await this.fetchInsightIdsForPostIds(processedPostIds);
    if (!newInsightIds.length) {
      console.log('🤖 No insights recorded for the processed posts yet, skipping company insight generation');
      return result;
    }

    await this.generateCompanyInsights(newInsightIds);
    return result;
  }

  private async runScheduledCycle(): Promise<void> {
    if (this.flowRunning) {
      console.log('Scheduled insight flow already running; waiting for next interval');
      return;
    }

    this.flowRunning = true;
    try {
      console.log('\n🔁 Triggering automated insight flow');
      await this.runFullFlow();
    } catch (error: any) {
      console.error('⚠️ Automated insight flow failed:', error?.message ?? error);
    } finally {
      this.flowRunning = false;
    }
  }

  private startScheduledFlow(): void {
    void this.runScheduledCycle();
    this.flowTimer = setInterval(() => {
      void this.runScheduledCycle();
    }, this.pollIntervalMs);
  }

  private resolvePollIntervalMs(): number {
    const envInterval = Number(process.env.INSIGHT_FLOW_INTERVAL_MS);
    return Number.isFinite(envInterval) && envInterval > 0 ? envInterval : 2 * 60 * 60 * 1000;
  }

  private async fetchInsightIdsForPostIds(postIds: number[]): Promise<number[]> {
    if (!postIds.length) return [];

    const { data, error } = await supabase
      .from('insights')
      .select('id')
      .in('post_id', postIds);

    if (error) throw error;

    const ids = data
      ?.map((insight: any) => insight?.id)
      .filter((id: number | undefined): id is number => typeof id === 'number');

    return [...new Set(ids || [])];
  }

  async processLatestPosts(limit?: number): Promise<ProcessResult> {
    let query = supabase
      .from('latest_posts')
      .select('id, title, summary, url, published_date, source')
      .ilike('source', 'minermag')
      .order('created_at', { ascending: false });

    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data: latestPosts, error } = await query;

    if (error) throw error;

    const minermagPosts = (latestPosts ?? []).filter(post => (post.source ?? '').toLowerCase() === 'minermag');
    const ignoredCount = (latestPosts?.length ?? 0) - minermagPosts.length;
    if (ignoredCount > 0) {
      console.log(`  ℹ️ Ignored ${ignoredCount} non-minermag posts (only minermag is processed)`);
    }

    const allPostIds = minermagPosts.map(p => p.id);
    const unprocessedIds = await getUnprocessedPostIds(allPostIds);
    const postsToProcess = minermagPosts.filter(p => unprocessedIds.includes(p.id));

    console.log(`\n${'='.repeat(60)}`);
    const limitDescription = limit ? `limited to ${limit}` : 'full table';
    console.log(`📊 Found ${postsToProcess.length} unprocessed minermag posts out of ${allPostIds.length} fetched (${limitDescription})`);
    console.log('='.repeat(60));

    const processedPostIds = postsToProcess.map(p => p.id);
    const results: ProcessResult = {
      total: postsToProcess.length,
      successful: 0,
      failed: 0,
      errors: [],
      processedPostIds
    };

    for (let i = 0; i < postsToProcess.length; i++) {
      const post = postsToProcess[i];
      console.log(`\n[${i + 1}/${postsToProcess.length}] Processing post ${post.id}...`);

      try {
        await this.analyzePost(post);
        console.log(`  ✔️ Post ${post.id} processed successfully`);
        results.successful++;

        if (i < postsToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`  ❌ Error processing post ${post.id}:`, error.message);
        results.failed++;
        results.errors.push({ postId: post.id, error: error.message });
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📈 Processing Complete`);
    console.log(`  ✅ Successful: ${results.successful}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log('='.repeat(60));

    return results;
  }

  async generateCompanyInsights(newInsightIds?: number[]): Promise<ProcessResult> {
    let tickersToProcess: string[] = [];

    if (newInsightIds && newInsightIds.length > 0) {
      const { data, error } = await supabase
        .from('insights')
        .select('company_ticker')
        .in('id', newInsightIds);

      if (error) throw error;

      tickersToProcess = extractUniqueTickers(data || []);
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🏢 Processing ${tickersToProcess.length} tickers from ${newInsightIds.length} new insights`);
      console.log('='.repeat(60));
    } else {
      const { data, error } = await supabase
        .from('insights')
        .select('company_ticker');

      if (error) throw error;

      tickersToProcess = extractUniqueTickers(data || []);
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🏢 Processing all ${tickersToProcess.length} unique tickers`);
      console.log('='.repeat(60));
    }

    const results: ProcessResult = {
      total: tickersToProcess.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < tickersToProcess.length; i++) {
      const ticker = tickersToProcess[i];
      console.log(`\n[${i + 1}/${tickersToProcess.length}] Processing ticker ${ticker}...`);

      try {
        await this.generateCompanyNarrative(ticker);
        console.log(`  ✔️ Ticker ${ticker} processed successfully`);
        results.successful++;

        if (i < tickersToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`  ❌ Error processing ticker ${ticker}:`, error.message);
        results.failed++;
        results.errors.push({ ticker, error: error.message });
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📈 Company Insights Complete`);
    console.log(`  ✅ Successful: ${results.successful}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log('='.repeat(60));

    return results;
  }

  private async analyzePost(post: any): Promise<void> {
    const runner = new InMemoryRunner(postAnalysisAgent);
    const sessionService = (runner as any).sessionService;
    const appName = (runner as any).appName || 'InMemoryRunner';
    const sessionId = `post-${post.id}-${Date.now()}`;

    await sessionService.createSession(appName, 'system', {}, sessionId);

    const postText = [
      `Post ID: ${post.id}`,
      `Title: ${post.title ?? 'N/A'}`,
      `Summary: ${post.summary ?? 'No summary available.'}`,
      `URL: ${post.url ?? 'N/A'}`,
      `Published: ${post.published_date ?? 'Unknown'}`,
      `Source: ${post.source ?? 'Unknown'}`
    ].join('\n');

    const events = runner.runAsync({
      userId: 'system',
      sessionId,
      newMessage: {
        role: 'user',
        parts: [{
          text: `Analyze this post and extract insights. Call submitInsight tool.

${postText}`,
        }],
      },
    });

    for await (const event of events) {
      const e = event as any;
      if (e.type === 'function_call') {
        console.log(`  🔧 Tool called: ${e.content?.parts?.[0]?.functionCall?.name}`);
      }
    }
  }

  private async generateCompanyNarrative(ticker: string): Promise<void> {
    const runner = new InMemoryRunner(companyNarrativeAgent);
    const sessionService = (runner as any).sessionService;
    const appName = (runner as any).appName || 'InMemoryRunner';
    const sessionId = `ticker-${ticker}-${Date.now()}`;

    const { data: insights, error } = await supabase
      .from('insights')
      .select('*')
      .eq('company_ticker', ticker);

    if (error) throw error;

    console.log(`  📋 Found ${insights?.length || 0} insights for ${ticker}`);

    await sessionService.createSession(appName, 'system', {}, sessionId);

    const events = runner.runAsync({
      userId: 'system',
      sessionId,
      newMessage: {
        role: 'user',
        parts: [{
          text: `Generate narrative for company ${ticker} based on these insights:\n\n${JSON.stringify(insights, null, 2)}`
        }]
      },
    });

    for await (const event of events) {
      const e = event as any;
      if (e.type === 'function_call') {
        console.log(`  🔧 Tool called: ${e.content?.parts?.[0]?.functionCall?.name}`);
      }
    }
  }
}
