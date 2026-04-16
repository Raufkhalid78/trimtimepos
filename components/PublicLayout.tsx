import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-amber-500/30">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-500/10 blur-[120px] rounded-full opacity-50"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full opacity-50"></div>
      </div>

      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center font-brand text-2xl text-slate-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              T
            </div>
            <span className="text-xl font-black font-brand tracking-tighter text-white">TrimTime</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
              Business Login
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
          <div className="w-8 h-8 bg-slate-900 border border-white/5 rounded-lg flex items-center justify-center font-brand text-sm text-amber-500">
            T
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            Powered by <span className="text-white">TrimTime</span> SaaS
          </p>
          <div className="flex gap-6 mt-2">
            <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors text-[10px] font-black uppercase tracking-widest">Privacy</a>
            <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors text-[10px] font-black uppercase tracking-widest">Terms</a>
            <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors text-[10px] font-black uppercase tracking-widest">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
