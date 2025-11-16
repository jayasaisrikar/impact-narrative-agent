## Run Locally

**Prerequisites:** Node.js, Deno (optional, for running the agent locally)

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy the `.env.example` file to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```
   
   Then fill in your actual credentials:
   - `VITE_GEMINI_API_KEY` - Get from [Google AI Studio](https://ai.google.dev/)
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` - Get from your Supabase project settings
   - `SUPABASE_SERVICE_KEY` - Only needed if running the Deno agent locally

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`.

### URL Routing & State Persistence

The app now uses **React Router** for proper URL-based navigation. This means:

- **Direct Links** - Share URLs like `http://localhost:3000/insight/abc123`
- **Page Reload** - Refreshing maintains your current view and URL
- **Browser History** - Back/forward buttons work intuitively
- **Deep Linking** - Access any page directly from a URL

See [ROUTING_GUIDE.md](./ROUTING_GUIDE.md) for detailed information about available routes and navigation.

**Available Routes:**
- `/` - Landing page
- `/dashboard` - Main dashboard with insights
- `/chatbot` - Chat interface
- `/insight/:id` - Detail page for a specific insight


### Using the Deno Agent (Optional)

For secure API key handling and server-side processing, run the Deno agent locally:

1. **Ensure `.env` in root contains:**
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   DENO_AGENT_PORT=8787
   ```

2. **Start the Deno agent:**
   ```bash
   cd deno-agent
   deno run --allow-env --allow-net --allow-read main.ts
   ```

3. **Validate the agent's API key:**
   ```bash
   Invoke-RestMethod -Uri 'http://localhost:8787/validate' -Method GET
   ```

### Running the Agent on a Schedule (Cron Job)

To automatically generate insights every hour, use a cron job to run the insight generation agent:

#### **Option 1: Local Cron Job (Windows Task Scheduler)**

1. Open **Task Scheduler**
2. Create a new task with:
   - **Name:** `ImpactNarrativeAgent-Hourly`
   - **Trigger:** Daily, repeat every 1 hour
   - **Action:** Run `npm run run-agent` from project root
   - **Start in:** `D:\Git Repos\impact-narrative-agent` (your project directory)

#### **Option 2: Deno Deploy (Recommended for Production)**

1. Deploy the `deno-agent/main.ts` to [Deno Deploy](https://deno.com/deploy)
2. Set up a **Cron Trigger** in Deno Deploy:
   ```
   Cron: 0 * * * *  (every hour, on the hour)
   ```
3. Ensure all environment variables are set in Deno Deploy:
   - `VITE_GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

#### **Option 3: GitHub Actions**

Create `.github/workflows/run-agent.yml`:

```yaml
name: Run Impact Narrative Agent
on:
  schedule:
    - cron: '0 * * * *'  # Every hour at minute 0

jobs:
  run-agent:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
        with:
          deno-version: vx.x.x  # Specify Deno version

      - name: Run agent
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: deno run --allow-env --allow-net --allow-read deno-agent/main.ts
```

### Troubleshooting

- **Gemini API key not configured:** Check that `VITE_GEMINI_API_KEY` is set in `.env` and restart the dev server (Vite loads env variables at startup).
- **Chat showing disabled:** Open browser console (F12) for specific error messages. Common issues:
  - Missing or invalid `VITE_GEMINI_API_KEY`
  - Client library incompatibility (use Deno agent proxy instead)
- **Deno agent shows different key:** Environment variables from the OS may override `.env`. Check with:
  ```powershell
  Get-ChildItem Env:GEMINI_API_KEY
  ```
- **Supabase connection fails:** Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct and the service is accessible.

---

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub** (ensure `.env` is in `.gitignore` and only commit `.env.example`)

2. **Connect to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Import your GitHub repository
   - Vercel will detect the `vercel.json` configuration

3. **Set environment variables in Vercel:**
   - `VITE_GEMINI_API_KEY` - Your Gemini API key
   - `VITE_SUPABASE_URL` - Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `VITE_CHAT_PROXY_URL` - (Optional) Leave empty for production or set to your backend proxy

4. **Deploy:**
   - Click "Deploy"
   - Your app will be live at `https://your-project.vercel.app`
