
import React, { useState, useEffect, useCallback } from 'react';
import type { Insight } from './types';
import { fetchInsights } from './services/insightService';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import DetailPage from './pages/DetailPage';
import ChatbotPage from './pages/ChatbotPage';
import LandingPage from './pages/LandingPage';
import LoadingSpinner from './components/LoadingSpinner';

interface AppProps {
  paymentsEnabled: boolean;
}

const App: React.FC<AppProps> = ({ paymentsEnabled }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'chatbot'>('dashboard');
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleSelectInsight = (insight: Insight) => {
    setSelectedInsight(insight);
  };

  const handleBackToDashboard = () => {
    setSelectedInsight(null);
    setCurrentTab('dashboard');
  };
  
  const handleRefresh = () => {
    loadInsights();
  };

  const handleViewDemo = () => {
    setShowLanding(false);
    setCurrentTab('dashboard');
    setSelectedInsight(null);
  };

  if (showLanding) {
    return (
      <div className="min-h-screen bg-slate-950">
        <LandingPage onViewDemo={handleViewDemo} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-text-primary">
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab === 'chatbot') {
            setSelectedInsight(null);
          }
        }}
        onReturnToLanding={() => {
          setShowLanding(true);
          setSelectedInsight(null);
        }}
      />
      <main className="container mx-auto p-4 md:p-8">
        {selectedInsight ? (
          <DetailPage insight={selectedInsight} onBack={handleBackToDashboard} />
        ) : (
          <>
            {isLoading ? (
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
              currentTab === 'dashboard' ? (
                <DashboardPage insights={insights} onSelectInsight={handleSelectInsight} paymentsEnabled={paymentsEnabled} onRefresh={handleRefresh} onOpenChatbot={() => setCurrentTab('chatbot')} />
              ) : (
                <ChatbotPage insights={insights} />
              )
            )}
          </>
        )}
      </main>
      <footer className="text-center p-4 text-sm text-text-secondary border-t border-gray-200 bg-white/80 shadow-sm">
        © {new Date().getFullYear()} BlocksBridge Consulting. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
