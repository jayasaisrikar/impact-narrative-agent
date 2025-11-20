import React, { useState, useEffect } from 'react';
import type { CompanyInsight } from '../types';
import { fetchCompanyInsight } from '../services/companyInsightService';
import { ExternalLinkIcon, BackArrowIcon, TagIcon, CopyIcon } from '../components/IconComponents';
import LoadingSpinner from '../components/LoadingSpinner';

interface CompanyDetailPageProps {
  ticker: string;
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

const CompanyDetailPage: React.FC<CompanyDetailPageProps> = ({ ticker, onBack }) => {
  const [insight, setInsight] = useState<CompanyInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadInsight();
  }, [ticker]);

  const loadInsight = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchCompanyInsight(ticker);
      setInsight(data);
      
      if (data) {
        const raw = localStorage.getItem('saved_company_insights');
        const list: string[] = raw ? JSON.parse(raw) : [];
        setSaved(list.includes(ticker));
      }
    } catch (err) {
      setError((err as any)?.message || 'Failed to load company insights');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSave = () => {
    try {
      const raw = localStorage.getItem('saved_company_insights');
      const list: string[] = raw ? JSON.parse(raw) : [];
      const set = new Set(list);
      if (set.has(ticker)) {
        set.delete(ticker);
        setSaved(false);
      } else {
        set.add(ticker);
        setSaved(true);
      }
      localStorage.setItem('saved_company_insights', JSON.stringify(Array.from(set)));
    } catch (err) {
      console.error('Failed to toggle saved state', err);
    }
  };

  const copySummary = async () => {
    if (insight) {
      try {
        await navigator.clipboard.writeText(insight.summary);
      } catch (err) {
        console.error('Failed to copy summary', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Insights Not Found</h2>
        <p className="text-text-secondary mb-6">{error || 'No company insights available for this ticker.'}</p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const primaryEventType = insight.event_types?.[0] || 'market';

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
            <span className="text-3xl font-bold text-brand-primary">{ticker}</span>
            {insight.company_name && (
              <span className="text-sm text-text-secondary">{insight.company_name}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {insight.event_types?.slice(0, 3).map((eventType) => (
              <div key={eventType} className={`${eventAccent[eventType] || 'bg-gray-300'} rounded-md px-3 py-1 text-xs font-semibold text-white uppercase`}>
                {eventType}
              </div>
            ))}
          </div>
          <div className="mt-4 text-text-secondary text-sm">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{insight.summary}</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-text-secondary">
            <span>Related Posts: {insight.related_post_count}</span>
            <span className="mx-2">•</span>
            <span>Last Updated: {new Date(insight.latest_post_date).toLocaleDateString()}</span>
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
              <button onClick={toggleSave} className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${saved ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'border border-gray-200 text-text-primary hover:border-blue-300'}`}>
                {saved ? '✓ Saved' : 'Save Insight'}
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white/80 p-3 shadow">
            <div className="text-sm font-semibold">Key Narratives</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {insight.narratives?.slice(0, 3).map((narrative, index) => (
                <span key={index} className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 line-clamp-1">{narrative}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DetailSection title="Company Summary">
        <p>{insight.summary}</p>
      </DetailSection>

      <div className="grid md:grid-cols-2 gap-6">
        <DetailSection title="Investor Implications">
          <p>{insight.implications_investor}</p>
        </DetailSection>
        <DetailSection title="Company & Sector Implications">
          <p>{insight.implications_company}</p>
        </DetailSection>
      </div>

      <DetailSection title="Synthesized Investment Narratives">
        <div className="flex flex-wrap gap-3">
          {insight.narratives?.map((narrative, index) => (
            <div key={index} className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700">
              <TagIcon className="h-4 w-4" />
              <span>{narrative}</span>
            </div>
          ))}
        </div>
      </DetailSection>

      <DetailSection title="Event Types Identified">
        <div className="flex flex-wrap gap-2">
          {insight.event_types?.map((eventType) => (
            <span key={eventType} className={`${eventAccent[eventType] || 'bg-gray-300'} rounded-md px-3 py-1 text-xs font-semibold text-white uppercase`}>
              {eventType}
            </span>
          ))}
        </div>
      </DetailSection>
    </div>
  );
};

export default CompanyDetailPage;
