
import React, { useState } from 'react';

type TabKey = 'dashboard' | 'chatbot';

interface NavbarProps {
  currentTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onReturnToLanding?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange, onReturnToLanding }) => {
  const [open, setOpen] = useState(false);

  const handleNav = (tab: TabKey) => {
    setOpen(false);
    onTabChange(tab);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 shadow-xl shadow-blue-500/10 backdrop-blur border-b border-white/30">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary"
            onClick={() => handleNav('dashboard')}
            aria-label="Go to dashboard"
          >
            <img src="/bb-logo.png" alt="BlocksBridge Logo" className="inline-flex h-9 w-9 items-center justify-center rounded-full" />
            <span className="text-lg font-bold text-text-primary">Impact Narrative</span>
          </button>
        </div>

        <div className="hidden gap-4 text-sm font-medium text-text-secondary md:flex md:items-center">
          <button
            onClick={() => handleNav('dashboard')}
            aria-current={currentTab === 'dashboard' ? 'page' : undefined}
            className={`rounded-full px-3 py-2 transition ${currentTab === 'dashboard' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'hover:text-text-primary hover:bg-gray-100'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => handleNav('chatbot')}
            aria-current={currentTab === 'chatbot' ? 'page' : undefined}
            className={`rounded-full px-3 py-2 transition ${currentTab === 'chatbot' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'hover:text-text-primary hover:bg-gray-100'}`}
          >
            Chatbot
          </button>
        </div>

        <div className="flex items-center gap-3">
          {onReturnToLanding && (
            <button
              onClick={onReturnToLanding}
              className="rounded-full border border-blue-500/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-700 transition hover:bg-blue-50"
            >
              Landing
            </button>
          )}
          <button
            onClick={() => handleNav('chatbot')}
            className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition hover:opacity-90"
          >
            Talk to Agent
          </button>
          <div className="md:hidden">
            <button
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="p-2 rounded-full bg-white/70 text-text-secondary shadow-inner"
            >
              <span className="sr-only">Toggle menu</span>
              {open ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="space-y-3 border-t border-white/30 bg-white/90 px-4 pb-4 pt-2 text-sm text-text-secondary shadow-lg md:hidden"
        >
          <button
            onClick={() => handleNav('dashboard')}
            className={`block w-full rounded-full px-4 py-2 text-left transition`}
          >
            Dashboard
          </button>
          <button
            onClick={() => handleNav('chatbot')}
            className={`block w-full rounded-full px-4 py-2 text-left transition`}
          >
            Chatbot
          </button>
          {onReturnToLanding && (
            <button
              onClick={onReturnToLanding}
              className="block w-full rounded-full border border-blue-500/60 px-4 py-2 text-left text-blue-700"
            >
              Landing
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
