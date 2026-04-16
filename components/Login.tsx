
import React, { useState } from 'react';
import { Staff, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyPassword } from '../services/passwordService';
interface LoginProps {
  onLogin: (user: Staff, rememberMe: boolean) => void;
  staffList: Staff[];
  shopName: string;
  onGoToSignUp?: () => void;
  onGoToLanding?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, staffList, shopName, onGoToSignUp, onGoToLanding }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);

  // Default to English for login screen
  const language: Language = 'en';
  const t = TRANSLATIONS[language];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const potentialUsers = staffList.filter(s => s.username === username);
    let matchedUser: Staff | null = null;
    
    for (const user of potentialUsers) {
      if (await verifyPassword(password, user.password || '')) {
        matchedUser = user;
        break;
      }
    }
    
    if (matchedUser) {
      onLogin(matchedUser, rememberMe);
    } else {
      setError(t.invalidLogin);
    }
  };

  const getAdminContact = () => {
    return staffList.find(s => s.role === 'admin');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.1 }}
            className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2.5rem] flex items-center justify-center font-brand text-5xl text-slate-950 mx-auto mb-8 shadow-2xl shadow-amber-500/40"
          >
            {(shopName || 'T').charAt(0)}
          </motion.div>
          <h1 className="text-5xl font-extrabold font-brand text-white tracking-tighter mb-3">{shopName || 'TrimTime'}</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">{t.premiumAccess}</p>
        </div>

        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-2xl"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">{t.terminalIdentity}</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Terminal Identity (e.g. user)"
                autoComplete="off"
                className="w-full bg-slate-800/30 border border-slate-700/50 text-white rounded-2xl px-6 py-4 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-medium"
                required
              />
            </div>

            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">{t.securityKey}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Security Key"
                  autoComplete="current-password"
                  className="w-full bg-slate-800/30 border border-slate-700/50 text-white rounded-2xl px-6 py-4 pr-12 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-2">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-700 bg-slate-800/50 checked:bg-amber-500 checked:border-amber-500 transition-all"
                />
                <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-950 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <label htmlFor="rememberMe" className="text-xs font-bold text-slate-400 uppercase tracking-wide cursor-pointer select-none hover:text-slate-200 transition-colors">
                {t.stayLoggedIn}
              </label>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-black uppercase tracking-wider py-3 px-4 rounded-xl text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-xl py-5 rounded-[1.5rem] shadow-xl shadow-amber-500/10 transition-all hover:shadow-amber-500/30 mt-4"
            >
              {t.enterDashboard}
            </motion.button>
          </form>

          <div className="flex items-center justify-between mt-10">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4 whitespace-nowrap">{t.authorizedUse}</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>
        </motion.div>

        <div className="flex flex-col items-center gap-3 mt-8">
          <p className="text-slate-500 text-sm font-medium">
            Issues accessing?{' '}
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="ml-1 text-amber-500 font-bold cursor-pointer hover:underline underline-offset-4 decoration-2 bg-transparent border-none p-0 outline-none"
            >
              {t.contactAdmin}
            </button>
          </p>

          {onGoToLanding && (
            <button
              type="button"
              onClick={onGoToLanding}
              className="text-slate-600 text-sm font-bold hover:text-slate-400 transition-colors bg-transparent border-none p-0 outline-none cursor-pointer"
            >
              ← Back to Home
            </button>
          )}
        </div>
      </motion.div>

      {/* Admin Contact Modal */}
      <AnimatePresence>
        {showContactModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowContactModal(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center text-3xl mb-6 mx-auto">
                ℹ️
              </div>

              <h3 className="text-xl font-bold text-white text-center mb-2">System Administrator</h3>
              <p className="text-slate-400 text-center text-sm mb-6">
                Please contact the administrator below to reset your password or unlock your account.
              </p>

              <div className="bg-slate-800/50 rounded-2xl p-4 text-center border border-slate-700">
                {getAdminContact() ? (
                  <>
                    <p className="text-white font-bold text-lg mb-1">{getAdminContact()?.name}</p>
                    <p className="text-amber-500 font-medium">{getAdminContact()?.email || 'No email configured'}</p>
                  </>
                ) : (
                  <p className="text-slate-300 italic">No administrator account found.</p>
                )}
              </div>

              <button
                onClick={() => setShowContactModal(false)}
                className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
