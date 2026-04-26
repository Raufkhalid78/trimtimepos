import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Sign Up Free',
    description: 'Create your account in 60 seconds. No credit card, no commitment. Just your email and shop name.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    detail: '60-second setup',
  },
  {
    number: '02',
    title: 'Set Up Your Shop',
    description: 'Add your services, pricing, staff members, and inventory. Our guided setup takes under 10 minutes.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    detail: 'Under 10 min',
  },
  {
    number: '03',
    title: 'Run & Grow',
    description: 'Accept payments, track every sale, and let AI generate your financial reports. Your business, simplified.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    detail: 'AI-powered insights',
  },
];

const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400 mb-3">Simple Onboarding</p>
          <h2 id="how-it-works-heading" className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
            Up and Running in Minutes
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            No training required. No technical setup. Just sign up and go.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-14 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="flex flex-col items-center text-center relative"
              >
                {/* Step circle */}
                <div className="relative mb-8">
                  <div className="w-28 h-28 rounded-full bg-slate-900 border border-white/10 flex flex-col items-center justify-center shadow-xl">
                    <div className="text-amber-400 mb-1">{step.icon}</div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{step.number}</span>
                  </div>
                  {/* Amber glow */}
                  <div className="absolute inset-0 bg-amber-500/10 blur-2xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-3">
                  {step.detail}
                </div>

                <h3 className="text-xl font-black text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
