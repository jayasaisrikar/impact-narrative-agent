
import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

const DEFAULT_LOTTIE = 'https://assets10.lottiefiles.com/packages/lf20_p8bfn5to.json';

const LoadingSpinner: React.FC<{ animationPath?: string }> = ({ animationPath = DEFAULT_LOTTIE }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: animationPath,
    });

    return () => {
      anim.destroy();
    };
  }, [animationPath]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-gray-100 bg-white/90 p-8 shadow-2xl">
        <div className="h-24 w-24" ref={containerRef} aria-hidden />
        <p className="text-sm font-semibold text-text-secondary">Loading insights...</p>
        <p className="text-xs text-text-secondary/80">This may take a moment while the agent warms up.</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
