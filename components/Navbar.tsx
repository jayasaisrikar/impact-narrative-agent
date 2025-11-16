
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
          <motion.button
            onClick={() => handleNav('dashboard')}
            aria-current={currentTab === 'dashboard' ? 'page' : undefined}
            className={`rounded-full px-3 py-2 transition ${currentTab === 'dashboard' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'hover:text-text-primary hover:bg-gray-100'}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            Dashboard
          </motion.button>
          <motion.button
            onClick={() => handleNav('chatbot')}
            aria-current={currentTab === 'chatbot' ? 'page' : undefined}
            className={`rounded-full px-3 py-2 transition ${currentTab === 'chatbot' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'hover:text-text-primary hover:bg-gray-100'}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            Chatbot
          </motion.button>
        </div>

        <div className="flex items-center gap-3">
          {onReturnToLanding && (
            <motion.button
              onClick={onReturnToLanding}
              className="rounded-full border border-blue-500/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-700 transition hover:bg-blue-50"
              whileTap={{ scale: 0.98 }}
            >
              Landing
            </motion.button>
          )}
          <motion.button
            onClick={() => handleNav('chatbot')}
            className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition hover:opacity-90"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Talk to Agent
          </motion.button>
          <div className="md:hidden">
            <motion.button
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="p-2 rounded-full bg-white/70 text-text-secondary shadow-inner"
              whileTap={{ scale: 0.95 }}
            >
              <span className="sr-only">Toggle menu</span>
              {open ? (
                <motion.svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" initial={{ rotate: 0 }} animate={{ rotate: 90 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </motion.svg>
              ) : (
                <motion.svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" initial={{ rotate: 0 }} animate={{ rotate: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                </motion.svg>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="space-y-3 border-t border-white/30 bg-white/90 px-4 pb-4 pt-2 text-sm text-text-secondary shadow-lg md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <motion.button
              onClick={() => handleNav('dashboard')}
              className={`block w-full rounded-full px-4 py-2 text-left transition`}
              whileTap={{ scale: 0.995 }}
            >
              Dashboard
            </motion.button>
            <motion.button
              onClick={() => handleNav('chatbot')}
              className={`block w-full rounded-full px-4 py-2 text-left transition`}
              whileTap={{ scale: 0.995 }}
            >
              Chatbot
            </motion.button>
            {onReturnToLanding && (
              <motion.button
                onClick={onReturnToLanding}
                className="block w-full rounded-full border border-blue-500/60 px-4 py-2 text-left text-blue-700"
                whileTap={{ scale: 0.995 }}
              >
                Landing
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
