import React, { useState, useEffect, Component, ReactNode, ErrorInfo, Suspense, lazy } from 'react';
import Sidebar from '@/components/Sidebar';
import Login from '@/components/Login';
import InstallBanner from '@/components/InstallBanner';
const LandingPage = lazy(() => import('@/components/LandingPage'));
const SignUp = lazy(() => import('@/components/SignUp'));
const SubscriptionBanner = lazy(() => import('@/components/SubscriptionBanner'));
const SubscriptionExpiredScreen = lazy(() => import('@/components/SubscriptionBanner').then(m => ({ default: m.SubscriptionExpiredScreen })));
const PricingPage = lazy(() => import('@/components/PricingPage'));

import { View, Language } from './types';
import { TRANSLATIONS } from './constants';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import { isSubscriptionValid } from './services/subscriptionService';
import { useToast } from './contexts/ToastContext';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { loginWithEmail } from './services/authService';

interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("Application Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center text-3xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">{TRANSLATIONS['en'].somethingWentWrong}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">{TRANSLATIONS['en'].unexpectedError}</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg active:scale-95 transition-transform">Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const { 
    authUser, currentTenant, subscription, authLoading, saasView, 
    currentUser, sessionLanguage, isDarkMode,
    setSaasView, setSessionLanguage, setIsDarkMode, signOut, loginStaff, refreshAuth 
  } = useAuth();
  
  const { loading: dataLoading, settings, staff } = useData();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const t = TRANSLATIONS[sessionLanguage];

  const handleFullSignOut = async () => { 
    localStorage.removeItem('trimtime_session');
    await signOut(); 
    navigate('/'); 
  };

  const handleLogout = () => {
    localStorage.removeItem('trimtime_session');
    window.location.reload();
  };

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (authLoading) return <div className="h-screen w-full flex items-center justify-center bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500 mx-auto mb-4"></div></div>;

  if (saasView === 'landing') return <Suspense fallback={null}><LandingPage onGoToSignUp={() => setSaasView('signup')} onGoToLogin={() => setSaasView('login')} /></Suspense>;
  if (saasView === 'signup') return <Suspense fallback={null}><SignUp onBack={() => setSaasView('landing')} onSuccess={() => refreshAuth()} /></Suspense>;
  if (saasView === 'login') return <Suspense fallback={null}><OwnerLogin onBack={() => setSaasView('landing')} onSuccess={() => refreshAuth()} /></Suspense>;

  if (subscription && !isSubscriptionValid(subscription)) {
    return (
      <Suspense fallback={null}>
        <SubscriptionExpiredScreen onManageSubscription={() => setIsPricingOpen(true)} onLogout={handleFullSignOut} />
        {isPricingOpen && authUser && currentTenant && <PricingPage tenantId={currentTenant.id} userEmail={authUser.email || ''} language={sessionLanguage} onClose={() => setIsPricingOpen(false)} />}
      </Suspense>
    );
  }


  if (dataLoading) return <div className="h-screen w-full flex items-center justify-center bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div></div>;

  if (!currentUser) return <Login onLogin={loginStaff} staffList={staff} shopName={settings.shopName} onGoToLanding={handleFullSignOut} />;

  const currentPath = location.pathname.split('/').pop() || 'dashboard';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      <Sidebar
        shopName={settings.shopName} userRole={currentUser.role}
        isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
        dbStatus="connected"
        subscription={subscription}
      />

      <div className="flex-1 flex flex-col min-w-0 md:pl-64 overflow-hidden relative">
        <header className="flex md:hidden items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-50 sticky top-0 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-brand text-lg text-slate-950">{settings.shopName.charAt(0)}</div>
            <span className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{settings.shopName}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg">{isDarkMode ? '🌞' : '🌙'}</button>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-900 dark:text-white bg-amber-500 rounded-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg></button>
          </div>
        </header>

        <header className="hidden md:flex justify-between items-center px-8 py-6 no-print">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-brand capitalize">{currentPath}</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 bg-white dark:bg-slate-900 text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800">{isDarkMode ? '🌞' : '🌙'}</button>
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 pr-4 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xs">{currentUser.name.charAt(0)}</div>
              <div className="flex flex-col"><span className="text-xs font-bold dark:text-white">{currentUser.name}</span><span className="text-[9px] uppercase font-black text-slate-400">{currentUser.role}</span></div>
            </div>
            <button onClick={handleFullSignOut} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl" title={t.logout}>🚪</button>
          </div>
        </header>

        <SubscriptionBanner subscription={subscription} onManageSubscription={() => setIsPricingOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scrollbar-hide">
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-amber-500"></div></div>}>
              <AnimatePresence mode='wait'>
                <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full">
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <InstallBanner deferredPrompt={deferredPrompt} onClose={() => setDeferredPrompt(null)} />

      {isPricingOpen && authUser && currentTenant && <PricingPage tenantId={currentTenant.id} userEmail={authUser.email || ''} language={sessionLanguage} onClose={() => setIsPricingOpen(false)} />}
    </div>
  );
};

// Owner Login Component
const OwnerLogin: React.FC<{ onBack: () => void; onSuccess: () => void | Promise<void> }> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await loginWithEmail(email.trim().toLowerCase(), password);
    if (result.success) {
      await onSuccess();
    } else {
      setError(result.error || 'Invalid email or password.');
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) { setError('Please enter your email address to reset password.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else { setError(''); alert('Password reset link sent to your email.'); }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">

      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full relative z-10">
        <div className="text-center mb-12">
          <motion.div whileHover={{ rotate: 12, scale: 1.1 }} className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2.5rem] flex items-center justify-center font-brand text-5xl text-slate-950 mx-auto mb-8 shadow-2xl shadow-amber-500/40">T</motion.div>
          <h1 className="text-4xl font-extrabold font-brand text-white tracking-tighter mb-3">Welcome Back</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Business Owner Login</p>
        </div>
        <motion.div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                className="w-full bg-slate-800/30 border border-slate-700/50 text-white rounded-2xl px-6 py-4 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-medium" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Password</label>
                <button type="button" onClick={handleResetPassword} className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-widest transition-colors bg-transparent border-none p-0">Forgot?</button>
              </div>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required
                  className="w-full bg-slate-800/30 border border-slate-700/50 text-white rounded-2xl px-6 py-4 pr-12 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-medium" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">{showPw ? '🙈' : '👁️'}</button>
              </div>
            </div>
            {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-black uppercase tracking-wider py-3 px-4 rounded-xl text-center">{error}</div>}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-xl py-5 rounded-[1.5rem] shadow-xl shadow-amber-500/10 mt-4 disabled:opacity-60">{loading ? 'Signing in...' : 'Sign In'}</motion.button>
          </form>
        </motion.div>
        <div className="flex flex-col items-center gap-3 mt-8">
          <p className="text-slate-500 text-sm">Don't have an account? <button type="button" onClick={onBack} className="text-amber-500 font-bold hover:underline underline-offset-4 bg-transparent border-none p-0 outline-none cursor-pointer">Sign Up Free</button></p>
          <button type="button" onClick={onBack} className="text-slate-600 text-sm font-bold hover:text-slate-400 transition-colors bg-transparent border-none p-0 outline-none cursor-pointer">← Back to Home</button>
        </div>
      </motion.div>
    </main>

  );
};

export default App;