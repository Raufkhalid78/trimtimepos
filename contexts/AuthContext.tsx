import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getCurrentTenant, getCurrentSubscription } from '../services/authService';
import { Tenant, Subscription, Staff, Language, SaaSView } from '../types';

interface AuthContextType {
  authUser: any;
  currentTenant: Tenant | null;
  subscription: Subscription | null;
  currentUser: Staff | null;
  authLoading: boolean;
  saasView: SaaSView;
  sessionLanguage: Language;
  isDarkMode: boolean;
  
  setSaasView: (view: SaaSView) => void;
  setSessionLanguage: (lang: Language) => void;
  setIsDarkMode: (dark: boolean) => void;
  setCurrentUser: (user: Staff | null) => void;
  
  refreshSubscription: (tenantId?: string) => Promise<void>;
  loginStaff: (user: Staff, remember: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<any>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [saasView, setSaasView] = useState<SaaSView>('landing');
  
  const [sessionLanguage, setSessionLanguage] = useState<Language>(() => (localStorage.getItem('trimtime_lang') as Language) || 'en');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('trimtime_theme') === 'dark');

  const [currentUser, setCurrentUser] = useState<Staff | null>(() => {
    const saved = localStorage.getItem('trimtime_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.user && parsed.expiry && Date.now() < parsed.expiry) return parsed.user;
      } catch (e) { }
    }
    return null;
  });

  const checkAuth = async () => {
    setAuthLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAuthUser(session.user);
        const tenant = await getCurrentTenant();
        if (tenant) {
          setCurrentTenant(tenant);
          const sub = await getCurrentSubscription(tenant.id);
          setSubscription(sub);
          setSaasView('app');
        } else {
          setSaasView('landing');
        }
      } else {
        setSaasView('landing');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setSaasView('landing');
    } finally {
      setAuthLoading(false);
    }
  };

  const loginStaff = (user: Staff, remember: boolean) => {
    const expiry = Date.now() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000;
    localStorage.setItem('trimtime_session', JSON.stringify({ user, expiry }));
    setCurrentUser(user);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('trimtime_session');
    setAuthUser(null);
    setCurrentTenant(null);
    setSubscription(null);
    setCurrentUser(null);
    setSaasView('landing');
  };

  const refreshSubscription = async (tenantIdToUse?: string) => {
    const id = tenantIdToUse || currentTenant?.id;
    if (id) {
      const sub = await getCurrentSubscription(id);
      setSubscription(sub);
    }
  };

  useEffect(() => {
    checkAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') checkAuth();
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('trimtime_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    document.documentElement.lang = sessionLanguage;
    document.dir = sessionLanguage === 'ur' ? 'rtl' : 'ltr';
    localStorage.setItem('trimtime_lang', sessionLanguage);
  }, [sessionLanguage]);

  return (
    <AuthContext.Provider value={{
      authUser, currentTenant, subscription, currentUser, authLoading, saasView, sessionLanguage, isDarkMode,
      setSaasView, setSessionLanguage, setIsDarkMode, setCurrentUser,
      refreshSubscription, loginStaff, signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
