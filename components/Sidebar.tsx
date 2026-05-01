import React, { useState } from 'react';
import { View, UserRole, Language, Subscription } from '../types';
import { TRANSLATIONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { SubscriptionBadge } from './SubscriptionBanner';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  shopName: string;
  userRole: UserRole;
  isOpen: boolean; // Mobile drawer open
  onClose: () => void;
  subscription?: Subscription | null;
  dbStatus: 'connected' | 'offline' | 'error';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  shopName, userRole, isOpen, onClose, subscription, dbStatus, isCollapsed, onToggleCollapse 
}) => {
  const { sessionLanguage, setSessionLanguage, isDarkMode } = useAuth();
  const t = TRANSLATIONS[sessionLanguage];
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { id: 'dashboard', label: t.dashboard, path: '/dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
    ), roles: ['admin', 'employee'] },
    { id: 'pos', label: t.pos, path: '/pos', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
    ), roles: ['admin', 'employee'] },
    { id: 'inventory', label: t.catalog, path: '/inventory', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
    ), roles: ['admin'] },
    { id: 'customers', label: t.customers, path: '/customers', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
    ), roles: ['admin', 'employee'] },
    { id: 'staff', label: t.staff, path: '/staff', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
    ), roles: ['admin'] },
    { id: 'finance', label: t.finance, path: '/finance', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    ), roles: ['admin', 'employee'] },
    { id: 'appointments', label: t.appointments, path: '/appointments', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
    ), roles: ['admin', 'employee'] },
    { id: 'settings', label: t.settings, path: '/settings', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
    ), roles: ['admin', 'employee'] },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] md:hidden" 
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          width: isMobile ? (isOpen ? 280 : 0) : (isCollapsed ? 80 : 260),
          x: isMobile && !isOpen ? -280 : 0
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-screen bg-[var(--tt-bg)] border-r border-[var(--tt-border)] z-[110] flex flex-col no-print shadow-xl"
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-4 border-b border-[var(--tt-border)] overflow-hidden shrink-0">
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center font-brand text-2xl text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
              {(shopName || 'T').charAt(0)}
            </div>
            <motion.div
              animate={{ opacity: isCollapsed && !isMobile ? 0 : 1 }}
              className="flex flex-col min-w-0"
            >
              <h1 className="text-lg font-black font-brand tracking-tight truncate text-[var(--tt-text-main)]">
                {shopName}
              </h1>
              {subscription && <SubscriptionBadge subscription={subscription} />}
            </motion.div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide mt-2">
          {visibleItems.map(item => (
            <NavLink
              key={item.id}
              to={item.path}
              id={`nav-${item.id}`}
              onClick={() => isMobile && onClose()}
              className={({ isActive }) => `
                group flex items-center gap-4 px-3.5 py-3 rounded-2xl transition-all relative
                ${isActive 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' 
                  : 'text-[var(--tt-text-muted)] hover:bg-[var(--tt-surface-2)] hover:text-[var(--tt-text-main)]'}
              `}
            >
              <div className="shrink-0">{item.icon}</div>
              <motion.span 
                animate={{ opacity: isCollapsed && !isMobile ? 0 : 1, x: isCollapsed && !isMobile ? -10 : 0 }}
                className="text-sm whitespace-nowrap"
              >
                {item.label}
              </motion.span>
              
              {isCollapsed && !isMobile && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[200] shadow-xl">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-[var(--tt-border)] space-y-3 shrink-0">

          <div className="flex items-center justify-between px-2">
            <div className={`flex items-center gap-2 group cursor-help`} title={dbStatus === 'connected' ? 'Database Online' : 'Database Offline'}>
              <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500 tt-glow-emerald animate-pulse' : 'bg-rose-500'}`}></div>
              {!isCollapsed || isMobile ? (
                <span className={`text-[9px] font-black uppercase tracking-widest ${dbStatus === 'connected' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {dbStatus === 'connected' ? t.online : t.offline}
                </span>
              ) : null}
            </div>

            {!isMobile && (
              <button 
                onClick={onToggleCollapse}
                className="p-1.5 text-[var(--tt-text-muted)] hover:text-[var(--tt-text-main)] hover:bg-[var(--tt-surface-2)] rounded-lg transition-colors"
              >
                <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;

