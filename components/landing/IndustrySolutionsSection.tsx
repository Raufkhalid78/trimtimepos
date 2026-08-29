import React from 'react';
import { motion } from 'framer-motion';

const industryProfiles = [
  {
    title: 'Barber Shops',
    category: 'High-Volume Walk-ins',
    desc: 'Streamline busy chair rotations with ultra-fast POS checkout, split payment methods, and automated commission splits for every barber on your team.',
    highlights: ['Fast POS & split cash/card checkout', 'Per-barber commission & advance ledger', 'Instant digital WhatsApp receipts'],
    color: 'amber',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
      </svg>
    ),
  },
  {
    title: 'Hair & Beauty Salons',
    category: 'Multi-Service Appointments',
    desc: 'Empower stylists with detailed service duration buffers, retail product upselling at checkout, and automated customer loyalty point tracking.',
    highlights: ['Multi-service booking calendar', 'Product inventory & low-stock alerts', 'Built-in customer loyalty & promos'],
    color: 'rose',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    title: 'Nail & Spa Studios',
    category: 'Scheduled Bookings',
    desc: 'Eliminate costly no-shows with self-service client appointment scheduling, optional deposit payments, and automated WhatsApp appointment reminders.',
    highlights: ['24/7 branded online booking link', 'Optional upfront deposit collection', 'Automated 24h & 2h appointment reminders'],
    color: 'emerald',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
};

const IndustrySolutionsSection: React.FC = () => {
  return (
    <section aria-labelledby="industries-heading" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400 mb-3">Industry Solutions</p>
          <h2 id="industries-heading" className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
            Tailored for Your Grooming Business
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Purpose-built workflows engineered specifically for barbershops, hair salons, and beauty studios.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {industryProfiles.map((item, i) => {
            const theme = colorMap[item.color] ?? colorMap.amber;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="bg-slate-800/30 backdrop-blur border border-white/8 p-8 rounded-3xl flex flex-col hover:border-white/15 transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl border ${theme.bg} ${theme.text} ${theme.border} flex items-center justify-center`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${theme.badge}`}>
                    {item.category}
                  </span>
                </div>

                <h3 className="text-xl font-black text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">
                  {item.desc}
                </p>

                <div className="pt-6 border-t border-white/5 space-y-2.5">
                  {item.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                      <svg className={`w-4 h-4 ${theme.text} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{highlight}</span>
                    </div>
                  ))}
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

export default IndustrySolutionsSection;
