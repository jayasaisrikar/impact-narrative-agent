import React, { useMemo, useState } from 'react';
import type { Insight, CompanyInsight } from '../types';
import InsightCard from '../components/InsightCard';
import { RefreshIcon } from '../components/IconComponents';
import Pagination from '../components/Pagination';
import { groupInsightsByCompany } from '../services/insightService';

interface DashboardPageProps {
  insights: Insight[];
  onSelectInsight: (insight: Insight | CompanyInsight) => void;
  paymentsEnabled: boolean;
  onRefresh: () => void;
  onOpenChatbot?: () => void;
}

const SubscribeButton: React.FC<{ paymentsEnabled: boolean; }> = ({ paymentsEnabled }) => {
  if (paymentsEnabled) {
    return (
      <button className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition hover:opacity-90">
        Subscribe Now
      </button>
    );
  }

  return (
    <button
      disabled
      className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-text-secondary cursor-not-allowed bg-white/60"
      title="Payments are currently disabled for testing."
    >
      Subscribe (Disabled)
    </button>
  );
};


const DashboardPage: React.FC<DashboardPageProps> = ({ insights, onSelectInsight, paymentsEnabled, onRefresh, onOpenChatbot }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);
  const [viewMode, setViewMode] = useState<'company' | 'post'>('company');

  // Group insights by company
  const companyInsights = useMemo(() => {
    return groupInsightsByCompany(insights);
  }, [insights]);

  // Use appropriate data based on view mode
  const displayData = viewMode === 'company' ? companyInsights : insights;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(displayData.length / pageSize)), [displayData.length, pageSize]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayData.slice(start, start + pageSize);
  }, [displayData, currentPage, pageSize]);

  // keep current page valid when pageSize or insights change
  if (currentPage > totalPages) setCurrentPage(totalPages);

  const handleViewModeChange = (mode: 'company' | 'post') => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8 pt-6">
        <div className="rounded-3xl border border-white/40 bg-gradient-to-br from-white/80 to-white/60 p-8 shadow-2xl shadow-blue-500/20 backdrop-blur">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.5em] text-blue-600">Live intelligence</p>
              <h1 className="text-3xl font-semibold text-text-primary md:text-4xl">Mining industry narratives, ready for investors.</h1>
              <p className="text-base text-text-secondary">
                AI-powered storytelling blends fresh insights, ESG shifts, and deal activity into crisp narratives you can pitch immediately.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <SubscribeButton paymentsEnabled={paymentsEnabled} />
                <button
                  onClick={onOpenChatbot}
                  className="rounded-full border border-blue-500/70 px-5 py-2 text-sm font-semibold uppercase tracking-wider text-blue-700 transition hover:bg-blue-50"
                >
                  Open Chatbot
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-white/90 p-5 shadow">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-blue-500">Companies</p>
                <p className="text-3xl font-bold text-blue-600">{companyInsights.length}</p>
                <p className="text-sm text-text-secondary">With insights</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Freshness</p>
                <p className="text-2xl font-semibold text-green-600">Real-time</p>
                <p className="text-sm text-text-secondary">Updated hourly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Insights Feed Section */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              {viewMode === 'company' ? 'Company Insights Feed' : 'Post-Level Insights Feed'}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Showing <span className="font-medium">{displayData.length}</span> {viewMode === 'company' ? 'companies' : 'insights'} — page{' '}
              <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 rounded-full border border-gray-200 p-1 bg-gray-50">
              <button
                onClick={() => handleViewModeChange('company')}
                className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
                  viewMode === 'company'
                    ? 'bg-blue-600 text-white'
                    : 'text-text-secondary hover:text-blue-600'
                }`}
              >
                By Company
              </button>
              <button
                onClick={() => handleViewModeChange('post')}
                className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
                  viewMode === 'post'
                    ? 'bg-blue-600 text-white'
                    : 'text-text-secondary hover:text-blue-600'
                }`}
              >
                By Post
              </button>
            </div>

            <label className="text-sm text-text-secondary">Per page:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {[6, 9, 12].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <button
              onClick={onRefresh}
              className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-sm font-medium text-text-secondary shadow-sm transition hover:border-blue-300 hover:text-blue-600"
            >
              <RefreshIcon className="h-5 w-5" />
              Refresh
            </button>
          </div>
        </div>

        {displayData.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginated.map((item) => (
                <InsightCard 
                  key={'company_ticker' in item ? item.company_ticker : item.id}
                  insight={item}
                  onSelect={onSelectInsight}
                  isCompanyLevel={viewMode === 'company'}
                />
              ))}
            </div>

            <div className="flex flex-col items-center">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p)} />
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 p-10 text-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A4.5 4.5 0 017.5 3h9A4.5 4.5 0 0121 7.5v6a4.5 4.5 0 01-4.5 4.5h-9A4.5 4.5 0 013 13.5v-6z" />
            </svg>
            <h2 className="mt-4 text-2xl font-semibold text-text-primary">No Insights Available</h2>
            <p className="mt-2 text-text-secondary">
              The background agent hasn't generated any insights yet. Try refreshing or head to the chat assistant to request an insight.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onRefresh}
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-lg"
              >
                Refresh
              </button>
              <button
                onClick={() => (onOpenChatbot ? onOpenChatbot() : undefined)}
                className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-text-primary"
              >
                Open Chatbot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;