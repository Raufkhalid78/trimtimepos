import React from 'react';
import { motion } from 'framer-motion';

interface CtaSectionProps {
  onGoToSignUp: () => void;
}

const CtaSection: React.FC<CtaSectionProps> = ({ onGoToSignUp }) => {
  return (
    <section aria-labelledby="cta-heading" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-amber-500/20 bg-gradient-to-br from-amber-500/8 via-slate-900 to-indigo-500/5 p-12 md:p-20 text-center"
        >
          {/* Glow blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400 mb-4">Limited Time Offer</p>
            <h2 id="cta-heading" className="text-3xl md:text-5xl font-black tracking-tight text-white mb-5">
              Your First Month is{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                On Us.
              </span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Set up in minutes. Cancel any time. No card required to start.
            </p>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={onGoToSignUp}
              className="inline-flex items-center gap-2 px-12 py-5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-2xl text-lg font-black shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
              aria-label="Start your free month — no credit card required"
            >
              Start Your Free Month
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </motion.button>

            {/* Trust chips */}
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 mt-8">
              {[
                '1 month free trial',
                'No contracts',
                'Works on all devices',
                'Cancel anytime',
              ].map(item => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
