import React from 'react';
import type { Insight } from '../types';
import Chatbot from '../components/Chatbot';

interface ChatbotPageProps {
  insights: Insight[];
}

const ChatbotPage: React.FC<ChatbotPageProps> = ({ insights }) => {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg">
        <p className="text-xs uppercase tracking-[0.5em] text-blue-600 font-semibold">AI-Powered Agent</p>
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mt-2">Chat with the Impact Narrative Agent</h1>
        <p className="text-text-secondary mt-2 text-base">Ask questions about mining companies and get context-aware insights powered by the latest market intelligence.</p>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Chatbot contextInsights={insights} />
      </div>
    </div>
  );
};

export default ChatbotPage;
