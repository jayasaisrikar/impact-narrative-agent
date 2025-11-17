import React, { useCallback, useRef } from 'react';
import {
  HeroSection,
  FeaturesSection,
  PricingSection,
  Footer,
} from '../components/landing';

interface LandingPageProps {
  onViewDemo: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onViewDemo }) => {
  const planRef = useRef<HTMLDivElement>(null);

  const scrollToPlans = useCallback(() => {
    planRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#030303] text-white">
      <HeroSection onViewDemo={onViewDemo} onScrollToPlans={scrollToPlans} />
      <FeaturesSection />
      <PricingSection planRef={planRef} onButtonClick={scrollToPlans} />
      <Footer />
    </div>
  );
};

export default LandingPage;
