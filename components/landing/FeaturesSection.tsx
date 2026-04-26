import React from 'react';
import { motion } from 'framer-motion';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const icons = {
  pos: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  finance: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  inventory: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  staff: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  crm: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  pwa: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
};

// ── Mini POS UI (for the featured card) ──────────────────────────────────────
const MiniPOSUI: React.FC = () => (
  <div className="mt-5 bg-slate-950/60 border border-white/5 rounded-xl p-4 space-y-2.5">
    <div className="flex items-center justify-between mb-1">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Sale</p>
      <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">3 items</span>
    </div>
    {[
      { name: 'Haircut', price: '$25' },
      { name: 'Beard Trim', price: '$10' },
      { name: 'Hair Wash', price: '$8' },
    ].map((item, i) => (
      <div key={i} className="flex justify-between items-center">
        <span className="text-xs text-slate-300">{item.name}</span>
        <span className="text-xs font-bold text-white">{item.price}</span>
      </div>
    ))}
    <div className="border-t border-white/5 pt-2 flex justify-between items-center">
      <span className="text-xs font-black text-white uppercase tracking-wide">Total</span>
      <span className="text-base font-black text-amber-400">$43.00</span>
    </div>
    <button className="w-full py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-black tracking-wide">
      Complete Sale → WhatsApp Receipt
    </button>
  </div>
);

// ── Feature data ──────────────────────────────────────────────────────────────
const features = [
  {
    id: 'pos',
    icon: icons.pos,
    title: 'POS Terminal',
    desc: 'Checkout in seconds. Barcode scan, split pay, and instant WhatsApp receipts sent automatically.',
    tag: 'Core',
    featured: true, // spans 2 cols
    color: 'amber',
  },
  {
    id: 'finance',
    icon: icons.finance,
    title: 'AI Finance Reports',
    desc: 'Profit, loss, staff commissions — explained in plain English by AI. No accountant needed.',
    tag: 'AI-Powered',
    featured: false,
    color: 'indigo',
  },
  {
    id: 'inventory',
    icon: icons.inventory,
    title: 'Inventory Management',
    desc: 'Track every product. Get low-stock alerts before you run out. Manage suppliers in one place.',
    tag: 'Automated',
    featured: false,
    color: 'emerald',
  },
  {
    id: 'staff',
    icon: icons.staff,
    title: 'Staff Management',
    desc: 'Role-based logins, commission tracking, and advance payment management for your whole team.',
    tag: 'Team Ready',
    featured: false,
    color: 'violet',
  },
  {
    id: 'crm',
    icon: icons.crm,
    title: 'Customer CRM',
    desc: 'Loyalty points, full visit history, and personal preferences — all searchable in seconds.',
    tag: 'Loyalty',
    featured: false,
    color: 'rose',
  },
  {
    id: 'pwa',
    icon: icons.pwa,
    title: 'Mobile PWA',
    desc: 'Installs like a native app on iOS & Android. Works fully offline. No app store required.',
    tag: 'Mobile First',
    featured: false,
    color: 'sky',
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  text: 'text-amber-400',  icon: 'bg-amber-500/15 text-amber-400' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', icon: 'bg-indigo-500/15 text-indigo-400' },
  emerald:{ bg: 'bg-emerald-500/10',border: 'border-emerald-500/20',text: 'text-emerald-400',icon: 'bg-emerald-500/15 text-emerald-400' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', icon: 'bg-violet-500/15 text-violet-400' },
  rose:   { bg: 'bg-rose-500/10',   border: 'border-rose-500/20',   text: 'text-rose-400',   icon: 'bg-rose-500/15 text-rose-400' },
  sky:    { bg: 'bg-sky-500/10',    border: 'border-sky-500/20',    text: 'text-sky-400',    icon: 'bg-sky-500/15 text-sky-400' },
};

// ── Features Section ──────────────────────────────────────────────────────────
const FeaturesSection: React.FC = () => {
  const [pos, ...rest] = features;
  const posColors = colorMap[pos.color];

  return (
    <section id="features" aria-labelledby="features-heading" className="py-24 px-6 bg-white/[0.015]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400 mb-3">Everything Included</p>
          <h2 id="features-heading" className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
            One Platform. Every Tool You Need.
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Built exclusively for barbers and beauty pros. Not a generic tool shoehorned for salons.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Featured: POS — spans 2 cols */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`md:col-span-2 relative group bg-slate-800/30 backdrop-blur border ${posColors.border} p-8 rounded-3xl hover:bg-slate-800/50 transition-all overflow-hidden`}
          >
            <div className={`absolute inset-0 ${posColors.bg} opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl`} />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-12 h-12 rounded-2xl ${posColors.icon} flex items-center justify-center`}>
                  {pos.icon}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${posColors.bg} ${posColors.text} border ${posColors.border}`}>
                  {pos.tag}
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mt-4 mb-2 group-hover:text-amber-400 transition-colors">{pos.title}</h3>
              <p className="text-slate-400 leading-relaxed max-w-md">{pos.desc}</p>
              <MiniPOSUI />
            </div>
          </motion.div>

          {/* Finance */}
          {rest.slice(0, 1).map((f, i) => {
            const c = colorMap[f.color];
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className={`relative group bg-slate-800/30 backdrop-blur border ${c.border} p-7 rounded-3xl hover:bg-slate-800/50 transition-all overflow-hidden`}
              >
                <div className={`absolute inset-0 ${c.bg} opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl`} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center`}>{f.icon}</div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${c.bg} ${c.text} border ${c.border}`}>{f.tag}</span>
                  </div>
                  <h3 className={`text-xl font-black text-white mb-2 group-hover:${c.text} transition-colors`}>{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}

          {/* Bottom 4 cards — each 1 col */}
          {rest.slice(1).map((f, i) => {
            const c = colorMap[f.color];
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i + 2) * 0.08, duration: 0.5 }}
                className={`relative group bg-slate-800/30 backdrop-blur border ${c.border} p-7 rounded-3xl hover:bg-slate-800/50 transition-all overflow-hidden`}
              >
                <div className={`absolute inset-0 ${c.bg} opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl`} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center`}>{f.icon}</div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${c.bg} ${c.text} border ${c.border}`}>{f.tag}</span>
                  </div>
                  <h3 className={`text-xl font-black text-white mb-2 group-hover:${c.text} transition-colors`}>{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
