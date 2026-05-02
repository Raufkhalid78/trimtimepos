import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { getCurrentTenant, getCurrentSubscription, getOwnerStaff, cancelSubscription as _cancelSubscription, deleteStore as _deleteStore } from '../services/authService';
import { Tenant, Subscription, Staff, Language, SaaSView } from '../types';
import { logger } from '../services/logger';

interface AuthContextType {
  authUser: User | null;
  currentTenant: Tenant | null;
  subscription: Subscription | null;
  currentUser: Staff | null;
  authLoading: boolean;
  saasView: SaaSView;
  sessionLanguage: Language;
  isDarkMode: boolean;
  isTourCompleted: boolean;
  
  setSaasView: (view: SaaSView) => void;
  setSessionLanguage: (lang: Language) => void;
  setIsDarkMode: (dark: boolean) => void;
  setCurrentUser: (user: Staff | null) => void;
  completeTour: () => void;
  
  refreshSubscription: (tenantId?: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  loginStaff: (user: Staff, remember: boolean | number) => void;
  signOut: () => Promise<void>;
  cancelSubscription: () => Promise<boolean>;
  deleteStore: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [saasView, setSaasView] = useState<SaaSView>('landing');
  
  const [sessionLanguage, setSessionLanguage] = useState<Language>(() => (localStorage.getItem('trimtime_lang') as Language) || 'en');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('trimtime_theme');
    return saved ? saved === 'dark' : true;
  });
  const [isTourCompleted, setIsTourCompleted] = useState(() => localStorage.getItem('trimtime_tour_completed_v1') === 'true');

  // Ref to track whether we're in the middle of a signup/login flow.
  // When true, the onAuthStateChange listener will NOT re-run checkAuth(),
  // preventing the race condition where checkAuth sees no tenant yet.
  const suppressAuthCheckRef = useRef(false);

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

  const checkAuth = useCallback(async (isSilent = false) => {
    if (!isSilent) setAuthLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAuthUser(session.user);
        const tenant = await getCurrentTenant();
        if (tenant) {
          setCurrentTenant(tenant);
          const sub = await getCurrentSubscription(tenant.id);
          setSubscription(sub);
          
          // Auto-login owner as staff
          const ownerStaff = await getOwnerStaff(tenant.id);
          if (ownerStaff) {
            setCurrentUser(ownerStaff);
          }
          
          setSaasView('app');
        } else {
          // Tenant not found for this authenticated user.
          // If suppress flag is set, we're mid-email-signup — don't redirect yet.
          // This prevents the double-onboarding bug where onAuthStateChange fires
          // before registerNewBusiness has finished creating the tenant.
          if (!suppressAuthCheckRef.current) {
            // Not in a signup flow — must be a Google user or orphaned account.
            // Route to business onboarding.
            setSaasView('onboarding');
          }
        }
      } else {
        // Check if we have a staff session but no Supabase auth (employee mode)
        const saved = localStorage.getItem('trimtime_session');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.user && parsed.expiry && Date.now() < parsed.expiry) {
              // We are an employee. We need to fetch the tenant info to let the app function.
              const { data: tenant } = await supabase.from('tenants').select('*').eq('id', parsed.user.tenant_id).single();
              if (tenant) {
                 setCurrentTenant({
                    id: tenant.id,
                    ownerId: tenant.owner_id,
                    businessName: tenant.business_name,
                    businessType: tenant.business_type,
                    slug: tenant.slug,
                    createdAt: tenant.created_at,
                    logoUrl: tenant.logo_url,
                    isActive: tenant.is_active
                 });
                 setSaasView('app');
              }
            }
          } catch (e) {}
        }
        
        // Only set to landing if we didn't find a staff session and not suppressed
        if (!suppressAuthCheckRef.current && !localStorage.getItem('trimtime_session')) {
          setSaasView('landing');
        }
      }
    } catch (err) {
      logger.error('Auth check failed:', err);
      if (!suppressAuthCheckRef.current) {
        setSaasView('landing');
      }
    } finally {
      if (!isSilent) setAuthLoading(false);
    }
  }, []);

  /**
   * Called by SignUp and OwnerLogin after their flow completes.
   * By this point, the tenant, subscription, staff, etc. all exist in DB.
   * This re-runs checkAuth() to populate all context state properly.
   */
  const refreshAuth = useCallback(async () => {
    suppressAuthCheckRef.current = false;
    await checkAuth();
  }, [checkAuth]);

  /**
   * Wrapper to set saasView AND manage the suppression flag.
   * When entering signup or login, suppress auth checks so the
   * onAuthStateChange listener doesn't interfere.
   */
  const handleSetSaasView = useCallback((view: SaaSView) => {
    if (view === 'signup' || view === 'login') {
      suppressAuthCheckRef.current = true;
    } else if (view === 'landing') {
      suppressAuthCheckRef.current = false;
    }
    setSaasView(view);
  }, []);

  const loginStaff = (user: Staff, remember: boolean | number) => {
    const expiry = typeof remember === 'number' ? remember : (Date.now() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000);
    localStorage.setItem('trimtime_session', JSON.stringify({ user, expiry }));
    setCurrentUser(user);
    setSaasView('app');
  };

  const signOut = async () => {
    suppressAuthCheckRef.current = false;
    await supabase.auth.signOut();
    localStorage.removeItem('trimtime_session');
    setAuthUser(null);
    setCurrentTenant(null);
    setSubscription(null);
    setCurrentUser(null);
    setSaasView('landing');
  };

  const completeTour = useCallback(() => {
    localStorage.setItem('trimtime_tour_completed_v1', 'true');
    setIsTourCompleted(true);
  }, []);

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
      // Skip auth check if we're in the middle of signup/login flow
      if (suppressAuthCheckRef.current) return;
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') checkAuth(true);
    });
    return () => authListener.subscription.unsubscribe();
  }, [checkAuth]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('trimtime_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    document.documentElement.lang = sessionLanguage;
    document.dir = (sessionLanguage === 'ur' || sessionLanguage === 'ar') ? 'rtl' : 'ltr';
    localStorage.setItem('trimtime_lang', sessionLanguage);
  }, [sessionLanguage]);

  useEffect(() => {
    const handleRestartOnboarding = () => {
      localStorage.removeItem('trimtime_tour_completed_v1');
      setIsTourCompleted(false);
    };
    window.addEventListener('restart-onboarding', handleRestartOnboarding);
    return () => window.removeEventListener('restart-onboarding', handleRestartOnboarding);
  }, []);

  const cancelSubscription = async () => {
    if (!currentTenant) return false;
    const success = await _cancelSubscription(currentTenant.id);
    if (success) {
      await refreshSubscription();
    }
    return success;
  };

  const deleteStore = async () => {
    if (!currentTenant) return false;
    const success = await _deleteStore(currentTenant.id);
    if (success) {
      await signOut(); // This resets all state and pushes to landing
    }
    return success;
  };

  return (
    <AuthContext.Provider value={{
      authUser, currentTenant, subscription, currentUser, authLoading, saasView, sessionLanguage, isDarkMode, isTourCompleted,
      setSaasView: handleSetSaasView, setSessionLanguage, setIsDarkMode, setCurrentUser, completeTour,
      refreshSubscription, refreshAuth, loginStaff, signOut, cancelSubscription, deleteStore
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
