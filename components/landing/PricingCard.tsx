import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { PlanPopularityChart } from './PlanPopularityChart';
import { fadeUpVariants } from '../../utils/animationVariants';

interface PricingCardProps {
  plan: {
    title: string;
    description: string;
    price: string;
    highlights: string[];
    featured?: boolean;
  };
  index: number;
  onButtonClick: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({ plan, index, onButtonClick }) => {
  return (
    <motion.div
      custom={index}
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={`rounded-3xl border p-8 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl flex flex-col ${
        plan.featured
          ? 'border-white/70 bg-gradient-to-br from-white/[0.12] to-white/[0.05] shadow-xl ring-1 ring-indigo-500/20'
          : 'border-white/20 bg-white/5'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">{plan.title}</p>
        {plan.featured && (
          <span className="rounded-full bg-gradient-to-r from-indigo-500 to-rose-500 px-4 py-1 text-xs font-semibold text-white">
            Popular
          </span>
        )}
      </div>

      <p className={`text-4xl font-bold mb-2 ${plan.featured ? 'text-white' : 'text-white/90'}`}>
        {plan.price}
      </p>
      <p className="text-sm text-white/60 mb-6">{plan.description}</p>

      {plan.featured && (
        <div className="mb-8 h-48 w-full">
          <PlanPopularityChart />
        </div>
      )}

      <div className="mb-6 h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0" />

      <ul className="space-y-4 mb-8 flex-1">
        {plan.highlights.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-white/80">{item}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onButtonClick}
        className={`w-full rounded-2xl px-4 py-3 font-semibold transition ${
          plan.featured
            ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white hover:shadow-lg hover:shadow-indigo-500/50'
            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
        }`}
      >
        Get Started
      </button>
    </motion.div>
  );
};
