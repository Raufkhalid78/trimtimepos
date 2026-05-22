
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { verifyPassword } from '../services/passwordService';
import { Staff, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { setPageMeta } from '../utils/seo';

const StaffLogin: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { loginStaff, sessionLanguage, setSessionLanguage } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const t = TRANSLATIONS[sessionLanguage] || TRANSLATIONS.en;

  useEffect(() => { 
    setPageMeta('Staff Login', 'Staff login portal for TrimTime POS.');
    if (slug) {
      const targetUrl = `/staff-login/${slug}`;
      localStorage.setItem('trimtime_pwa_start_url', targetUrl);
      
      // Override manifest start_url dynamically for PWA installation (solves iOS isolated storage issues)
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (manifestLink) {
        fetch(manifestLink.href)
          .then(res => res.json())
          .then(manifest => {
            manifest.start_url = targetUrl;
            const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
            manifestLink.href = URL.createObjectURL(blob);
          })
          .catch(err => console.error("Could not dynamically update manifest start_url", err));
      }
    }
  }, [slug]);

  useEffect(() => {
    const loadTenantAndStaff = async () => {
      if (!slug) { setPageLoading(false); return; }

      const cleanSlug = slug.trim().toLowerCase();

      // 1. Fetch the tenant by slug
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', cleanSlug)
        .eq('is_active', true)
        .single();

      if (tenantError || !tenantData) {
        setError(t.shopNotFound);
        setPageLoading(false);
        return;
      }

      setTenant(tenantData);

      // 2. Directly fetch staff for this tenant (bypass shared context to avoid race conditions)
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, name, role, commission, username, password, email, base_salary, tenant_id')
        .eq('tenant_id', tenantData.id);

      if (!staffError && staffData) {
        setStaffList(staffData.map((s: any) => ({
          ...s,
          commission: typeof s.commission === 'string' ? parseFloat(s.commission) : (s.commission || 0),
          baseSalary: s.base_salary || 0,
        })));
      }

      setPageLoading(false);
    };

    loadTenantAndStaff();
  }, [slug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffList.length) {
      setError(t.staffRecordsNotFound);
      return;
    }

    setLoading(true);
    setError('');

    const potentialUsers = staffList.filter(
      s => s.username?.toLowerCase().trim() === username.toLowerCase().trim()
    );

    let matchedUser: Staff | null = null;

    for (const user of potentialUsers) {
      const storedPass = user.password || '';
      // Check bcrypt hash first
      if (storedPass.startsWith('$2a$') || storedPass.startsWith('$2b$')) {
        const ok = await verifyPassword(password, storedPass);
        if (ok) { matchedUser = user; break; }
      } else {
        // Plaintext fallback for legacy / un-hashed passwords
        if (password === storedPass) { matchedUser = user; break; }
      }
    }

    if (matchedUser) {
      const expiry = Date.now() + 12 * 60 * 60 * 1000;
      loginStaff(matchedUser, expiry);
      navigate('/dashboard');
    } else {
      setError(t.invalidLogin);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setLoading(false);
    }
  };

  const shopInitial = (tenant?.business_name || 'T').charAt(0).toUpperCase();

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-rose-400 text-lg font-bold">{error}</p>
        </div>
      </div>
    );
  }

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

      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Left Branding Panel — desktop */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative z-10"
      >
        {/* Top logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center font-brand text-lg text-white shadow-lg shadow-violet-500/30">
            {shopInitial}
          </div>
          <div>
            <p className="text-white font-black text-sm leading-none">{tenant?.business_name || 'TrimTime'}</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t.staffPortal}</p>
          </div>
        </div>

        {/* Centre content */}
        <div className="space-y-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-6">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-amber-400 text-xs font-black uppercase tracking-widest">{t.twelveHourShiftSession}</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight leading-tight font-brand">
              {t.startYourShift.replace('.', '')}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                .
              </span>
            </h1>
            <p className="text-slate-400 text-lg mt-4 leading-relaxed">
              {t.loginToAccess}
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-white/4 border border-white/8 rounded-2xl p-5 space-y-3"
          >
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.sessionDetails}</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <p className="text-white text-xs font-bold">{t.autoExpires12h}</p>
                <p className="text-slate-500 text-[10px]">{t.autoLogoutSecurity}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <p className="text-slate-600 text-xs">
          {t.credentialsEncrypted}
        </p>
      </motion.div>

      {/* Right Form Panel */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="flex-1 flex items-center justify-center p-6 relative z-10"
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-[1.75rem] flex items-center justify-center font-brand text-4xl text-white mx-auto mb-5 shadow-2xl shadow-violet-500/40"
            >
              {shopInitial}
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tight font-brand">{tenant?.business_name || 'TrimTime'}</h1>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1.5 mt-3">
              <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest">{t.staffShiftLogin}</span>
            </div>
          </div>

          <div className="hidden lg:block mb-10" style={{ textAlign: sessionLanguage === 'ur' ? 'right' : 'left' }}>
            <h2 className="text-3xl font-black text-white">{t.staffSignInTitle}</h2>
            <p className="text-slate-500 mt-1 text-sm">{t.enterShiftCredentials}</p>
          </div>

          <motion.div
            animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/8 p-8 rounded-[2rem] shadow-2xl"
          >
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className={`text-[10px] font-black text-slate-400 uppercase tracking-widest block ${sessionLanguage === 'ur' ? 'text-right' : ''}`}>{t.usernameLabel}</label>
                <div className="relative">
                  <svg className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-500 ${sessionLanguage === 'ur' ? 'right-4' : 'left-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <input
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    placeholder="your.username"
                    required
                    autoComplete="username"
                    className={`w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all placeholder:text-slate-600 font-medium text-sm ${sessionLanguage === 'ur' ? 'pr-11 text-right' : 'pl-11'}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-black text-slate-400 uppercase tracking-widest block ${sessionLanguage === 'ur' ? 'text-right' : ''}`}>{t.passwordLabel}</label>
                <div className="relative">
                  <svg className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-500 ${sessionLanguage === 'ur' ? 'right-4' : 'left-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className={`w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all placeholder:text-slate-600 font-medium text-sm ${sessionLanguage === 'ur' ? 'pr-11 pl-12 text-right' : 'pl-11 pr-12'}`}
                    dir="ltr"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors ${sessionLanguage === 'ur' ? 'left-4' : 'right-4'}`} aria-label="Toggle password">
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

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

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-black text-sm py-4 rounded-xl shadow-xl shadow-violet-500/20 transition-all hover:shadow-violet-500/40 mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    {t.verifying}
                  </>
                ) : (
                  <>
                    {t.startShiftButton}
                    <svg className={`w-4 h-4 ${sessionLanguage === 'ur' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          <p className="text-center text-slate-600 text-xs mt-6">
            {t.sessionExpiresSecurity}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default StaffLogin;
