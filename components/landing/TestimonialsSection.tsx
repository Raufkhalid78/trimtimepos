import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "We cut our end-of-day accounting time from 45 minutes to zero. The AI reports are unbelievable — it tells us exactly where we're making money.",
    name: 'Ahmed K.',
    role: 'Owner',
    shop: 'Elite Barbers',
    initial: 'A',
    color: 'amber',
  },
  {
    quote: "Finally a POS that doesn't feel like it was built for a grocery store. It's made for us — the booking page, the receipts, the WhatsApp integration. Perfect.",
    name: 'Sana M.',
    role: 'Manager',
    shop: 'Glow Beauty Studio',
    initial: 'S',
    color: 'rose',
  },
  {
    quote: "The WhatsApp receipt feature alone is worth the subscription. My clients love getting a professional receipt instantly. It makes us look so polished.",
    name: 'Usman R.',
    role: 'Owner',
    shop: 'The Cut Lab',
    initial: 'U',
    color: 'emerald',
  },
];

const StarRating: React.FC = () => (
  <div className="flex items-center gap-0.5 mb-5">
    {[...Array(5)].map((_, i) => (
      <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const colorInitialMap: Record<string, string> = {
  amber:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  rose:    'bg-rose-500/20 text-rose-400 border-rose-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const TestimonialsSection: React.FC = () => {
  return (
    <section aria-labelledby="testimonials-heading" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400 mb-3">Customer Stories</p>
          <h2 id="testimonials-heading" className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
            Loved by Grooming Professionals
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Real businesses. Real results. See what TrimTime has done for salons like yours.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => {
            const initClass = colorInitialMap[t.color] ?? colorInitialMap.amber;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="bg-slate-800/30 backdrop-blur border border-white/8 p-8 rounded-3xl flex flex-col hover:border-white/15 transition-all"
              >
                <StarRating />
                <blockquote className="text-slate-300 text-sm leading-relaxed flex-1 mb-8">
                  "{t.quote}"
                </blockquote>
                <div className="flex items-center gap-3 pt-5 border-t border-white/5">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm ${initClass}`}>
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{t.name}</p>
                    <p className="text-[11px] text-slate-500">{t.role} · {t.shop}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust badges row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center items-center gap-8 mt-14"
        >
          {[
            { icon: '🔒', text: 'SSL Encrypted' },
            { icon: '☁️', text: 'Supabase Cloud' },
            { icon: '📱', text: 'PWA Ready' },
            { icon: '🛡️', text: 'Row-Level Security' },
          ].map(badge => (
            <div key={badge.text} className="flex items-center gap-2 text-slate-600">
              <span className="text-lg">{badge.icon}</span>
              <span className="text-xs font-black uppercase tracking-widest">{badge.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
