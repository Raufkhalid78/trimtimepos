import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface TopBarProps {
  onToggleSidebar: () => void;
  onLogout: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, onLogout }) => {
  const { 
    currentUser, 
    authUser, 
    currentTenant, 
    subscription, 
    isDarkMode, 
    setIsDarkMode, 
    sessionLanguage, 
    setSessionLanguage 
  } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();
  const t = TRANSLATIONS[sessionLanguage];
  const isRTL = sessionLanguage === 'ur' || sessionLanguage === 'ar';
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const currentPath = location.pathname.split('/').pop() || 'dashboard';
  const pageTitle = t[currentPath as keyof typeof t] || currentPath;

  // Close dropdown on click outside or Esc key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProfileOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNavigate = (path: string) => {
    setIsProfileOpen(false);
    navigate(path);
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ur', label: 'اردو' },
    { code: 'ar', label: 'العربية' },
    { code: 'hi', label: 'हिन्दी' },
  ];

  return (
    <header className="glass-topbar sticky top-0 z-[90] h-16 px-3 sm:px-6 md:px-8 flex items-center justify-between no-print border-b border-[var(--tt-border)] bg-[var(--tt-bg)]/80 backdrop-blur-md">
      {/* Left / Start Section: Sidebar Toggle & Page Title */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button 
          onClick={onToggleSidebar}
          className="p-2.5 text-[var(--tt-text-main)] hover:bg-[var(--tt-surface-2)] rounded-xl md:hidden transition-colors shrink-0"
          aria-label="Toggle navigation drawer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        
        <AnimatePresence mode="wait">
          <motion.h1 
            key={currentPath}
            initial={{ opacity: 0, x: isRTL ? 8 : -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? -8 : 8 }}
            className="text-lg sm:text-xl font-black text-[var(--tt-text-main)] capitalize tracking-tight truncate"
          >
            {pageTitle}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* Right / End Section: Theme Toggle, User Profile Menu & Logout */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0" ref={profileRef}>
        {/* Dark Mode Toggle */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className="p-2 sm:p-2.5 text-[var(--tt-text-muted)] hover:text-[var(--tt-amber)] bg-[var(--tt-surface-2)] rounded-xl transition-all"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Clickable Interactive User Profile Button */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-2.5 p-1 sm:p-1.5 sm:px-3 rounded-full border transition-all cursor-pointer ${
              isProfileOpen 
                ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10' 
                : 'bg-[var(--tt-surface-2)] hover:bg-[var(--tt-surface)] border-[var(--tt-border)] hover:border-slate-600/40 shadow-sm'
            }`}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            aria-label="Open profile and account menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-md shadow-amber-500/20 shrink-0">
              {(currentUser?.name || authUser?.email || 'U').charAt(0).toUpperCase()}
            </div>
            
            {/* Desktop Label */}
            <div className="hidden sm:flex flex-col text-start">
              <span className="text-xs font-bold text-[var(--tt-text-main)] leading-none max-w-[110px] truncate">
                {currentUser?.name || 'User'}
              </span>
              <span className="text-[9px] uppercase font-black text-[var(--tt-text-muted)] tracking-wider mt-0.5">
                {currentUser?.role || 'Admin'}
              </span>
            </div>

            <svg 
              className={`w-3.5 h-3.5 text-[var(--tt-text-muted)] transition-transform duration-200 hidden sm:block ${isProfileOpen ? 'rotate-180 text-amber-400' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Profile Dropdown Menu */}
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                dir={isRTL ? 'rtl' : 'ltr'}
                className={`absolute ${isRTL ? 'left-0 sm:left-0 right-auto' : 'right-0 sm:right-0 left-auto'} top-full mt-2 w-80 sm:w-88 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700/90 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] ring-1 ring-white/10 overflow-hidden z-[200] p-3 text-slate-200`}
              >
                {/* Header: User & Store Card */}
                <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700/70 mb-2.5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-amber-500/20 shrink-0">
                      {(currentUser?.name || authUser?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-start">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-white truncate">
                          {currentUser?.name || 'Account'}
                        </p>
                        <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-black uppercase rounded-full tracking-wider">
                          {currentUser?.role || 'Admin'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">
                        {authUser?.email || currentUser?.email || 'user@trimtimepos.com'}
                      </p>
                    </div>
                  </div>

                  {/* Store & Plan Status */}
                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-slate-400">{isRTL ? 'اسٹور / المتجر:' : 'Store:'}</span>
                      <span className="font-bold text-white truncate">
                        {currentTenant?.businessName || 'TrimTime Store'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-emerald-400 text-[10px] uppercase tracking-wider capitalize">
                        {subscription?.plan ? `${subscription.plan} Pro` : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="space-y-1 mb-2.5">
                  <button
                    onClick={() => handleNavigate('/settings')}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/90 transition-all text-start group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-amber-400 group-hover:border-amber-500/40 transition-colors shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </div>
                    <span>{t.settings}</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/dashboard')}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/90 transition-all text-start group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 transition-colors shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                    </div>
                    <span>{t.dashboard}</span>
                  </button>

                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => handleNavigate('/staff')}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/90 transition-all text-start group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                      </div>
                      <span>{t.staff}</span>
                    </button>
                  )}
                </div>

                {/* Language Switcher Section */}
                <div className="p-3 bg-slate-800/90 rounded-2xl border border-slate-700/70 mb-2.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 text-start">
                    🌐 {t.language} / زبان
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setSessionLanguage(lang.code)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                          sessionLanguage === lang.code
                            ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                            : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-700/40'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full py-3 px-4 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border border-rose-500/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>{t.logout || 'Log Out'}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Standalone Logout Button on TopBar */}
        <button 
          onClick={onLogout} 
          className="p-2 sm:p-2.5 text-[var(--tt-text-muted)] hover:text-[var(--tt-rose)] bg-[var(--tt-surface-2)] rounded-xl transition-all"
          title={t.logout}
          aria-label={t.logout || 'Log Out'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
