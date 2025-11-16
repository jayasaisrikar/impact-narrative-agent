
import React from 'react';
import type { Insight } from '../types';
import { ExternalLinkIcon, TagIcon } from './IconComponents';

interface InsightCardProps {
  insight: Insight;
  onSelect: (insight: Insight) => void;
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

const InsightCard: React.FC<InsightCardProps> = ({ insight, onSelect }) => {
  const narrativeHighlights = insight.narratives.slice(0, 3);

  return (
    <div className="flex h-full flex-col rounded-3xl border border-gray-100 bg-gradient-to-br from-white/80 to-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className={`rounded-t-3xl h-1 w-full ${eventAccent[insight.event_type] || 'bg-gray-200'}`} />
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`text-[0.65rem] font-semibold uppercase tracking-[0.4em] rounded-full border border-gray-200 px-3 py-1 ${eventTypeStyles[insight.event_type] || 'bg-gray-100 text-gray-800'}`}
          >
            {String(insight.event_type).replace(/(^|-)./g, (m) => m.toUpperCase())}
          </span>
          <span className="text-xs text-text-secondary">{new Date(insight.created_at).toLocaleDateString()}</span>
        </div>

        <h3 className="text-lg font-bold text-text-primary leading-snug line-clamp-2">{insight.post.title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{insight.summary}</p>

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
            href={insight.post.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-sm text-brand-secondary transition hover:text-brand-dark"
          >
            <ExternalLinkIcon className="h-4 w-4" />
            Source
          </a>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-text-secondary">
            {insight.narratives.length} signals
          </span>
        </div>
        <button
          onClick={() => onSelect(insight)}
          className="w-full rounded-2xl bg-brand-primary px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brand-dark"
        >
          View insight
        </button>
      </div>
    </div>
  );
};

export default InsightCard;
