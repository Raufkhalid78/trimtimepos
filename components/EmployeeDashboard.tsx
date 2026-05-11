import React, { useMemo } from 'react';
import { Sale, Appointment, Staff, Language, View } from '../types';
import { TRANSLATIONS } from '../constants';
import { motion } from 'framer-motion';
import { format, isSameDay, parseISO, isValid } from 'date-fns';

interface EmployeeDashboardProps {
  sales: Sale[];
  appointments: Appointment[];
  currentUser: Staff;
  currency: string;
  language: Language;
  onViewChange: (view: View) => void;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ sales, appointments, currentUser, currency, language, onViewChange }) => {
  const t = TRANSLATIONS[language];

  const todayStats = useMemo(() => {
    const today = new Date();
    // Exclude refunded sales from employee revenue/commission
    const mySales = sales.filter(s => s.staffId === currentUser.id && !s.isRefunded && isSameDay(parseISO(s.timestamp), today));
    const revenue = mySales.reduce((acc, s) => acc + s.total, 0);
    const commission = revenue * (currentUser.commission / 100);
    const myAppointments = appointments.filter(a => a.staffId === currentUser.id && isSameDay(parseISO(a.startTime), today));
    const completed = myAppointments.filter(a => a.status === 'completed').length;
    return { revenue, commission, count: mySales.length, appointments: myAppointments, completed };
  }, [sales, appointments, currentUser]);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    return todayStats.appointments
      .filter(a => a.status !== 'completed' && a.status !== 'cancelled' && parseISO(a.startTime) > now)
      .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime())[0];
  }, [todayStats.appointments]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <div className="space-y-8 pb-12" id="dashboard-root">
      {/* Hero Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="tt-surface p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden border border-[var(--tt-border)] shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--tt-amber-glow)] rounded-full -mr-32 -mt-32 blur-[100px] opacity-50" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-[var(--tt-text-main)] tracking-tight leading-tight">
              {greeting},<br /><span className="text-[var(--tt-amber)]">{currentUser.name}!</span>
            </h2>
            <p className="text-[var(--tt-text-muted)] font-black uppercase tracking-[0.2em] text-[10px] mt-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Today: {todayStats.appointments.length} Appointments Scheduled
            </p>
          </div>
          <button onClick={() => onViewChange(View.POS)}
            className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-white/10 hover:bg-slate-100 transition-all active:scale-95 shrink-0"
          >
            Launch POS Terminal
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Schedule */}
        <div className="lg:col-span-2 space-y-6" id="tour-appointments">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black text-[var(--tt-text-main)] uppercase tracking-tight">Today's Timeline</h3>
            <button onClick={() => onViewChange(View.APPOINTMENTS)} className="text-[10px] font-black text-[var(--tt-amber)] hover:underline uppercase tracking-widest">Full Calendar</button>
          </div>
          
          <div className="relative space-y-4 before:absolute before:left-[23px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--tt-border)] before:hidden sm:before:block">
            {todayStats.appointments.length > 0 ? todayStats.appointments.sort((a,b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()).map((apt, idx) => (
              <motion.div key={apt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                className="relative pl-0 sm:pl-12 group"
              >
                {/* Timeline Dot */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 hidden sm:flex items-center justify-center z-10">
                   <div className={`w-3 h-3 rounded-full border-4 border-[var(--tt-bg)] ${apt.status === 'completed' ? 'bg-emerald-500' : 'bg-[var(--tt-amber)]'} group-hover:scale-125 transition-transform`} />
                </div>

                <div className="tt-card p-5 flex items-center justify-between group-hover:border-[var(--tt-amber)] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[var(--tt-surface-2)] rounded-2xl flex flex-col items-center justify-center border border-[var(--tt-border)] shrink-0 group-hover:bg-[var(--tt-surface)] transition-colors">
                      <span className="text-[14px] font-black text-[var(--tt-text-main)]">{format(parseISO(apt.startTime), 'HH:mm')}</span>
                    </div>
                    <div>
                      <p className="font-bold text-[var(--tt-text-main)] text-sm">{apt.customerName || 'Walk-in Client'}</p>
                      <p className="text-[10px] text-[var(--tt-text-muted)] font-black uppercase tracking-widest mt-1">{apt.serviceIds.length} Services</p>
                    </div>
                  </div>
                  <span className={`tt-badge ${
                    apt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                    apt.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              </motion.div>
            )) : (
              <div className="tt-card p-12 text-center border-dashed">
                <p className="text-[var(--tt-text-muted)] font-black uppercase tracking-widest text-[10px] opacity-50">No activity scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        {/* Side Widgets */}
        <div className="space-y-8">
          {/* Next Up Spotlight */}
          {nextAppointment && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--tt-amber)] p-8 rounded-[2.5rem] text-slate-950 shadow-2xl shadow-amber-500/30 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 opacity-60">Next Up</p>
              <h4 className="text-3xl font-black tracking-tight mb-2">{nextAppointment.customerName}</h4>
              <div className="flex items-center gap-2 mb-8">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3" /></svg>
                 <span className="text-sm font-black">{format(parseISO(nextAppointment.startTime), 'hh:mm a')}</span>
              </div>
              <button onClick={() => onViewChange(View.APPOINTMENTS)}
                className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-transform"
              >
                Start Session
              </button>
            </motion.div>
          )}

          {/* Personal Performance Card */}
          <div className="tt-card p-6 space-y-6">
            <h3 className="text-[10px] font-black text-[var(--tt-text-muted)] uppercase tracking-widest">Live Performance</h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-[var(--tt-text-muted)] uppercase tracking-widest">Earnings</p>
                  <p className="text-3xl font-black text-[var(--tt-text-main)] mt-1 tracking-tighter">{currency}{todayStats.revenue.toFixed(0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Commission</p>
                  <p className="text-xl font-black text-emerald-500 mt-1">{currency}{todayStats.commission.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--tt-surface-2)] p-4 rounded-2xl border border-[var(--tt-border)]">
                  <p className="text-[9px] font-black text-[var(--tt-text-muted)] uppercase tracking-widest">Sessions</p>
                  <p className="text-xl font-black text-[var(--tt-text-main)] mt-1">{todayStats.count}</p>
                </div>
                <div className="bg-[var(--tt-surface-2)] p-4 rounded-2xl border border-[var(--tt-border)]">
                  <p className="text-[9px] font-black text-[var(--tt-text-muted)] uppercase tracking-widest">Completion</p>
                  <p className="text-xl font-black text-[var(--tt-text-main)] mt-1">
                    {todayStats.appointments.length > 0 ? Math.round((todayStats.completed / todayStats.appointments.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

