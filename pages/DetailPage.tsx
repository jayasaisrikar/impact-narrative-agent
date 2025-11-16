
import React, { useState, useEffect } from 'react';
import type { Insight } from '../types';
import { ExternalLinkIcon, BackArrowIcon, TagIcon, CopyIcon } from '../components/IconComponents';

interface DetailPageProps {
  insight: Insight;
  onBack: () => void;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-lg">
    <h3 className="text-lg font-semibold text-text-primary border-b border-gray-200 pb-3 mb-4">{title}</h3>
    <div className="text-text-secondary space-y-2">{children}</div>
  </div>
);

const eventAccent: { [key: string]: string } = {
  financing: 'bg-green-400',
  expansion: 'bg-blue-400',
  regulation: 'bg-yellow-400',
  market: 'bg-purple-400',
  technology: 'bg-indigo-400',
  exploration: 'bg-teal-400',
  'm&a': 'bg-pink-400',
};

const DetailPage: React.FC<DetailPageProps> = ({ insight, onBack }) => {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('saved_insights');
      const list: string[] = raw ? JSON.parse(raw) : [];
      setSaved(list.includes(insight.id));
    } catch (e) {
      setSaved(false);
    }
  }, [insight.id]);

  const toggleSave = () => {
    try {
      const raw = localStorage.getItem('saved_insights');
      const list: string[] = raw ? JSON.parse(raw) : [];
      const set = new Set(list);
      if (set.has(insight.id)) {
        set.delete(insight.id);
        setSaved(false);
      } else {
        set.add(insight.id);
        setSaved(true);
      }
      localStorage.setItem('saved_insights', JSON.stringify(Array.from(set)));
    } catch (err) {
      console.error('Failed to toggle saved state', err);
    }
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(insight.summary);
    } catch (err) {
      console.error('Failed to copy summary', err);
    }
  };

  const copyLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors mb-4">
          <BackArrowIcon className="h-5 w-5" />
          Back to Dashboard
        </button>
      </div>
      
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-6 shadow-2xl grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className={`${eventAccent[insight.event_type] || 'bg-gray-300'} rounded-md px-3 py-1 text-xs font-semibold text-white uppercase`}>{insight.event_type}</div>
            <div className="text-sm text-text-secondary">Published: {new Date(insight.post.published_date).toLocaleDateString()}</div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mt-3 leading-snug">{insight.post.title}</h1>
          <div className="mt-4 text-text-secondary text-sm">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{insight.summary}</p>
            </div>
          </div>
        </div>
        <div className="md:col-span-1 flex flex-col gap-3">
          <div className="rounded-2xl border border-gray-100 bg-white/80 p-4 shadow">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Actions</div>
              <div className="text-xs text-text-secondary">Quick</div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <button onClick={copySummary} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-text-secondary hover:border-blue-300 transition">
                <CopyIcon className="h-4 w-4" />
                Copy Summary
              </button>
              <a href={insight.post.url} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-text-secondary hover:border-blue-300 transition">
                <ExternalLinkIcon className="h-4 w-4" />
                Open Source
              </a>
              <button onClick={copyLink} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-text-secondary hover:border-blue-300 transition">
                <CopyIcon className="h-4 w-4" />
                Copy Link
              </button>
              <button onClick={toggleSave} className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${saved ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'border border-gray-200 text-text-primary hover:border-blue-300'}`}>
                {saved ? '✓ Saved' : 'Save Insight'}
              </button>
              <a className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-text-secondary hover:border-blue-300 transition" href={`mailto:?subject=${encodeURIComponent('Insight: ' + insight.post.title)}&body=${encodeURIComponent(window.location.href)}`}>
                Share via Email
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white/80 p-3 shadow">
            <div className="text-sm font-semibold">Narratives</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {insight.narratives.map((narrative, index) => (
                <span key={index} className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700">{narrative}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DetailSection title="AI-Generated Summary">
        <p>{insight.summary}</p>
      </DetailSection>

      <div className="grid md:grid-cols-2 gap-6">
        <DetailSection title="Implications for Investors">
            <p>{insight.implications_investor}</p>
        </DetailSection>
        <DetailSection title="Implications for Company/Sector">
            <p>{insight.implications_company}</p>
        </DetailSection>
      </div>

      <DetailSection title="Potential Investment Narratives">
        <div className="flex flex-wrap gap-3">
          {insight.narratives.map((narrative, index) => (
            <div key={index} className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700">
              <TagIcon className="h-4 w-4" />
              <span>{narrative}</span>
            </div>
          ))}
        </div>
      </DetailSection>

    </div>
  );
};

export default DetailPage;
