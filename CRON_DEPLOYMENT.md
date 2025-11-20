# Deno Agent Cron Job Deployment Guide

## Overview
Run the Deno agent as a **scheduled cron job every hour** on **Deno Deploy** (or Vercel/Coolify as fallback).

## Architecture

```
┌─────────────────────────────────────────┐
│   Deno Deploy (Recommended)             │
│   - Native Deno.cron() support         │
│   - Runs every hour automatically      │
│   - No additional infrastructure       │
│   - Always-on V8 isolates              │
└──────────────┬──────────────────────────┘
               │
               ├─→ Connects to Supabase
               ├─→ Fetches new posts
               ├─→ Generates insights via Gemini
               └─→ Stores results in database
```

## Option 1: Deno Deploy (BEST) ⭐

### Step 1: Deploy to Deno Deploy

```bash
# Install deployctl
deno install -A jsr:@deno/deployctl --global

# Deploy the cron file
deployctl deploy deno-agent/cron.ts
```

Or use the Deno Deploy dashboard:
1. Go to [dash.deno.com](https://dash.deno.com/)
2. Click **New Project**
3. Connect your GitHub repository
4. Select `deno-agent/cron.ts` as the entry point
5. Set environment variables (see below)
6. Deploy

### Step 2: Set Environment Variables on Deno Deploy

Dashboard → Project Settings → Environment Variables:

```
SUPABASE_URL=https://bbcacowiusbaxhgimrte.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=AIzaSyBD66DGBnklk2y-K7wJUzcdYgR7vSgYULU
```

### Step 3: Monitor Cron Execution

Deno Deploy dashboard → Logs → Filter by cron logs

```
✅ Deno Deploy Cron scheduled: Process posts every hour
  → Processing post #51...
  ✓ Insight generated for post #51
```

## Option 2: Vercel Cron (Serverless Function)

If you prefer Vercel, use the existing cron endpoint:

**File:** `api/cron/process-posts.ts`

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/process-posts",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Limitations:**
- ⚠️ Requires external Node.js functions (not pure Deno)
- ⚠️ More complex to debug
- ✓ Integrated with Vercel dashboard

## Option 3: Coolify (Self-Hosted)

Deploy on Coolify with Docker:

**Dockerfile:**
```dockerfile
FROM denoland/deno:latest

WORKDIR /app

COPY . .

RUN deno cache deno-agent/cron.ts

CMD ["deno", "run", "--allow-env", "--allow-net", "deno-agent/cron.ts"]
```

**docker-compose.yml:**
```yaml
version: '3'
services:
  deno-agent:
    build: .
    environment:
      SUPABASE_URL: https://bbcacowiusbaxhgimrte.supabase.co
      SUPABASE_SERVICE_KEY: your_key_here
      VITE_GEMINI_API_KEY: your_key_here
    restart: always
```

Then set up a system cron to trigger it hourly:

```bash
# Run every hour
0 * * * * curl http://localhost:8000/cron
```

## Cron Schedule Format

```
┌─────────────────────────────────────┐
│ Min Hour Day Month Weekday          │
├─────────────────────────────────────┤
│  0   *    *    *      *   → Every hour
│  0   0    *    *      *   → Daily at midnight
│  0   12   *    *      *   → Daily at noon
│  0   0    *    *      0   → Every Sunday
│  */30 *   *    *      *   → Every 30 minutes
│  0   1    1    *      *   → First of month
└─────────────────────────────────────┘
```

## Environment Variables

| Variable | Required | Example |
|----------|----------|---------|
| `SUPABASE_URL` | ✅ | `https://bbcacowiusbaxhgimrte.supabase.co` |
| `SUPABASE_SERVICE_KEY` | ✅ | `eyJhbGciOiJIUzI1NiIsInR5cCI...` |
| `VITE_GEMINI_API_KEY` | ✅ | `AIzaSyBD66DGBnklk2y-K7w...` |

## Monitoring & Debugging

### Deno Deploy Logs
```bash
# View all logs
deno logs

# View specific service
deno logs --service=cron_worker
```

### Check Cron Execution
```bash
# Query logs table
SELECT * FROM logs WHERE service='cron_worker' ORDER BY timestamp DESC LIMIT 10;
```

### Manual Testing

**Test locally:**
```bash
npm run run-agent
```

**Test cron schedule:**
```bash
deno eval "const cron = '0 * * * *'; console.log('Next run:', new Date(Date.now() + 60*1000));"
```

## Cost Comparison

| Platform | Cost | Cold Starts | Always-On |
|----------|------|-------------|-----------|
| Deno Deploy | $1/month (free tier available) | ~50ms | ✅ |
| Vercel Cron | Free (compute units) | ~100ms | ❌ |
| Coolify | $0 (self-hosted) | Depends | ✅ |

**Recommendation:** Use **Deno Deploy** for best performance and reliability.

## Troubleshooting

### Cron not running
- Check environment variables are set
- Verify Deno Deploy project is deployed
- Check logs for errors

### Posts not processing
- Verify Supabase credentials
- Check network connectivity
- Review Gemini API quota

### High latency
- Consider processing fewer posts per run
- Increase timeout in `deno.json`
- Check database indexes on `latest_posts`

## Next Steps

1. Deploy `deno-agent/cron.ts` to Deno Deploy
2. Set environment variables
3. Monitor logs for first execution
4. Verify posts are being processed
5. Set up alerts for failed crons
