import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchCompanyInsight } from '../../../services/companyInsightService';

type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

const sendResponse = (res: VercelResponse, data: any, error?: string, status: number = 200) => {
  res.status(status).json({
    success: !error,
    data,
    error: error || null,
  } as ApiResponse);
};

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return sendResponse(res, null, 'Method not allowed', 405);
  }

  try {
    const { ticker } = req.query;

    if (!ticker || typeof ticker !== 'string' || ticker.length === 0) {
      return sendResponse(res, null, 'Ticker parameter is required', 400);
    }

    const insight = await fetchCompanyInsight(ticker);
    if (!insight) {
      return sendResponse(res, null, `No insights found for ticker: ${ticker}`, 404);
    }

    sendResponse(res, insight);
  } catch (error: any) {
    console.error('Company insights endpoint error:', error);
    sendResponse(res, null, error?.message || 'Failed to fetch company insights', 500);
  }
};
