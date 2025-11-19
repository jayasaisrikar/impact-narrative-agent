# API Backend Documentation

## Overview
The Impact Narrative Agent backend provides RESTful endpoints for fetching mining company insights and generating AI-powered text summaries. Built with Express.js and Gemini 2.5 Flash, it follows industry-standard practices with standardized JSON responses, CORS support, and comprehensive error handling.

**Base URL**: `http://localhost:3000` (local) or your Coolify deployment URL

---

## Response Format

All endpoints return a standardized JSON envelope:

```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "meta": {
    "timestamp": "2025-11-19T10:30:00.000Z",
    "version": "v1"
  },
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "meta": {
    "timestamp": "2025-11-19T10:30:00.000Z",
    "version": "v1"
  },
  "error": "Descriptive error message"
}
```

---

## Endpoints

### 1. Health Check

**Endpoint**: `GET /health`

**Description**: Verify the API server is running and healthy.

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "operational"
  },
  "meta": { ... },
  "error": null
}
```

**Example**:
```bash
curl http://localhost:3000/health
```

---

### 2. Company Insights with Tags & Narratives

**Endpoint**: `GET /api/v1/insights/:ticker`

**Description**: Fetch all insights for a company including tags (investment narratives), synthesized narratives, and a summary.

**Parameters**:
- `ticker` (string, required): Company stock ticker (e.g., MARA, CLSK, WULF)

**Response**:
```json
{
  "success": true,
  "data": {
    "company_ticker": "MARA",
    "company_name": "Marathon Digital",
    "tags": [
      "AI Data Center Expansion",
      "Capital Raising",
      "Regulatory Headwinds",
      "Production Growth",
      "Power Purchase Agreements"
    ],
    "narratives": [
      "Strategic Texas expansion into AI infrastructure",
      "Multi-billion dollar financing secured",
      "Regulatory scrutiny on water usage",
      "Hash rate improvements drive profitability",
      "Long-term power contracts ensure sustainability",
      "Industry consolidation opportunities"
    ],
    "event_types": ["financing", "expansion", "regulation"],
    "related_post_count": 5,
    "latest_update": "2025-11-13T09:45:00.000Z",
    "summary": "MARA has 5 recent developments spanning financing, expansion, regulation. Key themes include Strategic Texas expansion into AI infrastructure and Multi-billion dollar financing secured."
  },
  "meta": { ... },
  "error": null
}
```

**Status Codes**:
- `200 OK` - Success
- `400 Bad Request` - Missing or invalid ticker
- `404 Not Found` - No insights found for ticker
- `500 Internal Server Error` - Server error

**Example**:
```bash
# Get insights for Marathon Digital
curl "http://localhost:3000/api/v1/insights/MARA"

# Get insights for CleanSpark
curl "http://localhost:3000/api/v1/insights/CLSK"
```

**Notes**:
- **Tags**: Extracted from "Potential Investment Narratives" field (unique investment themes)
- **Narratives**: Synthesized and deduplicated narratives from all related posts
- **Event Types**: Array of all event categories (financing, expansion, regulation, market, technology, etc.)
- **Related Post Count**: Number of posts aggregated for this company
- **Latest Update**: Most recent insight timestamp

---

### 3. Generate 50-Word Summary

**Endpoint**: `POST /api/v1/summarize`

**Description**: Generate a concise 50-word (or less) summary from arbitrary text using Gemini 2.5 Flash.

**Request Body**:
```json
{
  "company_summary": "Marathon Digital Holdings is one of the largest bitcoin miners in North America. They recently announced a significant expansion in Texas and are facing some regulatory challenges regarding water usage. However, their hash rate has increased by 20% over the last quarter."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": "Marathon Digital expands Texas mining operations with improved hash rates, but faces water usage regulatory challenges. The company strengthens its position as a leading North American bitcoin miner.",
    "word_count": 27
  },
  "meta": { ... },
  "error": null
}
```

**Status Codes**:
- `200 OK` - Success
- `400 Bad Request` - Missing or empty company_summary
- `500 Internal Server Error` - API error

**Example**:
```bash
# Using curl
curl -X POST http://localhost:3000/api/v1/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "company_summary": "Your text here..."
  }'

# Using PowerShell
$body = @{
  company_summary = "Your text here..."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/summarize" \
  -Method Post \
  -Body $body \
  -ContentType "application/json"
```

**Notes**:
- Summary is guaranteed to be ≤ 50 words
- Model: Gemini 2.5 Flash (optimized for speed and cost)
- Temperature: 0.3 (more consistent, less creative)
- Ideal for generating investor-ready summaries

---

## CORS Configuration

All endpoints support CORS with:
- **Allowed Origins**: `*` (any origin)
- **Allowed Methods**: GET, POST, OPTIONS
- **Allowed Headers**: Content-Type

This enables frontend applications to call the API from any domain.

---

## Error Handling

The API provides descriptive error messages:

| Scenario | Status | Message |
|----------|--------|---------|
| Invalid ticker | 400 | `Ticker parameter is required` |
| No insights found | 404 | `No insights found for ticker: XYZ` |
| Empty text | 400 | `company_summary cannot be empty` |
| Missing field | 400 | `company_summary field (string) is required in request body` |
| Server error | 500 | `Failed to fetch insights` or `Failed to generate summary` |

---

## Environment Variables

Required for deployment:

```bash
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# Server Configuration
PORT=3000
```

---

## Running the Server

### Local Development
```bash
npm run server
```
Server runs on `http://localhost:3000`

### Production (Coolify)
```bash
npm install
npm run server
```

The server will bind to the PORT environment variable (default: 3000).

---

## Usage Examples

### Frontend Integration (TypeScript/React)

```typescript
// Fetch company insights
async function getCompanyInsights(ticker: string) {
  const response = await fetch(`/api/v1/insights/${ticker}`);
  const result = await response.json();
  
  if (result.success) {
    return result.data; // { tags, narratives, summary, ... }
  }
  throw new Error(result.error);
}

// Generate summary
async function summarizeText(text: string) {
  const response = await fetch('/api/v1/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_summary: text }),
  });
  
  const result = await response.json();
  if (result.success) {
    return result.data; // { summary, word_count }
  }
  throw new Error(result.error);
}
```

### Python Integration

```python
import requests

BASE_URL = "http://localhost:3000"

# Fetch company insights
response = requests.get(f"{BASE_URL}/api/v1/insights/MARA")
data = response.json()

if data['success']:
    insights = data['data']
    print(f"Tags: {insights['tags']}")
    print(f"Narratives: {insights['narratives']}")

# Generate summary
response = requests.post(
    f"{BASE_URL}/api/v1/summarize",
    json={"company_summary": "Your text here..."}
)

data = response.json()
if data['success']:
    print(f"Summary: {data['data']['summary']}")
```

---

## Performance Considerations

- **Insights Endpoint**: ~100-300ms (depends on Supabase latency)
- **Summarize Endpoint**: ~2-5s (Gemini API call)
- Requests are not cached; implement client-side caching for production
- Rate limiting recommended for public deployments

---

## Support

For issues or questions:
1. Check `.env` configuration
2. Verify Supabase connectivity
3. Confirm Gemini API key validity
4. Review server logs: `npm run server`

