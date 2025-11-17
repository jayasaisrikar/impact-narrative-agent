import React from 'react';
import { motion } from 'framer-motion';
import { Circle } from 'lucide-react';
import { FEATURES } from '../../constants/landingPageConstants';
import { fadeUpVariants } from '../../utils/animationVariants';

export const FeaturesSection: React.FC = () => {
  return (
    <section className="relative z-20 mx-auto max-w-6xl px-6 py-24">
      <div className="grid gap-8 md:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <motion.div
            key={feature.title}
            custom={index}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-8 backdrop-blur transition hover:border-white/30 hover:bg-white/[0.08]"
          >
            <div className="mb-4 h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-rose-500/20 flex items-center justify-center">
              <Circle className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
