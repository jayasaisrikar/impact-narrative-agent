import { VercelRequest, VercelResponse } from '@vercel/node';

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

export default function handler(req: VercelRequest, res: VercelResponse) {
  sendResponse(res, { status: 'operational' });
}
