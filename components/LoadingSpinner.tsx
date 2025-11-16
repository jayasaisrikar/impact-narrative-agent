
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-gray-100 bg-white/90 p-8 shadow-2xl">
        <div className="relative h-24 w-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400 animate-spin"></div>
        </div>
        <p className="text-sm font-semibold text-text-secondary">Loading insights...</p>
        <p className="text-xs text-text-secondary/80">This may take a moment while the agent warms up.</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
