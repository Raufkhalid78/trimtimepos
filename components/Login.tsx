
import React, { useState } from 'react';
import { Staff, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyPassword } from '../services/passwordService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

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
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const { sessionLanguage, setSessionLanguage } = useAuth();
  const t = TRANSLATIONS[sessionLanguage] || TRANSLATIONS.en;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const potentialUsers = staffList.filter(s => s.username === username);
    let matchedUser: Staff | null = null;

    try {
      for (const user of potentialUsers) {
        const { data, error } = await supabase
          .from('staff')
          .select('password')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching password hash:', error);
          continue;
        }

        if (data && await verifyPassword(password, data.password || '')) {
          matchedUser = user;
          break;
        }
      }

      if (matchedUser) {
        onLogin(matchedUser, rememberMe);
      } else {
        setError(t.invalidLogin);
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(t.invalidLogin);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setIsLoading(false);
    }
  };

  const getAdminContact = () => staffList.find(s => s.role === 'admin');

  const shopInitial = (shopName || 'T').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#080c14] flex overflow-hidden relative">
      {/* Language Selector Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <select
          value={sessionLanguage}
          onChange={(e) => setSessionLanguage(e.target.value as Language)}
          className="bg-slate-800/80 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 outline-none cursor-pointer hover:bg-slate-700/80 transition-colors"
        >
          <option value="en">English</option>
          <option value="ur">اردو (Urdu)</option>
          <option value="ar">العربية (Arabic)</option>
          <option value="hi">हिन्दी (Hindi)</option>
        </select>
      </div>
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Left Branding Panel — desktop only */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative z-10"
      >
        {/* Top logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center font-brand text-lg text-white shadow-lg shadow-indigo-500/30">
            {shopInitial}
          </div>
          <span className="text-white font-black text-lg tracking-tight">{shopName || 'TrimTime'}</span>
        </div>

        {/* Centre content */}
        <div className="space-y-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">{t.staffPortal}</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight leading-tight font-brand">
              {t.welcomeBackStaff.split(' ')[0]}<br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                {t.welcomeBackStaff.split(' ').slice(1).join(' ')}
              </span>
            </h1>
            <p className="text-slate-400 text-lg mt-4 leading-relaxed">
              {t.signInStartShift}
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-3"
          >
            {[
              { icon: '⚡', text: t.fastPosCheckout },
              { icon: '📅', text: t.appointmentManagement },
              { icon: '💰', text: t.trackCommissions },
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-400">
                <span className="text-lg">{feat.icon}</span>
                <span className="text-sm font-medium">{feat.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom tagline */}
        <div>
          <p className="text-slate-600 text-xs">
            {t.sessionSecuredBcrypt}
          </p>
        </div>
      </motion.div>

      {/* Right Form Panel */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="flex-1 flex items-center justify-center p-6 relative z-10"
      >
        <div className="w-full max-w-md">
          {/* Mobile-only logo */}
          <div className="lg:hidden text-center mb-10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[1.75rem] flex items-center justify-center font-brand text-4xl text-white mx-auto mb-5 shadow-2xl shadow-indigo-500/40"
            >
              {shopInitial}
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tight font-brand">{shopName || 'TrimTime'}</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">{t.staffPortal}</p>
          </div>

          {/* Desktop greeting */}
          <div className="hidden lg:block mb-10" style={{ textAlign: sessionLanguage === 'ur' ? 'right' : 'left' }}>
            <h2 className="text-3xl font-black text-white tracking-tight">{t.staffSignInTitle}</h2>
            <p className="text-slate-500 mt-1 text-sm">{t.enterCredentialsStartShift}</p>
          </div>

          {/* Form card */}
          <motion.div
            animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/8 p-8 rounded-[2rem] shadow-2xl"
          >
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="username" className={`text-[10px] font-black text-slate-400 uppercase tracking-widest block ${sessionLanguage === 'ur' ? 'text-right' : ''}`}>
                  {t.usernameLabel}
                </label>
                <div className="relative">
                  <svg className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-500 ${sessionLanguage === 'ur' ? 'right-4' : 'left-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    placeholder="your.username"
                    autoComplete="username"
                    className={`w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-medium text-sm ${sessionLanguage === 'ur' ? 'pr-11 text-right' : 'pl-11'}`}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className={`text-[10px] font-black text-slate-400 uppercase tracking-widest block ${sessionLanguage === 'ur' ? 'text-right' : ''}`}>
                  {t.passwordLabel}
                </label>
                <div className="relative">
                  <svg className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-500 ${sessionLanguage === 'ur' ? 'right-4' : 'left-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-medium text-sm ${sessionLanguage === 'ur' ? 'pr-11 pl-12 text-right' : 'pl-11 pr-12'}`}
                    required
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors ${sessionLanguage === 'ur' ? 'left-4' : 'right-4'}`}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-3">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/5 checked:bg-indigo-500 checked:border-indigo-500 transition-all"
                  />
                  <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <label htmlFor="rememberMe" className="text-xs font-medium text-slate-400 cursor-pointer select-none hover:text-slate-200 transition-colors">
                  {t.stayLoggedInStaff}
                </label>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold py-3 px-4 rounded-xl"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black text-sm py-4 rounded-xl shadow-xl shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    {t.enterDashboardStaff}
                    <svg className={`w-4 h-4 ${sessionLanguage === 'ur' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="h-px bg-white/8 flex-1" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{t.orText}</span>
              <div className="h-px bg-white/8 flex-1" />
            </div>

            {/* Contact Admin */}
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="w-full py-3 rounded-xl border border-white/8 text-slate-400 hover:text-slate-200 hover:border-white/20 text-xs font-bold uppercase tracking-widest transition-all"
            >
              {t.cantAccessContactAdmin}
            </button>
          </motion.div>

          {/* Back to home */}
          {onGoToLanding && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              type="button"
              onClick={onGoToLanding}
              className="w-full mt-6 text-slate-600 text-sm font-bold hover:text-slate-400 transition-colors flex items-center justify-center gap-2"
            >
              <svg className={`w-4 h-4 ${sessionLanguage === 'ur' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
              {t.backToHome}
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Admin Contact Modal */}
      <AnimatePresence>
        {showContactModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#111827] border border-white/10 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <button
                onClick={() => setShowContactModal(false)}
                className="absolute top-5 right-5 text-slate-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-2xl mb-5 mx-auto">
                <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>

              <h3 className="text-lg font-black text-white text-center mb-1">{t.systemAdministrator}</h3>
              <p className="text-slate-400 text-center text-sm mb-6">
                {t.contactAdminToReset}
              </p>

              <div className="bg-white/5 border border-white/8 rounded-2xl p-4 text-center">
                {getAdminContact() ? (
                  <>
                    <p className="text-white font-bold">{getAdminContact()?.name}</p>
                    <p className="text-indigo-400 text-sm mt-1 font-medium">{getAdminContact()?.email || t.noEmailConfigured}</p>
                  </>
                ) : (
                  <p className="text-slate-400 italic text-sm">{t.noAdminFound}</p>
                )}
              </div>

              <button
                onClick={() => setShowContactModal(false)}
                className="w-full mt-5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {t.closeButton}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
