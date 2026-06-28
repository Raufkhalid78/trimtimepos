import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PricingSectionProps {
  onGoToSignUp: () => void;
}

const features = {
  monthly: [
    'Max 10 branches / locations',
    'Max 30 employees / staff',
    'Unlimited transactions',
    'Full POS terminal',
    'Staff management & commissions',
    'Inventory & supplier tracking',
    'Customer CRM & loyalty',
    'Standard support',
  ],
  yearly: [
    'Max 25 branches & 100 staff',
    'Everything in Monthly',
    'AI-powered financial reports',
    'Priority 24/7 support',
    'Advanced analytics dashboard',
    'Early access to new features',
    'Custom booking page',
    'Save $30 per year',
  ],
};

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`w-4 h-4 flex-shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
  </svg>
);

const PricingSection: React.FC<PricingSectionProps> = ({ onGoToSignUp }) => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="py-24 px-6 bg-white/[0.015]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400 mb-3">Pricing</p>
          <h2 id="pricing-heading" className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
            Simple Pricing. No Surprises.
          </h2>
          <p className="text-slate-400 text-lg">Start with a free month. Pick a plan. Cancel anytime.</p>
        </motion.div>

        {/* Toggle */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center bg-slate-800/60 border border-white/8 rounded-full p-1 gap-1">
            {(['monthly', 'yearly'] as const).map(plan => (
              <button
                key={plan}
                onClick={() => setBilling(plan)}
                className={`relative px-6 py-2.5 rounded-full text-sm font-black transition-all capitalize ${
                  billing === plan ? 'text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                aria-pressed={billing === plan}
              >
                {billing === plan && (
                  <motion.div
                    layoutId="billing-pill"
                    className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {plan}
                  {plan === 'yearly' && (
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                      billing === 'yearly'
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      Save $30
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Monthly card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`relative bg-slate-800/30 backdrop-blur border rounded-3xl p-8 flex flex-col transition-all duration-300 ${
              billing === 'monthly'
                ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                : 'border-white/8'
            }`}
          >
            <div className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Monthly</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-black text-white">$15</span>
                <span className="text-slate-500 font-bold">/month</span>
              </div>
              <p className="text-emerald-400 text-sm font-bold">+ 1 Month Free Trial</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {features.monthly.map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckIcon className="text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={onGoToSignUp}
              className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-black transition-colors"
              aria-label="Start monthly free trial"
            >
              Start Free Trial
            </button>
          </motion.div>

          {/* Yearly card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className={`relative bg-gradient-to-b from-amber-500/8 to-transparent backdrop-blur border-2 rounded-3xl p-8 flex flex-col transition-all duration-300 ${
              billing === 'yearly'
                ? 'border-amber-500/50 shadow-xl shadow-amber-500/10'
                : 'border-amber-500/20'
            }`}
          >
            {/* Best value badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 px-5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg shadow-amber-500/30">
              Best Value · Save $30 · Just $12.50/mo
            </div>

            <div className="mb-6 mt-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-400 mb-4">Yearly</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-black text-white">$150</span>
                <span className="text-slate-500 font-bold">/year</span>
              </div>
              <p className="text-emerald-400 text-sm font-bold">+ 1 Month Free Trial</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {features.yearly.map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckIcon className="text-amber-500" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={onGoToSignUp}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-2xl font-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all"
              aria-label="Start yearly free trial — best value"
            >
              Start Free Trial →
            </button>
          </motion.div>
        </div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center text-slate-600 text-xs font-semibold mt-6 flex items-center justify-center gap-3"
        >
          <span>🔒 Secured by Stripe</span>
          <span>·</span>
          <span>Cancel anytime</span>
          <span>·</span>
          <span>No hidden fees</span>
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
