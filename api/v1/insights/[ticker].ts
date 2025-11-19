import { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchCompanyInsights, buildCompanyResponse, validateCompanyTicker } from '../../../services/apiService';

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
  if (req.method !== 'GET') {
    return sendResponse(res, null, 'Method not allowed', 405);
  }

  try {
    const { ticker } = req.query;

    if (!ticker || typeof ticker !== 'string' || ticker.length === 0) {
      return sendResponse(res, null, 'Ticker parameter is required', 400);
    }

    const upperTicker = ticker.toUpperCase();
    const isValid = await validateCompanyTicker(upperTicker);

    if (!isValid) {
      return sendResponse(res, null, `No insights found for ticker: ${upperTicker}`, 404);
    }

    const insights = await fetchCompanyInsights(upperTicker);
    const response = buildCompanyResponse(upperTicker, insights);

    sendResponse(res, response);
  } catch (error: any) {
    console.error('Insights endpoint error:', error);
    sendResponse(res, null, error?.message || 'Failed to fetch insights', 500);
  }
}
