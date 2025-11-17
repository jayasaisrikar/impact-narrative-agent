import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-20 border-t border-white/10 bg-black/40 px-6 py-8 text-center text-sm text-white/60">
      © {new Date().getFullYear()} BlocksBridge Consulting. All rights reserved.
    </footer>
  );
};
