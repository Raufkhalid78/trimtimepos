import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TRANSLATIONS } from '../constants';

interface TopBarProps {
  onToggleSidebar: () => void;
  onLogout: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, onLogout }) => {
  const { currentUser, isDarkMode, setIsDarkMode, sessionLanguage } = useAuth();
  const location = useLocation();
  const t = TRANSLATIONS[sessionLanguage];

  const currentPath = location.pathname.split('/').pop() || 'dashboard';
  const pageTitle = t[currentPath as keyof typeof t] || currentPath;

  return (
    <header className="glass-topbar sticky top-0 z-[90] h-16 px-4 md:px-8 flex items-center justify-between no-print">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="p-2 text-[var(--tt-text-main)] hover:bg-[var(--tt-surface-2)] rounded-xl md:hidden transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        
        <AnimatePresence mode="wait">
          <motion.h1 
            key={currentPath}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="text-xl font-black text-[var(--tt-text-main)] capitalize tracking-tight"
          >
            {pageTitle}
          </motion.h1>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Dark Mode Toggle */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className="p-2.5 text-[var(--tt-text-muted)] hover:text-[var(--tt-amber)] bg-[var(--tt-surface-2)] rounded-xl transition-all"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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

        {/* User Chip */}
        <div className="flex items-center gap-3 bg-[var(--tt-surface-2)] p-1.5 pr-4 rounded-full border border-[var(--tt-border)] shadow-sm hidden sm:flex">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-lg shadow-amber-500/20">
            {(currentUser?.name || 'U').charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[var(--tt-text-main)] leading-none">{currentUser?.name}</span>
            <span className="text-[9px] uppercase font-black text-[var(--tt-text-muted)] tracking-wider mt-0.5">{currentUser?.role}</span>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={onLogout} 
          className="p-2.5 text-[var(--tt-text-muted)] hover:text-[var(--tt-rose)] bg-[var(--tt-surface-2)] rounded-xl transition-all"
          title={t.logout}
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
