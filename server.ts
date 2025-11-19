import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fetchCompanyInsights, buildCompanyResponse, validateCompanyTicker } from './services/apiService';
import { generateSummary } from './services/summarizerService';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Standard JSON response envelope
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

function sendResponse<T>(res: Response, data: T | null, error: string | null = null, statusCode = 200): void {
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

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// Health Check
app.get('/health', (req: Request, res: Response) => {
  sendResponse(res, { status: 'operational' });
});

/**
 * GET /api/v1/insights/:ticker
 * Fetch company insights with tags and narratives
 */
app.get('/api/v1/insights/:ticker', async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    
    if (!ticker || ticker.length === 0) {
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
});

/**
 * POST /api/v1/summarize
 * Generate a 50-word summary from provided text
 */
app.post('/api/v1/summarize', async (req: Request, res: Response) => {
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
});

// Serve static frontend files
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.get('*', (req: Request, res: Response) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        sendResponse(res, null, 'Frontend not found', 404);
      }
    });
    return;
  }
  
  // 404 for API routes
  sendResponse(res, null, `Route not found: ${req.method} ${req.path}`, 404);
});

// Error Handler
app.use((error: any, req: Request, res: Response): void => {
  console.error('Unhandled error:', error);
  sendResponse(res, null, 'Internal server error', 500);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/v1/insights/:ticker`);
  console.log(`   POST /api/v1/summarize`);
  console.log(`📦 Frontend served at http://localhost:${PORT}`);
});
