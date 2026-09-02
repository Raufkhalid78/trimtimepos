import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface HeroSectionProps {
  onGoToSignUp: () => void;
  onGoToLogin: () => void;
}

// ── Dashboard Mockup ──────────────────────────────────────────────────────────
const DashboardMockup: React.FC = () => {
  const bars = [42, 58, 51, 75, 68, 84, 78, 100];
  const recentSales = [
    { name: 'Ahmed K.', service: 'Haircut + Beard', amount: '$35', time: '2m ago' },
    { name: 'Sara M.', service: 'Facial Treatment', amount: '$55', time: '18m ago' },
    { name: 'Omar R.', service: 'Hot Shave', amount: '$20', time: '45m ago' },
  ];

  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
      {/* Ambient glow */}
      <div className="absolute -inset-4 bg-amber-500/10 blur-3xl rounded-3xl" />

      {/* Card */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center text-slate-950 font-black text-xs">T</div>
            <span className="text-sm font-bold text-white">TrimTime Dashboard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
          {[
            { label: "Today's Revenue", value: '$2,840', change: '+12%', up: true },
            { label: 'Appointments', value: '12', change: '3 pending', up: true },
            { label: 'Active Staff', value: '4', change: 'All present', up: true },
          ].map((stat, i) => (
            <div key={i} className="px-4 py-3 bg-slate-900/50">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">{stat.label}</p>
              <p className="text-base font-black text-white leading-none">{stat.value}</p>
              <p className={`text-[10px] font-bold mt-1 ${stat.up ? 'text-emerald-400' : 'text-rose-400'}`}>{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Mini bar chart */}
        <div className="px-5 py-4 border-b border-white/5">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Weekly Revenue</p>
          <div className="flex items-end gap-[3px] h-10">
            {bars.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-all ${i === bars.length - 1 ? 'bg-amber-500' : 'bg-slate-700'}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S', 'T'].map((d, i) => (
              <span key={i} className="flex-1 text-center text-[8px] text-slate-600 font-bold">{d}</span>
            ))}
          </div>
        </div>

        {/* Recent sales */}
        <div className="px-5 py-4">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Recent Sales</p>
          <div className="space-y-2.5">
            {recentSales.map((sale, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-slate-800 border border-white/5 rounded-lg flex items-center justify-center text-xs font-black text-amber-400">
                    {(sale.name || 'S').charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none">{sale.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{sale.service}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-white">{sale.amount}</p>
                  <p className="text-[10px] text-slate-600">{sale.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating badge: AI insight */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9 }}
        className="absolute -bottom-5 -left-5 bg-slate-800/95 backdrop-blur-xl border border-amber-500/30 rounded-xl px-3.5 py-2.5 shadow-2xl"
      >
        <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">AI Insight ✨</p>
        <p className="text-xs font-bold text-white mt-0.5">Revenue up 23% this week</p>
      </motion.div>

      {/* Floating badge: WhatsApp receipt */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1 }}
        className="absolute -top-5 -right-5 bg-slate-800/95 backdrop-blur-xl border border-emerald-500/30 rounded-xl px-3.5 py-2.5 shadow-2xl"
      >
        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Receipt Sent ✓</p>
        <p className="text-xs font-bold text-white mt-0.5">WhatsApp · Ahmed K.</p>
      </motion.div>
    </div>
  );
};

// ── Hero Section ──────────────────────────────────────────────────────────────
const HeroSection: React.FC<HeroSectionProps> = ({ onGoToSignUp, onGoToLogin }) => {
  return (
    <section
      id="hero"
      aria-labelledby="hero-headline"
      className="relative pt-28 pb-16 px-6 md:pt-36 md:pb-24 overflow-hidden"
    >
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-amber-500/6 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-500/6 blur-[140px] rounded-full pointer-events-none" />
      {/* Dot grid */}
      <div className="landing-grid-bg absolute inset-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ── LEFT: Copy ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              1 Month Free Trial · No Credit Card Required
            </div>

            {/* H1 */}
            <h1
              id="hero-headline"
              className="text-4xl md:text-5xl xl:text-[3.5rem] font-black tracking-tight leading-[1.08] mb-6 text-white"
            >
              Run Your Barber Shop.{' '}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                Not Spreadsheets.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-8 max-w-lg">
              TrimTime replaces 5 separate tools with one affordable platform.
              More time cutting. Less time on admin.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-7">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/signup"
                  className="px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-2xl text-base font-black shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/45 transition-all text-center inline-block w-full sm:w-auto"
                  aria-label="Start your free trial — no credit card required"
                >
                  Start Free — No Card Needed →
                </Link>
              </motion.div>
              <Link
                to="/login"
                className="px-8 py-4 bg-slate-800/60 border border-slate-700/50 text-slate-300 rounded-2xl text-base font-bold hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all text-center inline-block"
                aria-label="Sign in to your existing TrimTime account"
              >
                Sign In to Dashboard
              </Link>
            </div>

            {/* Trust micro-copy */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {['Free setup', 'Cancel anytime', 'Your data stays yours'].map(item => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          {/* ── RIGHT: Dashboard Mockup ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="hidden lg:flex justify-center lg:justify-end pt-8"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
