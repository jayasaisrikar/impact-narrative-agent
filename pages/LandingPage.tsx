import React, { useCallback, useRef } from 'react';

interface LandingPageProps {
  onViewDemo: () => void;
}

const stats = [
  { label: 'Data sources parsed weekly', value: '120+' },
  { label: 'Narratives delivered to investors', value: '4,800+' },
  { label: 'Time saved per research cycle', value: '72 hrs' },
];

const features = [
  {
    title: 'Narrative intelligence',
    description: 'Summarizes the latest mining news, deals and ESG shifts into investor-ready talking points.',
    accent: 'from-purple-400/80 to-blue-500/70',
  },
  {
    title: 'Opportunity radar',
    description: 'Tracks capital raises, M&A chatter and commodity swings for the portfolio companies you monitor.',
    accent: 'from-pink-400/80 to-red-500/70',
  },
  {
    title: 'Sentiment pulse',
    description: 'Knows which narratives resonate with analysts and boards and flags shifts before the market reacts.',
    accent: 'from-emerald-400/80 to-teal-500/70',
  },
];

const plans = [
  {
    title: 'Explorer',
    description: 'For individual analysts who need fast context.',
    price: 'Free',
    highlights: ['1 workspace', '50 insights / mo', 'Community chat access'],
  },
  {
    title: 'Strategic',
    description: 'For investment desks that work across multiple mandates.',
    price: '$49',
    highlights: ['Unlimited workspaces', 'Realtime narrative alerts', 'Premium research library'],
    featured: true,
  },
  {
    title: 'Enterprise',
    description: 'For firms that require concierge insights and hosted private agents.',
    price: 'Custom',
    highlights: ['Dedicated agent', 'SLA-backed uptime', 'Data residency controls'],
  },
];

const LandingPage: React.FC<LandingPageProps> = ({ onViewDemo }) => {
  const planRef = useRef<HTMLDivElement>(null);

  const scrollToPlans = useCallback(() => {
    planRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.45),_transparent_45%)] from-slate-950 via-[#0b1b42] to-[#122264] text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 bg-gradient-to-br from-[#c084fc] to-[#60a5fa] opacity-40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 bg-gradient-to-br from-[#22d3ee] to-[#2563eb] opacity-50 blur-3xl" />
        <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold tracking-wide backdrop-blur">
              <img src="/bb-logo.png" alt="BlocksBridge Logo" className="h-8 w-8 rounded-full border border-white/70 object-cover" />
              Impact Narrative Agent
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                Narratives that turn mining data into investment conviction.
              </h1>
              <p className="text-lg text-white/80">
                The Impact Narrative Agent synthesizes news, filings and ESG shifts so investors can pitch actionable stories in minutes instead of days.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <button
                onClick={scrollToPlans}
                className="inline-flex items-center justify-center rounded-full border border-white/60 bg-white/10 px-6 py-3 font-semibold text-white transition hover:border-white hover:bg-white/20"
              >
                Subscribe
              </button>
              <button
                onClick={onViewDemo}
                className="rounded-full bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                View Demo
              </button>
            </div>
            <dl className="grid gap-6 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur">
                  <dt className="text-xs uppercase tracking-wide text-white/60">{stat.label}</dt>
                  <dd className="mt-2 text-2xl font-bold text-white">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-1 flex-col gap-6 rounded-3xl border border-white/20 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.35em] text-white/60">Why investors choose INA</p>
              <h2 className="text-2xl font-semibold text-white">Industry-grade signal stack</h2>
            </div>
            <div className="flex flex-col gap-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br p-4 shadow-lg"
                  style={{
                    backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03))`,
                  }}
                >
                  <p className="text-xs uppercase tracking-wide text-white/70">Signal</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl space-y-6 px-6 py-12 text-white">
        <div>
          <h2 className="text-3xl font-semibold">What you get</h2>
          <p className="text-lg text-white/70">Every plan blends AI storytelling with live market intelligence so your team can share confident theses.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.title}
              className={`rounded-3xl border p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl ${plan.featured ? 'border-white/70 bg-white/10' : 'border-white/20 bg-white/5'}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">{plan.title}</p>
                {plan.featured && <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-900">Popular</span>}
              </div>
              <p className="text-3xl font-bold text-white">{plan.price}</p>
              <p className="mt-2 text-sm text-white/70">{plan.description}</p>
              <ul className="mt-6 space-y-2 text-sm text-white/70">
                {plan.highlights.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-white/80" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={scrollToPlans}
                className={`mt-6 w-full rounded-2xl px-4 py-3 font-semibold text-slate-900 transition ${plan.featured ? 'bg-white' : 'bg-white/80'}`}
              >
                Join
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-white/90 shadow-2xl" ref={planRef}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.45em] text-white/60">Subscription plans</p>
            <h2 className="text-3xl font-bold">Lock in a seat for your investment team</h2>
            <p className="text-white/70">Monthly seats, enterprise concierge, custom integrations and fast onboarding.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={scrollToPlans}
              className="rounded-full border border-white/60 px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white"
            >
              Compare plans
            </button>
            <button
              onClick={onViewDemo}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-900 transition hover:bg-slate-100"
            >
              View demo
            </button>
          </div>
        </div>
      </section>

      <footer className="text-center p-6 text-sm text-white/70 border-t border-white/10 bg-black/40">
        © {new Date().getFullYear()} BlocksBridge Consulting. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
