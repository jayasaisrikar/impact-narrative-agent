import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateSummary } from '../../services/summarizerService';

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
  res.setHeader('Content-Type', 'application/json');

  try {
    const { company_summary } = req.body;

    if (!company_summary || typeof company_summary !== 'string') {
      return sendResponse(res, null, 'company_summary field (string) is required in request body', 400);
    }

    if (company_summary.trim().length === 0) {
      return sendResponse(res, null, 'company_summary cannot be empty', 400);
    }

    const result = await generateSummary(company_summary);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('Summarize endpoint error:', error);
    sendResponse(res, null, error?.message || 'Failed to generate summary', 500);
  }
}
