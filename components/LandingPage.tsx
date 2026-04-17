import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface LandingPageProps {
  onGoToSignUp: () => void;
  onGoToLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGoToSignUp, onGoToLogin }) => {

  const features = [
    { icon: '💳', title: 'POS Terminal', desc: 'Fast checkout with barcode scanning, split payments, and instant receipts.' },
    { icon: '📊', title: 'Finance & Reports', desc: 'Profit/loss tracking, commission reports, and AI-powered business insights.' },
    { icon: '📦', title: 'Inventory Management', desc: 'Track stock levels, suppliers, low-stock alerts, and product costs.' },
    { icon: '👥', title: 'Staff Management', desc: 'Role-based access, commission tracking, and advance payment management.' },
    { icon: '💎', title: 'Customer CRM', desc: 'Loyalty programs, visit history, preferences, and WhatsApp receipts.' },
    { icon: '📱', title: 'Mobile PWA', desc: 'Install on any device. Works offline. Looks like a native app.' },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">


      {/* ========== NAVBAR ========== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">T</div>
            <span className="text-xl font-black tracking-tight">TrimTime</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onGoToLogin} className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors">
              Log In
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onGoToSignUp}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-xl text-sm font-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-shadow"
            >
              Start Free Trial
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="relative pt-32 pb-20 px-6 md:pt-44 md:pb-32 overflow-hidden">
        {/* Glows */}
        <div className="absolute top-[-20%] right-[-15%] w-[60%] h-[60%] bg-amber-500/8 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-15%] w-[50%] h-[50%] bg-indigo-500/8 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
              1 Month Free Trial • No Credit Card Required
            </div>

            <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
              The Ultimate POS for{' '}
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                Barbers & Beauty Salons
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Manage your entire business from one powerful platform. POS, finances, inventory, staff, and customers — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onGoToSignUp}
                className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-2xl text-lg font-black shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/40 transition-all"
              >
                Get Started Free →
              </motion.button>
              <button
                onClick={onGoToLogin}
                className="w-full sm:w-auto px-10 py-5 bg-slate-800/50 border border-slate-700/50 text-white rounded-2xl text-lg font-bold hover:bg-slate-800 transition-colors"
              >
                I Have an Account
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Everything You Need to Run Your Business</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">One subscription. All the tools. No bloat.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-slate-800/30 backdrop-blur border border-slate-700/30 p-8 rounded-3xl hover:border-amber-500/20 transition-all group"
              >
                <div className="text-4xl mb-5">{f.icon}</div>
                <h3 className="text-xl font-black mb-2 group-hover:text-amber-400 transition-colors">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section className="py-20 px-6" id="pricing">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 text-lg">Start with a free month. Cancel anytime.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Monthly */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-slate-800/30 backdrop-blur border border-slate-700/30 p-8 rounded-3xl relative"
            >
              <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-6">Monthly</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-black">$20</span>
                <span className="text-slate-500 font-bold">/month</span>
              </div>
              <p className="text-emerald-400 text-sm font-bold mb-8">+ 1 Month Free Trial</p>
              <ul className="space-y-3 mb-8">
                {['Unlimited transactions', 'All POS features', 'Staff management', 'Inventory tracking', 'AI business insights', 'Customer CRM & loyalty'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={onGoToSignUp} className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-black transition-colors">
                Start Free Trial
              </button>
            </motion.div>

            {/* Yearly */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-b from-amber-500/5 to-amber-500/0 backdrop-blur border-2 border-amber-500/30 p-8 rounded-3xl relative"
            >
              <div className="absolute -top-3 right-6 bg-amber-500 text-slate-950 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                Save $40
              </div>
              <h3 className="text-lg font-black text-amber-400 uppercase tracking-widest mb-6">Yearly</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-black">$200</span>
                <span className="text-slate-500 font-bold">/year</span>
              </div>
              <p className="text-emerald-400 text-sm font-bold mb-8">+ 1 Month Free Trial</p>
              <ul className="space-y-3 mb-8">
                {['Everything in Monthly', 'Save $40 per year', 'Priority support', 'Early access to features', 'Unlimited staff members', 'Advanced analytics'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={onGoToSignUp} className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-2xl font-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all">
                Start Free Trial
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-12 md:p-16 rounded-[3rem]">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to Transform Your Business?</h2>
            <p className="text-slate-400 mb-8 text-lg">Join thousands of barbers and beauty professionals using TrimTime.</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onGoToSignUp}
              className="px-12 py-5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-2xl text-lg font-black shadow-2xl shadow-amber-500/20"
            >
              Start Your Free Month →
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-slate-950 font-black text-sm">T</div>
                <span className="font-bold text-xl tracking-tight">TrimTime</span>
              </div>
              <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                The most advanced business management platform for grooming professionals. Built to help you scale your business with ease.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Product</h3>

              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-amber-500 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-amber-500 transition-colors">Pricing</a></li>
                <li><button onClick={onGoToLogin} className="hover:text-amber-500 transition-colors">Business Login</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Legal</h3>

              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-amber-500 transition-colors">Terms of Service</Link></li>
                <li><a href="mailto:support@trimtimepos.com" className="hover:text-amber-500 transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-600 tracking-widest uppercase">TrimTime © {new Date().getFullYear()} • All Rights Reserved</span>
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Secure Cloud POS</span>
            </div>
          </div>
        </div>
      </footer>
    </main>

  );
};

export default LandingPage;
