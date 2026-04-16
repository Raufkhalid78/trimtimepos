import React from 'react';
import { View, UserRole, Language, Subscription } from '../types';
import { TRANSLATIONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { SubscriptionBadge } from './SubscriptionBanner';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  shopName: string;
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
  subscription?: Subscription | null;
  dbStatus: 'connected' | 'offline' | 'error';
}

const Sidebar: React.FC<SidebarProps> = ({ shopName, userRole, isOpen, onClose, subscription, dbStatus }) => {
  const { sessionLanguage, setSessionLanguage, isDarkMode, setIsDarkMode } = useAuth();
  const t = TRANSLATIONS[sessionLanguage];
  const navigate = useNavigate();

  const allItems = [
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

  const visibleItems = allItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] md:hidden" />
        )}
      </AnimatePresence>

      <motion.div initial={{ x: -280 }} animate={{ x: isOpen || window.innerWidth >= 768 ? 0 : -280 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-64 bg-slate-900 h-screen fixed left-0 top-0 flex flex-col text-white no-print shadow-2xl z-[110]"
      >
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center font-brand text-xl text-slate-950 shadow-lg shadow-amber-500/20">{shopName.charAt(0)}</div>
              <div className="min-w-0">
                <h1 className="text-lg font-black font-brand tracking-tight truncate w-28">{shopName}</h1>
                {subscription && <SubscriptionBadge subscription={subscription} />}
              </div>
            </div>
            <button onClick={onClose} className="md:hidden p-1 text-slate-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleItems.map(item => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => window.innerWidth < 768 && onClose()}
              className={({ isActive }) => `
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${isActive ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10' : 'hover:bg-slate-800/50 text-slate-400 font-medium'}
              `}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50 space-y-4">
          <div className="flex bg-slate-800/50 rounded-xl p-1 gap-1">
             <button onClick={() => setSessionLanguage('en')} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${sessionLanguage === 'en' ? 'bg-slate-700 text-amber-500' : 'text-slate-500'}`}>EN</button>
             <button onClick={() => setSessionLanguage('ur')} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${sessionLanguage === 'ur' ? 'bg-slate-700 text-amber-500' : 'text-slate-500'}`}>UR</button>
          </div>
          
          <div className="flex items-center justify-between px-2">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.database}</span>
            <div className={`flex items-center gap-1.5`}>
              <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${dbStatus === 'connected' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {dbStatus === 'connected' ? t.online : t.offline}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
