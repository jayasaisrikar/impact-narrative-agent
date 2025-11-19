import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Cron endpoint for running the Deno Agent on a schedule
 * Configure in vercel.json with crons section
 * 
 * Example vercel.json addition:
 * "crons": [
 *   {
 *     "path": "/api/cron/process-posts",
 *     "schedule": "0 * * * *"
 *   }
 * ]
 */

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  meta: {
    timestamp: string;
    version: string;
  };
  error: string | null;
}

function sendResponse<T>(res: VercelResponse, data: T | null, error: string | null = null, statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: !error,
    data: error ? null : data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
    error,
  };

  res.status(statusCode).json(response);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret for security
  if (req.query.from !== 'vercel') {
    return sendResponse(res, null, 'Unauthorized', 401);
  }

  try {
    console.log('🕐 Cron job triggered - Processing new posts...');

    // Here you would call your Deno agent or process directly
    // For now, this is a placeholder that shows the cron is working
    
    // In production, you could:
    // 1. Call an external Deno Deploy endpoint
    // 2. Process posts directly using Supabase client
    // 3. Trigger a worker or background job

    sendResponse(res, { 
      message: 'Cron job executed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    sendResponse(res, null, error?.message || 'Cron job failed', 500);
  }
}
