import React, { useState, useEffect, Component, ReactNode, ErrorInfo, Suspense, lazy } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Login from '@/components/Login';
import InstallBanner from '@/components/InstallBanner';
import LogoutScreen from '@/components/LogoutScreen';
import OnboardingTour from '@/components/OnboardingTour';
const LandingPage = lazy(() => import('@/components/LandingPage'));
const SignUp = lazy(() => import('@/components/SignUp'));
const SubscriptionBanner = lazy(() => import('@/components/SubscriptionBanner'));
const SubscriptionExpiredScreen = lazy(() => import('@/components/SubscriptionBanner').then(m => ({ default: m.SubscriptionExpiredScreen })));
const PricingPage = lazy(() => import('@/components/PricingPage'));
const BusinessOnboarding = lazy(() => import('@/components/BusinessOnboarding'));

import { View, Language } from './types';
import { TRANSLATIONS } from './constants';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import { isSubscriptionValid } from './services/subscriptionService';
import { useToast } from './contexts/ToastContext';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { loginWithEmail, loginWithGoogle } from './services/authService';
import { notificationService } from './services/notificationService';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('trimtime_sidebar_collapsed') === 'true');
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutScreen, setShowLogoutScreen] = useState(false);
  const [logoutUserName, setLogoutUserName] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const t = TRANSLATIONS[sessionLanguage];

  const handleFullSignOut = async () => {
    setLogoutUserName(currentUser?.name || '');
    setShowLogoutConfirm(false);
    localStorage.removeItem('trimtime_session');
    await signOut();
    setShowLogoutScreen(true);
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

  useEffect(() => {
    if (currentUser && !notificationService.hasPermission()) {
      notificationService.requestPermission();
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('trimtime_sidebar_collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // PWA Standalone Redirect Logic
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone && location.pathname === '/' && saasView === 'landing' && !authLoading) {
      const startUrl = localStorage.getItem('trimtime_pwa_start_url');
      if (startUrl && startUrl.startsWith('/staff-login/')) {
        navigate(startUrl, { replace: true });
      } else {
        setSaasView('login');
      }
    }
  }, [saasView, location.pathname, navigate, setSaasView, authLoading]);

  const PageLoader = () => <div className="h-screen w-full flex items-center justify-center bg-[#080c14]"><div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  if (showLogoutScreen) return <LogoutScreen userName={logoutUserName} shopName={settings?.shopName || 'TrimTime'} onDone={() => { setShowLogoutScreen(false); navigate('/'); }} />;

  if (authLoading) return <PageLoader />;

  if (saasView === 'landing') return <Suspense fallback={<PageLoader />}><LandingPage onGoToSignUp={() => setSaasView('signup')} onGoToLogin={() => setSaasView('login')} /></Suspense>;
  if (saasView === 'signup') return <Suspense fallback={<PageLoader />}><SignUp onBack={() => setSaasView('landing')} onSuccess={() => refreshAuth()} /></Suspense>;
  if (saasView === 'login') return <Suspense fallback={<PageLoader />}><OwnerLogin onBack={() => setSaasView('landing')} onSuccess={() => refreshAuth()} /></Suspense>;
  if (saasView === 'onboarding') return <Suspense fallback={<PageLoader />}><BusinessOnboarding onSuccess={() => refreshAuth()} onLogout={() => { signOut(); setSaasView('landing'); }} /></Suspense>;

  if (subscription && !isSubscriptionValid(subscription)) {
    return (
      <Suspense fallback={<PageLoader />}>
        <SubscriptionExpiredScreen onManageSubscription={() => setIsPricingOpen(true)} onLogout={() => setShowLogoutConfirm(true)} />
        {isPricingOpen && authUser && currentTenant && <PricingPage tenantId={currentTenant.id} userEmail={authUser.email || ''} language={sessionLanguage} onClose={() => setIsPricingOpen(false)} />}
      </Suspense>
    );
  }

  if (dataLoading) return <PageLoader />;

  if (!currentUser) return <Login onLogin={loginStaff} staffList={staff} shopName={settings.shopName} onGoToLanding={() => setShowLogoutConfirm(true)} />;

  const currentPath = location.pathname.split('/').pop() || 'dashboard';

  return (
    <div className="flex h-screen bg-[var(--tt-bg)] overflow-hidden font-sans transition-colors duration-300">
      {/* Offline Indicator */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[999] bg-rose-500 text-white text-center py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-2.828 2.828a1 1 0 010 1.414" /></svg>
            You're offline — some features may be limited
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar
        shopName={settings.shopName} userRole={currentUser.role}
        isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
        dbStatus="connected"
        subscription={subscription}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-[260px]'} overflow-hidden relative`}>
        <TopBar 
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onLogout={() => setShowLogoutConfirm(true)}
        />

        <SubscriptionBanner subscription={subscription} onManageSubscription={() => setIsPricingOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scrollbar-hide min-h-0">
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

      <OnboardingTour />

      {isPricingOpen && authUser && currentTenant && <PricingPage tenantId={currentTenant.id} userEmail={authUser.email || ''} language={sessionLanguage} onClose={() => setIsPricingOpen(false)} />}

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[500] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#111827] border border-white/10 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </div>
              <h3 className="text-xl font-black text-white mb-2">End Your Session?</h3>
              <p className="text-slate-400 text-sm mb-8">You'll be signed out securely. Any unsaved changes may be lost.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-sm transition-colors">Cancel</button>
                <button onClick={handleFullSignOut} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-sm transition-colors shadow-lg shadow-rose-500/20">Sign Out</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
  const [shake, setShake] = useState(false);
  const { setSaasView } = useAuth();

  useEffect(() => {
    const targetUrl = '/login';
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await loginWithEmail(email.trim().toLowerCase(), password);
    if (result.success) {
      await onSuccess();
    } else {
      setError(result.error || 'Invalid email or password.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
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
    else setError('✓ Reset link sent — check your inbox.');
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-amber-600/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
      </div>
      <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.7 }}
        className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center font-brand text-lg text-slate-950 shadow-lg shadow-amber-500/30">T</div>
          <span className="text-white font-black text-lg">TrimTime</span>
        </div>
        <div className="space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-amber-400 text-xs font-black uppercase tracking-widest">Business Owner</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight leading-tight font-brand">Manage Your<br /><span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Business.</span></h1>
            <p className="text-slate-400 text-lg mt-4">Full access to analytics, staff management, finances, and POS from one dashboard.</p>
          </div>
          {[{ icon: '📊', text: 'Revenue & expense analytics' }, { icon: '👥', text: 'Staff & commission management' }, { icon: '📅', text: 'Appointment scheduling' }].map((f, i) => (
            <div key={i} className="flex items-center gap-3 text-slate-400"><span className="text-lg">{f.icon}</span><span className="text-sm font-medium">{f.text}</span></div>
          ))}
        </div>
        <p className="text-slate-600 text-xs">Secured with Supabase Auth. Your data is encrypted in transit and at rest.</p>
      </motion.div>
      <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.7 }}
        className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[1.75rem] flex items-center justify-center font-brand text-4xl text-slate-950 mx-auto mb-5 shadow-2xl shadow-amber-500/40">T</div>
            <h1 className="text-3xl font-black text-white font-brand">TrimTime</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Business Owner Portal</p>
          </div>
          <div className="hidden lg:block mb-10">
            <h2 className="text-3xl font-black text-white">Owner Sign In</h2>
            <p className="text-slate-500 mt-1 text-sm">Access your full business dashboard.</p>
          </div>
          <motion.div animate={shake ? { x: [-8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.5 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/8 p-8 rounded-[2rem] shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Email Address</label>
                <div className="relative">
                  <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="you@yourbusiness.com" required
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 pl-11 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-medium text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                  <button type="button" onClick={handleResetPassword} className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-widest transition-colors">Forgot?</button>
                </div>
                <div className="relative">
                  <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="••••••••" required
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 pl-11 pr-12 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-medium text-sm" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPw
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className={`flex items-center gap-3 border text-xs font-bold py-3 px-4 rounded-xl ${error.startsWith('✓') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-sm py-4 rounded-xl shadow-xl shadow-amber-500/20 mt-2 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading
                  ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Signing in...</>
                  : <>Sign In <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>}
              </motion.button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#080c14] px-4 text-xs font-bold uppercase tracking-widest text-slate-500">Or continue with</span>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }} 
                whileTap={{ scale: 0.98 }} 
                type="button" 
                onClick={async () => {
                  setLoading(true);
                  try {
                    const result = await loginWithGoogle();
                    if (!result.success) {
                      setError(result.error || 'Google login failed.');
                      setLoading(false);
                    }
                    // If success, browser redirects to Google — loading stays until page unloads.
                    // Safety fallback: reset after 8s in case redirect never fires.
                    setTimeout(() => setLoading(false), 8000);
                  } catch {
                    setError('Unexpected error. Please try again.');
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full bg-white text-slate-900 font-black text-sm py-3.5 rounded-xl flex items-center justify-center gap-3 disabled:opacity-60 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {loading ? 'Redirecting...' : 'Google'}
              </motion.button>
            </form>
          </motion.div>
          <div className="flex flex-col items-center gap-3 mt-6">
            <p className="text-slate-500 text-sm">Don't have an account?{' '}
              <button type="button" onClick={() => setSaasView('signup')} className="text-amber-400 font-bold hover:text-amber-300 bg-transparent border-none p-0 cursor-pointer transition-colors">Sign Up Free</button>
            </p>
            <button type="button" onClick={onBack} className="text-slate-600 text-sm font-bold hover:text-slate-400 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
              Back to Home
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default App;