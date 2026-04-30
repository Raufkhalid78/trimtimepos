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
    const mySales = sales.filter(s => s.staffId === currentUser.id && isSameDay(parseISO(s.timestamp), today));
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
    <div className="space-y-6 pb-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                {greeting}, {currentUser.name}!
              </h2>
              <p className="text-indigo-100 font-medium opacity-80 uppercase tracking-widest text-xs font-black">
                You have {todayStats.appointments.length} appointments scheduled for today.
              </p>
            </div>
            <button 
              onClick={() => onViewChange(View.POS)}
              className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-indigo-50 transition-all active:scale-95"
            >
              Open POS Terminal
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Today's Schedule</h3>
            <button onClick={() => onViewChange(View.APPOINTMENTS)} className="text-xs font-bold text-indigo-500 hover:text-indigo-600">View Full Calendar</button>
          </div>
          
          <div className="grid gap-3">
            {todayStats.appointments.length > 0 ? todayStats.appointments.map(apt => (
              <div key={apt.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase leading-none">{format(parseISO(apt.startTime), 'MMM')}</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1">{format(parseISO(apt.startTime), 'dd')}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{apt.customerName || 'Walk-in Client'}</p>
                    <p className="text-xs text-slate-500 font-medium">{format(parseISO(apt.startTime), 'hh:mm a')} • {apt.serviceIds.length} Services</p>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  apt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                  apt.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {apt.status}
                </div>
              </div>
            )) : (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No appointments for today</p>
              </div>
            )}
          </div>
        </div>

        {/* Side Widgets */}
        <div className="space-y-6">
          {/* Next Up */}
          {nextAppointment && (
            <div className="bg-amber-500 p-6 rounded-[2rem] text-slate-950 shadow-xl shadow-amber-500/20">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Next Appointment</p>
              <h4 className="text-xl font-black mb-1">{nextAppointment.customerName}</h4>
              <p className="text-sm font-bold opacity-80 mb-6">{format(parseISO(nextAppointment.startTime), 'hh:mm a')}</p>
              <button 
                onClick={() => onViewChange(View.APPOINTMENTS)}
                className="w-full bg-slate-950 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-transform"
              >
                View Details
              </button>
            </div>
          )}

          {/* Personal Stats */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Performance Today</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{currency}{todayStats.revenue.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Commission</p>
                  <p className="text-lg font-black text-emerald-500 mt-1">{currency}{todayStats.commission.toFixed(2)}</p>
                </div>
              </div>

              <div className="h-px bg-slate-50 dark:bg-slate-800" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{todayStats.count}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
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
