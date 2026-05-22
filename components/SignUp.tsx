import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { registerUserAccount, loginWithGoogle, RegisterAccountData } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface SignUpProps {
  onBack: () => void;
  onSuccess: () => void | Promise<void>;
}

const SignUp: React.FC<SignUpProps> = ({ onBack, onSuccess }) => {
  const { sessionLanguage, setSessionLanguage } = useAuth();
  const t = TRANSLATIONS[sessionLanguage] || TRANSLATIONS.en;

  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validate = (): boolean => {
    setError('');
    if (!ownerName.trim()) { setError(t.nameRequired); return false; }
    if (!email.trim() || !email.includes('@')) { setError(t.emailRequired); return false; }
    if (password.length < 6) { setError(t.passwordMinLength); return false; }
    if (password !== confirmPassword) { setError(t.passwordsDoNotMatch); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');

    const data: RegisterAccountData = {
      email: email.trim().toLowerCase(),
      password,
      ownerName: ownerName.trim(),
    };

    const result = await registerUserAccount(data);

    if (result.success) {
      setShowSuccess(true);
    } else {
      let errorMsg = result.error || t.registrationFailed;
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        errorMsg = t.networkErrorSupabase;
      }
      setError(errorMsg);
      setLoading(false);
    }
  };

  const cardVariants = {
    enter: { x: 80, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -80, opacity: 0 },
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
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

      {/* Background glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/8 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/8 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-lg w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-slate-950 font-black text-3xl mx-auto mb-4 shadow-2xl shadow-amber-500/30">T</div>
          <h1 className="text-2xl font-black text-white">{t.createAccount}</h1>
          <p className="text-slate-500 text-sm mt-1">{t.getStartedToday}</p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={showSuccess ? 'success' : 'form'}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex-1"
            >
              {showSuccess ? (
                <div className="space-y-8 py-4 text-center">
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white mb-3">{t.checkYourEmail}</h2>
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 text-slate-300 text-sm leading-relaxed space-y-4 shadow-inner" style={{ textAlign: sessionLanguage === 'ur' ? 'right' : 'left' }}>
                      <p>
                        {t.verificationLinkSentTo} <strong className="text-white font-bold">{email}</strong>. 
                      </p>
                      <p className="text-amber-400 font-medium">
                        {t.pleaseVerifyEmail}
                      </p>
                      <p className="text-xs text-slate-500 italic border-t border-slate-700/50 pt-4 mt-4">
                        {t.checkSpamFolder}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onBack}
                    className="w-full py-5 bg-slate-800/50 border border-slate-700 hover:bg-slate-800 text-white rounded-[1.5rem] font-bold text-lg transition-colors"
                  >
                    {t.returnToLogin}
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div style={{ textAlign: sessionLanguage === 'ur' ? 'right' : 'left' }}>
                    <h2 className="text-xl font-black text-white mb-1">{t.accountSetup}</h2>
                    <p className="text-slate-500 text-sm">{t.createLoginCredentials}</p>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black text-slate-500 uppercase tracking-widest block ${sessionLanguage === 'ur' ? 'mr-1 text-right' : 'ml-1'}`}>{t.yourFullName}</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full bg-slate-800/30 border border-slate-700/50 text-white rounded-2xl px-5 py-4 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-medium"
                      dir={sessionLanguage === 'ur' ? 'rtl' : 'ltr'}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black text-slate-500 uppercase tracking-widest block ${sessionLanguage === 'ur' ? 'mr-1 text-right' : 'ml-1'}`}>{t.emailAddress}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-slate-800/30 border border-slate-700/50 text-white rounded-2xl px-5 py-4 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-medium text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black text-slate-500 uppercase tracking-widest block ${sessionLanguage === 'ur' ? 'mr-1 text-right' : 'ml-1'}`}>{t.passwordSignUp}</label>
                    <div className="relative">
                      <input
                        type={showPassword1 ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={t.atLeast6Chars}
                        className={`w-full bg-slate-800/30 border border-slate-700/50 text-white rounded-2xl py-4 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-medium text-left ${sessionLanguage === 'ur' ? 'pl-12 pr-5' : 'pl-5 pr-12'}`}
                        dir="ltr"
                      />
                      <button type="button" onClick={() => setShowPassword1(!showPassword1)} className={`absolute top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors ${sessionLanguage === 'ur' ? 'left-4' : 'right-4'}`}>
                        {showPassword1 ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black text-slate-500 uppercase tracking-widest block ${sessionLanguage === 'ur' ? 'mr-1 text-right' : 'ml-1'}`}>{t.confirmPassword}</label>
                    <div className="relative">
                      <input
                        type={showPassword2 ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder={t.reEnterPassword}
                        className={`w-full bg-slate-800/30 border border-slate-700/50 text-white rounded-2xl py-4 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-medium text-left ${sessionLanguage === 'ur' ? 'pl-12 pr-5' : 'pl-5 pr-12'}`}
                        dir="ltr"
                      />
                      <button type="button" onClick={() => setShowPassword2(!showPassword2)} className={`absolute top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors ${sessionLanguage === 'ur' ? 'left-4' : 'right-4'}`}>
                        {showPassword2 ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-[#080c14] px-4 text-xs font-bold uppercase tracking-widest text-slate-500">{t.orSkipEmailSignup}</span>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.01 }} 
                    whileTap={{ scale: 0.98 }} 
                    type="button" 
                    onClick={async () => {
                      setLoading(true);
                      const result = await loginWithGoogle();
                      if (!result.success) {
                        setError(result.error || t.registrationFailed);
                        setLoading(false);
                      } else {
                         // On successful Google auth, they'll be redirected
                      }
                    }}
                    disabled={loading}
                    className="w-full bg-white text-slate-900 font-black text-sm py-4 rounded-xl flex items-center justify-center gap-3 disabled:opacity-60 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {t.continueWithGoogle}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold py-3 px-4 rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Nav buttons */}
        {!showSuccess && (
          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-4 bg-slate-800/50 border border-slate-700/50 text-slate-400 rounded-2xl font-bold hover:bg-slate-800 transition-colors"
            >
              {sessionLanguage === 'ur' ? '→' : '←'} {t.back}
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-2xl font-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  {t.creating}
                </span>
              ) : t.createAccount}
            </motion.button>
          </div>
        )}

        {/* Already have account */}
        {!showSuccess && (
          <p className="text-center text-slate-500 text-sm mt-6">
            {t.alreadyHaveAccount}{' '}
            <button type="button" onClick={onBack} className="text-amber-500 font-bold hover:underline underline-offset-4 bg-transparent border-none p-0 outline-none cursor-pointer">
              {t.logInButton}
            </button>
          </p>
        )}
      </div>
    </main>
  );
};

export default SignUp;
