import React, { useState, useRef, useEffect } from 'react';
import type { Insight } from '../types';
import { getChatbotResponse, isChatbotAvailable, getChatbotInitError, getChatProxyUrl } from '../services/chatbotService';
import ChatMessage from './ChatMessage';
import { SendIcon } from './IconComponents';

interface ChatbotProps {
  contextInsights: Insight[];
}

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ contextInsights }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Hello! I'm the Impact Narrative Agent. Ask me anything about a specific mining company, and I'll search the latest insights for answers.",
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [chatProxyUrl, setChatProxyUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  async function probeProxy() {
    const proxy = getChatProxyUrl();
    setChatProxyUrl(proxy);
    if (!proxy) return false;
    try {
      const res = await fetch(`${proxy}/validate`, { method: 'GET' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({ ok: false }));
        const msg = json?.message ?? json?.error ?? `Proxy returned status ${res.status}`;
        setInitError(String(msg));
        setAvailable(false);
        return false;
      }
      const json = await res.json();
      if (json?.ok) {
        setInitError(null);
        setAvailable(true);
        return true;
      }
      const msg = json?.message ?? JSON.stringify(json);
      setInitError(String(msg));
      setAvailable(false);
      return false;
    } catch (err) {
      console.error('Failed to connect to chat proxy:', err);
      setInitError(String(err));
      setAvailable(false);
      return false;
    }
  }

  useEffect(() => {
    const clientAvailable = isChatbotAvailable();
    setAvailable(clientAvailable);
    setInitError(getChatbotInitError());
    setChatProxyUrl(getChatProxyUrl());

    // Only check the proxy if the client library isn't usable
    if (!clientAvailable && getChatProxyUrl()) {
      probeProxy();
    }
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (!available) {
      let errorMsg = '';
      if (initError) {
        errorMsg = `The chat agent could not be initialized: ${initError}`;
      } else {
        errorMsg = 'The chat agent is not configured.';
      }
      
      // Add helpful troubleshooting tips
      let helpMsg = errorMsg;
      if (chatProxyUrl && errorMsg.includes('Failed to fetch')) {
        helpMsg = `${errorMsg}\n\n💡 Troubleshooting:\n- Is the Deno agent running? Start it with: deno run --allow-env --allow-net --allow-read --unstable deno-agent/main.ts\n- Agent should be at: ${chatProxyUrl}\n- Check VITE_CHAT_PROXY_URL in your .env file`;
      } else if (!chatProxyUrl) {
        helpMsg = `${errorMsg}\n\n💡 Set VITE_CHAT_PROXY_URL=http://localhost:8787 in your .env file and restart the dev server`;
      }
      
      setError(helpMsg);
      setMessages(prev => [...prev, { role: 'model', content: helpMsg, timestamp: new Date().toLocaleTimeString() }]);
      return;
    }

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await getChatbotResponse(input, contextInsights);
      const modelMessage: Message = { role: 'model', content: response, timestamp: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err: any) {
      const errorMessage = (err && err.message) ? err.message : 'Sorry, I encountered an error. Please try again.';
      setError(errorMessage);
      setMessages(prev => [...prev, { role: 'model', content: errorMessage, timestamp: new Date().toLocaleTimeString() }]);
      console.error('Chatbot error:', err);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="grid gap-6 rounded-3xl border border-gray-200 bg-white/90 p-0 shadow-2xl backdrop-blur md:grid-cols-[2fr_1fr]">
      <div className="flex flex-col">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Ask the Agent</h2>
            <p className="text-sm text-text-secondary">Query insights about a specific company. Use Shift+Enter for a new line.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                setMessages([
                  {
                    role: 'model',
                    content:
                      "Hello! I'm the Impact Narrative Agent. Ask me anything about a specific mining company, and I'll search the latest insights for answers.",
                    timestamp: new Date().toLocaleTimeString(),
                  },
                ])
              }
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary transition hover:bg-gray-100"
            >
              New Conversation
            </button>
            <button
              onClick={async () => {
                const txt = messages
                  .map((m) => `${m.role === 'user' ? 'You' : 'Agent'} [${m.timestamp ?? ''}]: ${m.content}`)
                  .join('\n\n');
                try {
                  await navigator.clipboard.writeText(txt);
                } catch (e) {
                  console.error(e);
                }
              }}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary transition hover:bg-gray-100"
            >
              Copy Transcript
            </button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto bg-gradient-to-b from-white to-slate-50 p-4">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}
            {isLoading && (
              <ChatMessage
                message={{ role: 'model', content: '...', timestamp: new Date().toLocaleTimeString() }}
                isLoading
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        {error && <div className="rounded-b-3xl border-t border-red-200 bg-red-50/70 px-4 py-3 text-center text-sm text-danger">{error}</div>}
        {!available && (
          <div className="rounded-b-3xl border-t border-yellow-200 bg-yellow-50/70 px-4 py-3 text-center text-sm text-yellow-800">
            {initError ? (
              <>
                The chat agent could not be initialized: <strong>{initError}</strong>.
                <div className="mt-1">Use a server-side agent, or verify that the client library can run in the browser.</div>
                {chatProxyUrl && (
                  <div className="mt-2 text-xs">
                    Try running the local Deno agent and visit <code>{chatProxyUrl}</code> or set <code>VITE_CHAT_PROXY_URL</code> in your environment.
                  </div>
                )}
              </>
            ) : (
              <>
                The chat agent is currently disabled (Gemini API key not configured). Set <code>VITE_GEMINI_API_KEY</code> in your local environment or use the backend agent.
                {chatProxyUrl && (
                  <div className="mt-2 text-xs">
                    Or run the local Deno agent at <code>{chatProxyUrl}</code> and click <strong>Retry</strong> to re-check.
                  </div>
                )}
              </>
            )}
            <div className="mt-2">
              <button
                onClick={() => void probeProxy()}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        <div className="rounded-b-3xl border-t border-gray-200 bg-white p-4">
          <form onSubmit={handleSendMessage} className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., What are the latest activities for 'Northern Minerals'?"
              ref={inputRef}
              className="w-full resize-none rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-text-primary focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={isLoading || !available}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const form = (e.target as HTMLElement).closest('form') as HTMLFormElement | null;
                  form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
              }}
            />
            <div className="flex flex-col items-center gap-2">
              <button
                type="submit"
                disabled={!available || isLoading || !input.trim()}
                className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-3 text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <SendIcon className="h-5 w-5" />
              </button>
              <div className="text-xs text-text-secondary mt-1">{input.length} chars</div>
            </div>
          </form>
        </div>
      </div>

      {/* Right-hand side: Context insights */}
      <aside className="hidden md:flex md:flex-col md:col-span-1 border-l border-gray-100 bg-white/70">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-text-primary">Context Insights</h3>
          <p className="text-xs text-text-secondary mt-1">Showing {contextInsights.length} most recent. Click to draft a question.</p>
        </div>
        <div className="px-4 pb-4 overflow-y-auto max-h-[520px]">
          {contextInsights.length === 0 ? (
            <div className="text-sm text-text-secondary p-2">No context insights available for this session.</div>
          ) : (
            <ul className="space-y-2">
              {contextInsights.slice(0, 8).map((ci, idx) => (
                <li key={ci.id} className="p-2 rounded-md hover:bg-gray-50 cursor-pointer border border-gray-100" onClick={() => setInput((s) => s ? `${s}\n
Tell me about: ${ci.post.title}` : `Tell me about: ${ci.post.title}`)}>
                  <div className="text-sm font-medium text-text-primary">{ci.post.title}</div>
                  <div className="text-xs text-text-secondary mt-1">{new Date(ci.created_at).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
};

export default Chatbot;
