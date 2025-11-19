
import React from 'react';
import type { Insight, CompanyInsight } from '../types';
import { ExternalLinkIcon, TagIcon } from './IconComponents';

interface InsightCardProps {
  insight: Insight | CompanyInsight;
  onSelect: (insight: Insight | CompanyInsight) => void;
  isCompanyLevel?: boolean;
}

const eventTypeStyles: { [key: string]: string } = {
  financing: 'bg-green-100 text-green-800',
  expansion: 'bg-blue-100 text-blue-800',
  regulation: 'bg-yellow-100 text-yellow-800',
  market: 'bg-purple-100 text-purple-800',
  technology: 'bg-indigo-100 text-indigo-800',
  exploration: 'bg-teal-100 text-teal-800',
  'm&a': 'bg-pink-100 text-pink-800',
};

const eventAccent: { [key: string]: string } = {
  financing: 'bg-green-400',
  expansion: 'bg-blue-400',
  regulation: 'bg-yellow-400',
  market: 'bg-purple-400',
  technology: 'bg-indigo-400',
  exploration: 'bg-teal-400',
  'm&a': 'bg-pink-400',
};

const InsightCard: React.FC<InsightCardProps> = ({ insight, onSelect, isCompanyLevel = false }) => {
  const isCompany = isCompanyLevel || 'company_ticker' in insight && 'related_post_count' in insight;
  const companyInsight = isCompany ? (insight as CompanyInsight) : null;
  const singleInsight = !isCompany ? (insight as Insight) : null;

  if (companyInsight) {
    // Company-level insight display
    const primaryEventType = companyInsight.event_types[0] || 'market';
    const narrativeHighlights = companyInsight.narratives.slice(0, 3);

    return (
      <div className="flex h-full flex-col rounded-3xl border border-gray-100 bg-gradient-to-br from-white/80 to-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
        <div className={`rounded-t-3xl h-2 w-full ${eventAccent[primaryEventType] || 'bg-gray-200'}`} />
        <div className="flex flex-col gap-4 p-6">
          {/* Company ticker prominently displayed */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-brand-primary">{companyInsight.company_ticker}</span>
              {companyInsight.company_name && (
                <span className="text-sm text-text-secondary">{companyInsight.company_name}</span>
              )}
            </div>
            <span className="text-xs text-text-secondary">{new Date(companyInsight.latest_post_date).toLocaleDateString()}</span>
          </div>

          {/* Event type badges */}
          <div className="flex flex-wrap gap-2">
            {companyInsight.event_types.slice(0, 2).map((eventType, index) => (
              <span
                key={index}
                className={`text-[0.65rem] font-semibold uppercase tracking-[0.4em] rounded-full border border-gray-200 px-3 py-1 ${eventTypeStyles[eventType] || 'bg-gray-100 text-gray-800'}`}
              >
                {String(eventType).replace(/(^|-)./g, (m) => m.toUpperCase())}
              </span>
            ))}
            {companyInsight.event_types.length > 2 && (
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-text-secondary">
                +{companyInsight.event_types.length - 2} more
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-text-primary leading-snug">{companyInsight.summary}</h3>

          {/* Narrative highlights */}
          <div className="flex flex-wrap gap-2">
            {narrativeHighlights.map((narrative, index) => (
              <span key={index} className="flex items-center gap-1 rounded-full border border-gray-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <TagIcon className="h-3 w-3" />
                {narrative}
              </span>
            ))}
          </div>

          {/* Related posts count */}
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
            <span className="text-xs font-semibold text-text-secondary">Related posts:</span>
            <span className="font-bold text-blue-600">{companyInsight.related_post_count}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-white/90 p-4 rounded-b-3xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-text-secondary">
              {companyInsight.narratives.length} narratives
            </span>
          </div>
          <button
            onClick={() => onSelect(companyInsight)}
            className="w-full rounded-2xl bg-brand-primary px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brand-dark"
          >
            View company insights
          </button>
        </div>
      </div>
    );
  }

  // Single insight (post-level) display - unchanged
  if (singleInsight) {
    const narrativeHighlights = singleInsight.narratives.slice(0, 3);

    return (
      <div className="flex h-full flex-col rounded-3xl border border-gray-100 bg-gradient-to-br from-white/80 to-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
        <div className={`rounded-t-3xl h-1 w-full ${eventAccent[singleInsight.event_type] || 'bg-gray-200'}`} />
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <span
              className={`text-[0.65rem] font-semibold uppercase tracking-[0.4em] rounded-full border border-gray-200 px-3 py-1 ${eventTypeStyles[singleInsight.event_type] || 'bg-gray-100 text-gray-800'}`}
            >
              {String(singleInsight.event_type).replace(/(^|-)./g, (m) => m.toUpperCase())}
            </span>
            <span className="text-xs text-text-secondary">{new Date(singleInsight.created_at).toLocaleDateString()}</span>
          </div>

          <h3 className="text-lg font-bold text-text-primary leading-snug line-clamp-2">{singleInsight.post.title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{singleInsight.summary}</p>

          <div className="flex flex-wrap gap-2">
            {narrativeHighlights.map((narrative, index) => (
              <span key={index} className="flex items-center gap-1 rounded-full border border-gray-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <TagIcon className="h-3 w-3" />
                {narrative}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-white/90 p-4 rounded-b-3xl">
          <div className="flex items-center justify-between">
            <a
              href={singleInsight.post.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-sm text-brand-secondary transition hover:text-brand-dark"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Source
            </a>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-text-secondary">
              {singleInsight.narratives.length} signals
            </span>
          </div>
          <button
            onClick={() => onSelect(singleInsight)}
            className="w-full rounded-2xl bg-brand-primary px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brand-dark"
          >
            View insight
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default InsightCard;
