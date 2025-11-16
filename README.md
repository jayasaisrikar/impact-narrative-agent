<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1F6jYqYGmSznkWDems6FNee5w2uiTPbDB

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (e.g. `VITE_GEMINI_API_KEY=your_api_key_here`).
   Note: For production, do NOT include your API key in frontend code. Use a backend or proxy that securely stores the key.
3. Restart the dev server if it was running.
   `npm run dev`

If the chat still shows the error message, it's usually because the client can't access the API key (missing VITE_GEMINI_API_KEY), or the key is invalid. The frontend will display a specific message if the key is missing or invalid.

Optional (secure) setup:
- Run the `deno-agent` worker with `GEMINI_API_KEY` available in its environment. Then create a small server endpoint that proxies the chat request to the Deno agent so that your client never exposes the Gemini key.

Troubleshooting (if `VITE_GEMINI_API_KEY` is set but the chat shows disabled):
- Check that your `.env.local` contains `VITE_GEMINI_API_KEY=your_api_key` and not just `GEMINI_API_KEY`.
- Restart the Vite dev server after editing `.env.local` (Vite loads env at dev start).
- If the client shows an init error mentioning `window is not defined` or similar, the `@google/genai` library may be Node-only; in that case, run the `deno-agent` or implement a backend proxy instead of calling the client from the browser.
- You can run the Deno agent locally **without** Supabase if you just want the chat proxy:
  1. Create `deno-agent/.env` with the following minimum contents:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     DENO_AGENT_PORT=8787
     ```
  2. From the repo root, start the Deno agent:
     ```powershell
     cd deno-agent
     deno run --allow-env --allow-net main.ts
     ```
  3. Validate the agent's API key (returns 200 when valid, 401 when invalid):
     ```powershell
     Invoke-RestMethod -Uri 'http://localhost:8787/validate' -Method GET
     ```
  3. If you need Supabase processing to run too (the agent that generates insights), add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` to the `.env` file. If you don't, the `deno-agent` will still run as a chat proxy.
- The frontend defaults to looking for a local Deno agent at `http://localhost:8787` if it can't initialize the client. To change this, add `VITE_CHAT_PROXY_URL=http://your-proxy.com` to `.env.local`.
- If you still see issues, open the browser console (F12) and look for `Failed to initialize Gemini client` or `Error calling Gemini API` logs — these will provide more detail.
 - If the Deno agent reports a different `GEMINI_API_KEY` than what's in `deno-agent/.env`, the OS environment variable may be overriding it. Use the PowerShell commands below to inspect and update the shell environment.
PowerShell commands for debugging environment variables and keys:

- List a key in the current session:
   ```powershell
   Get-ChildItem Env:GEMINI_API_KEY
   ```
- Remove a session environment variable (non-persistent):
   ```powershell
   Remove-Item Env:GEMINI_API_KEY
   ```
- Add/override in the current session:
   ```powershell
   $env:GEMINI_API_KEY = 'your_new_key_here'
   ```
- Persistently remove or change keys via Windows Settings → Environment Variables (Control Panel) or PowerShell [SetX /User] commands.

Notes:

- If both a system env var and a `deno-agent/.env` file are present, the runtime environment variable will be used, which can cause mismatches. Restart the Deno agent after making changes so the correct key is picked up.
- The Deno agent logs will now warn if the runtime env key differs from the keys in `deno-agent/.env` so you can detect mismatches.
3. Run the app:
   `npm run dev`
