
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import type { Insight, CompanyInsight } from './types';
import { fetchInsights } from './services/insightService';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import DetailPage from './pages/DetailPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import ChatbotPage from './pages/ChatbotPage';
import LandingPage from './pages/LandingPage';
import LoadingSpinner from './components/LoadingSpinner';

interface AppProps {
  paymentsEnabled: boolean;
}

// Main app content component (uses routing)
const AppContent: React.FC<{ paymentsEnabled: boolean }> = ({ paymentsEnabled }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const loadInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchInsights();
      setInsights(data);
    } catch (err) {
      const message = (err as any)?.message || 'Failed to fetch insights. Please try again later.';
      setError(message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const handleSelectInsight = (insight: Insight | CompanyInsight) => {
    if ('company_ticker' in insight && 'posts' in insight) {
      navigate(`/company/${(insight as CompanyInsight).company_ticker}`);
    } else {
      navigate(`/insight/${(insight as Insight).id}`);
    }
  };

  const handleRefresh = () => {
    loadInsights();
  };

  const handleViewDemo = () => {
    navigate('/dashboard');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Determine current tab from location pathname
  const getCurrentTab = (): 'dashboard' | 'chatbot' => {
    if (location.pathname.includes('/chatbot')) return 'chatbot';
    return 'dashboard';
  };

  // Check if on landing page
  const isLandingPage = location.pathname === '/';

  return (
    <>
      {isLandingPage ? (
        // Landing page - full screen, no navbar/footer
        <div className="min-h-screen bg-slate-950">
          <Routes>
            <Route path="/" element={<LandingPage onViewDemo={handleViewDemo} />} />
          </Routes>
        </div>
      ) : (
        // App pages - with navbar and footer
        <div className="min-h-screen bg-slate-50 text-text-primary flex flex-col">
          <Navbar
            currentTab={getCurrentTab()}
            onTabChange={(tab) => {
              navigate(tab === 'chatbot' ? '/chatbot' : '/dashboard');
            }}
            onReturnToLanding={() => {
              navigate('/');
            }}
          />
          <main className="container mx-auto p-4 md:p-8 flex-1">
            <Routes>
              <Route
                path="/dashboard"
                element={
                  isLoading ? (
                    <div className="flex justify-center items-center h-96">
                      <LoadingSpinner />
                    </div>
                  ) : error ? (
                    <div className="text-center text-danger bg-red-100 p-4 rounded-lg">
                      <p>{error}</p>
                      <button 
                        onClick={handleRefresh}
                        className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <DashboardPage
                      insights={insights}
                      onSelectInsight={handleSelectInsight}
                      paymentsEnabled={paymentsEnabled}
                      onRefresh={handleRefresh}
                      onOpenChatbot={() => navigate('/chatbot')}
                    />
                  )
                }
              />
              <Route path="/insight/:insightId" element={<InsightDetailRoute insights={insights} onBack={handleBackToDashboard} />} />
              <Route path="/company/:ticker" element={<CompanyDetailRoute onBack={handleBackToDashboard} />} />
              <Route
                path="/chatbot"
                element={
                  isLoading ? (
                    <div className="flex justify-center items-center h-96">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <ChatbotPage insights={insights} />
                  )
                }
              />
            </Routes>
          </main>
          <footer className="text-center p-4 text-sm text-text-secondary border-t border-gray-200 bg-white/80 shadow-sm">
            © {new Date().getFullYear()} BlocksBridge Consulting. All rights reserved.
          </footer>
        </div>
      )}
    </>
  );
};

// Component to handle detail page with URL parameter
interface InsightDetailRouteProps {
  insights: Insight[];
  onBack: () => void;
}

const InsightDetailRoute: React.FC<InsightDetailRouteProps> = ({ insights, onBack }) => {
  const { insightId } = useParams<{ insightId: string }>();
  const insight = insights.find(i => i.id === insightId);

  if (!insight) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Insight Not Found</h2>
        <p className="text-text-secondary mb-6">The insight you're looking for could not be found.</p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return <DetailPage insight={insight} onBack={onBack} />;
};

interface CompanyDetailRouteProps {
  onBack: () => void;
}

const CompanyDetailRoute: React.FC<CompanyDetailRouteProps> = ({ onBack }) => {
  const { ticker } = useParams<{ ticker: string }>();

  if (!ticker) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Invalid Ticker</h2>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return <CompanyDetailPage ticker={ticker} onBack={onBack} />;
};

const App: React.FC<AppProps> = ({ paymentsEnabled }) => {
  return (
    <BrowserRouter>
      <AppContent paymentsEnabled={paymentsEnabled} />
    </BrowserRouter>
  );
};

export default App;
