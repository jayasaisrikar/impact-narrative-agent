import React from 'react';
import { motion } from 'framer-motion';
import { Circle } from 'lucide-react';
import { ElegantShape } from './ElegantShape';
import { STATS } from '../../constants/landingPageConstants';
import { fadeUpVariants } from '../../utils/animationVariants';

interface HeroSectionProps {
  onViewDemo: () => void;
  onScrollToPlans: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onViewDemo, onScrollToPlans }) => {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

      {/* Animated shapes background */}
      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-indigo-500/[0.15]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />
        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-rose-500/[0.15]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />
        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-violet-500/[0.15]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />
        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-500/[0.15]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />
        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-cyan-500/[0.15]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        />
      </div>

      {/* Hero content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 md:mb-12"
          >
            <Circle className="h-2 w-2 fill-indigo-500/80" />
            <span className="text-sm text-white/60 tracking-wide">Impact Narrative Agent</span>
          </motion.div>

          <motion.div custom={1} variants={fadeUpVariants} initial="hidden" animate="visible">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 md:mb-8 tracking-tight leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                Narratives that turn
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300">
                mining data into investment conviction
              </span>
            </h1>
          </motion.div>

          <motion.div custom={2} variants={fadeUpVariants} initial="hidden" animate="visible">
            <p className="text-base sm:text-lg md:text-xl text-white/60 mb-8 leading-relaxed font-light tracking-wide max-w-2xl mx-auto">
              Synthesize news, filings and ESG shifts so investors can pitch actionable stories in minutes instead of days.
            </p>
          </motion.div>

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={onScrollToPlans}
              className="inline-flex items-center justify-center rounded-full border border-white/60 bg-white/10 px-8 py-3 font-semibold text-white transition hover:border-white hover:bg-white/20 backdrop-blur"
            >
              View Plans
            </button>
            <button
              onClick={onViewDemo}
              className="rounded-full bg-white px-8 py-3 font-semibold text-[#030303] transition hover:bg-slate-100"
            >
              View Demo
            </button>
          </motion.div>

          <motion.div
            custom={4}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 sm:grid-cols-3 mt-12 md:mt-16"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur">
                <dt className="text-xs uppercase tracking-wide text-white/60">{stat.label}</dt>
                <dd className="mt-2 text-2xl font-bold text-white">{stat.value}</dd>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
    </section>
  );
};
