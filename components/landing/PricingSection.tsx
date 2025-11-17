import React from 'react';
import { motion } from 'framer-motion';
import { PLANS } from '../../constants/landingPageConstants';
import { PricingCard } from './PricingCard';

interface PricingSectionProps {
  planRef: React.RefObject<HTMLDivElement>;
  onButtonClick: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ planRef, onButtonClick }) => {
  return (
    <section ref={planRef} className="relative z-20 mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p className="text-sm uppercase tracking-[0.35em] text-white/60 mb-4">Subscription plans</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Lock in a seat for your investment team
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Monthly seats, enterprise concierge, custom integrations and fast onboarding.
          </p>
        </motion.div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {PLANS.map((plan, index) => (
          <PricingCard key={plan.title} plan={plan} index={index} onButtonClick={onButtonClick} />
        ))}
      </div>
    </section>
  );
};
