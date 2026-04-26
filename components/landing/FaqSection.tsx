import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    q: 'Is there really no credit card required?',
    a: 'Correct. Your first full month is completely free — no payment info needed. At the end of your trial, you simply choose a plan to continue.',
  },
  {
    q: 'What happens when the trial ends?',
    a: 'You choose a plan (Monthly or Yearly) to keep going. If you do nothing, your account is paused — but your data is never deleted. You can reactivate anytime.',
  },
  {
    q: 'Can I use TrimTime on my phone?',
    a: 'Absolutely. TrimTime is a Progressive Web App (PWA). Install it on any iPhone or Android device straight from the browser — no app store needed. It even works offline.',
  },
  {
    q: 'Is my sales and customer data secure?',
    a: "Yes. All data is encrypted at rest and in transit. We use Supabase with Row-Level Security, which means your business data is completely isolated and inaccessible to other users.",
  },
  {
    q: 'How many staff members can I add?',
    a: 'Unlimited on all plans. Add as many barbers, stylists, and staff as your shop needs — at no extra cost.',
  },
  {
    q: 'Can I cancel at any time?',
    a: "Yes. No contracts, no cancellation fees, no awkward conversations. Cancel directly from your account settings in 10 seconds. You'll keep access until your billing period ends.",
  },
];

const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-heading" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400 mb-3">Got Questions?</p>
          <h2 id="faq-heading" className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
            Frequently Asked
          </h2>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`border rounded-2xl overflow-hidden transition-colors ${
                  isOpen ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/8 bg-slate-800/20'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className={`text-sm font-bold transition-colors ${isOpen ? 'text-amber-400' : 'text-white'}`}>
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className={`ml-4 flex-shrink-0 transition-colors ${isOpen ? 'text-amber-400' : 'text-slate-500'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-5">
                        <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Contact nudge */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-slate-600 text-sm mt-10"
        >
          Still have questions?{' '}
          <a
            href="mailto:support@trimtimepos.com"
            className="text-amber-400 font-bold hover:text-amber-300 transition-colors underline underline-offset-4"
          >
            Email our support team →
          </a>
        </motion.p>
      </div>
    </section>
  );
};

export default FaqSection;
