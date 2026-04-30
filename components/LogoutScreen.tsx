
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogoutScreenProps {
  userName: string;
  shopName: string;
  onDone: () => void; // called after countdown or manual click
}

const LogoutScreen: React.FC<LogoutScreenProps> = ({ userName, shopName, onDone }) => {
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (countdown <= 0) {
      onDone();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onDone]);

  const hour = new Date().getHours();
  const farewell =
    hour >= 5 && hour < 12 ? 'Have a great morning!' :
    hour >= 12 && hour < 17 ? 'Have a great afternoon!' :
    hour >= 17 && hour < 21 ? 'Have a great evening!' :
    'Rest well tonight!';

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px]" />
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-emerald-600/15 rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 max-w-md w-full text-center"
      >
        {/* Animated check circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30"
        >
          <motion.svg
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5, ease: 'easeInOut' }}
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            />
          </motion.svg>
        </motion.div>

        {/* Text content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="space-y-3 mb-8"
        >
          <h1 className="text-4xl font-black text-white tracking-tight">
            Session Ended
          </h1>
          <p className="text-slate-400 text-lg">
            {farewell}
          </p>
          {userName && (
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-5 py-2 mt-2">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white text-[10px] font-black">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-300 text-sm font-bold">{userName}</span>
              <span className="text-slate-600 text-sm">·</span>
              <span className="text-slate-500 text-sm">{shopName}</span>
            </div>
          )}
        </motion.div>

        {/* Security notice */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-4 mb-8"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">Signed out securely</p>
              <p className="text-slate-500 text-xs mt-0.5">Your session data has been cleared from this device.</p>
            </div>
          </div>
        </motion.div>

        {/* Countdown + button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="space-y-3"
        >
          <button
            onClick={onDone}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black py-4 rounded-xl text-sm shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
            Back to Home
          </button>
          <p className="text-slate-600 text-xs">
            Redirecting automatically in {countdown}s...
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LogoutScreen;
