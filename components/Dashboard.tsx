import React, { useState, useMemo, Suspense, lazy, useEffect } from 'react';
import { Sale, Expense, Product, Language, View, Staff, Appointment } from '../types';
import { TRANSLATIONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, addDays, isWithinInterval, startOfDay, endOfDay, startOfMonth, endOfMonth, parseISO, getDaysInMonth, isValid, isSameDay } from 'date-fns';

const RevenueChart = lazy(() => import('./Charts').then(m => ({ default: m.RevenueChart })));
const ExpensePieChart = lazy(() => import('./Charts').then(m => ({ default: m.ExpensePieChart })));

interface DashboardProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  staff: Staff[];
  appointments: Appointment[];
  currentUser: Staff;
  currency: string;
  language: Language;
  onViewChange: (view: View) => void;
}

type DateRange = 'today' | 'week' | 'month' | 'all' | 'custom';

const CountUp: React.FC<{ value: number; prefix?: string; duration?: number }> = ({ value, prefix = '', duration = 1000 }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(progress * value);
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{prefix}{count.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
};

const Dashboard: React.FC<DashboardProps> = ({ sales, expenses, products, staff, appointments, currentUser, currency, language, onViewChange }) => {
  const t = TRANSLATIONS[language];
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customRange, setCustomRange] = useState({ start: format(subDays(new Date(), 7), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') });

  const filteredSales = useMemo(() => {
    const now = new Date();
    const currentMonthStr = format(now, 'yyyy-MM');
    const todayStr = format(now, 'yyyy-MM-dd');
    
    return sales.filter(sale => {
      const saleDate = parseISO(sale.timestamp);
      if (!isValid(saleDate)) return false;
      const saleMonthStr = format(saleDate, 'yyyy-MM');
      const saleDayStr = format(saleDate, 'yyyy-MM-dd');
      
      switch (dateRange) {
        case 'today': return saleDayStr === todayStr;
        case 'week': return isWithinInterval(saleDate, { start: startOfDay(subDays(now, 6)), end: endOfDay(now) });
        case 'month': return saleMonthStr === currentMonthStr;
        case 'custom': return isWithinInterval(saleDate, { start: startOfDay(parseISO(customRange.start)), end: endOfDay(parseISO(customRange.end)) });
        default: return true;
      }
    });
  }, [sales, dateRange, customRange]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const currentMonthStr = format(now, 'yyyy-MM');
    const todayStr = format(now, 'yyyy-MM-dd');

    return expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      if (!isValid(expenseDate)) return false;
      const expenseMonthStr = format(expenseDate, 'yyyy-MM');
      const expenseDayStr = format(expenseDate, 'yyyy-MM-dd');

      switch (dateRange) {
        case 'today': return expenseDayStr === todayStr;
        case 'week': return isWithinInterval(expenseDate, { start: startOfDay(subDays(now, 6)), end: endOfDay(now) });
        case 'month': return expenseMonthStr === currentMonthStr;
        case 'custom': return isWithinInterval(expenseDate, { start: startOfDay(parseISO(customRange.start)), end: endOfDay(parseISO(customRange.end)) });
        default: return true;
      }
    });
  }, [expenses, dateRange, customRange]);

  const stats = useMemo(() => {
    // Separate active sales from refunded ones for accurate accounting
    const activeSales = filteredSales.filter(s => !s.isRefunded);
    const refundedSales = filteredSales.filter(s => s.isRefunded);

    const revenue = activeSales.reduce((acc, s) => acc + s.total, 0);
    const totalRefunds = refundedSales.reduce((acc, s) => acc + s.total, 0);
    const expensesTotal = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const payroll = activeSales.reduce((acc, sale) => {
      const staffMember = staff.find(s => s.id === sale.staffId);
      const commissionRate = staffMember?.commission || 0;
      return acc + (sale.total * (commissionRate / 100));
    }, 0);

    const inventoryValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const avgTicket = activeSales.length > 0 ? revenue / activeSales.length : 0;
    const remainingBalance = revenue - expensesTotal - payroll;

    return { revenue, totalRefunds, expenses: expensesTotal, payroll, inventoryValue, avgTicket, remainingBalance };
  }, [filteredSales, filteredExpenses, products, staff]);

  const chartData = useMemo(() => {
    const now = new Date();
    let startDate = startOfMonth(now);
    let days = getDaysInMonth(now);
    const activeRange = dateRange || 'month';
    
    if (activeRange === 'today') { days = 1; startDate = startOfDay(now); }
    else if (activeRange === 'week') { days = 7; startDate = subDays(startOfDay(now), 6); }
    else if (activeRange === 'custom') {
      const start = startOfDay(parseISO(customRange.start));
      const end = endOfDay(parseISO(customRange.end));
      days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      startDate = start;
    } else if (activeRange === 'all') { days = 30; startDate = subDays(startOfDay(now), 29); } 

    return Array.from({ length: days }).map((_, i) => {
      const date = addDays(startDate, i);
      const dayStr = format(date, 'MMM dd');
      // Exclude refunded sales from the revenue chart
      const daySales = sales.filter(s => {
        if (s.isRefunded) return false;
        const sDate = parseISO(s.timestamp);
        return isValid(sDate) && format(sDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      });
      return { name: dayStr, revenue: daySales.reduce((acc, s) => acc + s.total, 0) };
    });
  }, [sales, dateRange, customRange]);

  const staffLeaderboard = useMemo(() => {
    const staffMap: Record<string, number> = {};
    // Only count active (non-refunded) sales for the leaderboard
    filteredSales.filter(s => !s.isRefunded).forEach(sale => {
      const name = sale.staffName || 'Unknown';
      staffMap[name] = (staffMap[name] || 0) + sale.total;
    });
    return Object.entries(staffMap).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredSales]);

  const expenseBreakdown = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredExpenses.forEach(exp => { catMap[exp.category] = (catMap[exp.category] || 0) + exp.amount; });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stock <= (p.lowStockThreshold || 5));
  }, [products]);

  const todayAppointments = useMemo(() => {
    const today = new Date();
    return appointments.filter(a => isSameDay(parseISO(a.startTime), today)).sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()).slice(0, 5);
  }, [appointments]);

  const recentSales = useMemo(() => {
    return [...sales].sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()).slice(0, 5);
  }, [sales]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];

  return (
    <div className="space-y-8 pb-12" id="dashboard-root">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-3xl font-black text-[var(--tt-text-main)] tracking-tight">
            {greeting}, <span className="text-[var(--tt-amber)]">{currentUser.name}</span>!
          </h2>
          <p className="text-[var(--tt-text-muted)] font-black uppercase tracking-[0.2em] text-[10px] mt-2">
            {t.commandCenter || 'Business Command Center'}
          </p>
        </motion.div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex bg-[var(--tt-surface-2)] p-1 rounded-2xl border border-[var(--tt-border)] shadow-sm">
            {(['today', 'week', 'month', 'all', 'custom'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  dateRange === range
                    ? 'bg-[var(--tt-surface)] text-[var(--tt-amber)] shadow-md'
                    : 'text-[var(--tt-text-muted)] hover:text-[var(--tt-text-main)]'
                }`}
              >
                {t[range as keyof typeof t] || range}
              </button>
            ))}
          </div>
          <AnimatePresence>
            {dateRange === 'custom' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
                className="flex items-center gap-2 bg-[var(--tt-surface)] p-2 rounded-xl border border-[var(--tt-border)] shadow-lg">
                <input type="date" value={customRange.start} onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                  className="text-[10px] font-bold text-[var(--tt-text-main)] outline-none bg-transparent" />
                <span className="text-[var(--tt-text-muted)]">→</span>
                <input type="date" value={customRange.end} onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                  className="text-[10px] font-bold text-[var(--tt-text-main)] outline-none bg-transparent" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5" id="tour-kpi-cards">
        {[
          { label: t.revenue, value: stats.revenue, color: 'var(--tt-amber)', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: t.refunds || 'Refunds', value: stats.totalRefunds, color: 'var(--tt-rose)', isNegative: true, icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },
          { label: t.expenses, value: stats.expenses, color: '#f97316', icon: 'M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: t.payroll, value: stats.payroll, color: 'var(--tt-violet)', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { label: t.remainingBalance, value: stats.remainingBalance, color: 'var(--tt-emerald)', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
          { label: t.inventoryValue, value: stats.inventoryValue, color: 'var(--tt-blue)', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
          { label: t.avgTicket, value: stats.avgTicket, color: 'var(--tt-amber)', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
        ].map((stat: any, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="tt-card p-5 group hover:scale-[1.02] active:scale-95 cursor-default relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--tt-amber-glow)] rounded-full -mr-12 -mt-12 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4`} style={{ backgroundColor: stat.color }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={stat.icon} /></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-[var(--tt-text-muted)] uppercase tracking-widest">{stat.label}</p>
              <p className={`text-2xl font-black mt-1 tracking-tighter ${stat.isNegative && stat.value > 0 ? 'text-[var(--tt-rose)]' : 'text-[var(--tt-text-main)]'}`}>
                {stat.isNegative && stat.value > 0 ? '-' : ''}<CountUp value={stat.value} prefix={currency} />
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trends Chart */}
        <div className="lg:col-span-2 tt-card p-6" id="tour-revenue-chart">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-[var(--tt-text-main)] uppercase tracking-tight">{t.revenueTrends}</h3>
              <p className="text-[10px] font-bold text-[var(--tt-text-muted)] mt-1 uppercase tracking-widest">Performance analytics</p>
            </div>
            <div className="px-4 py-1.5 bg-[var(--tt-amber-glow)] text-[var(--tt-amber)] rounded-full text-[10px] font-black uppercase tracking-widest">
              {dateRange === 'today' ? t.today : dateRange === 'week' ? t.last7Days : dateRange === 'month' ? t.month : dateRange === 'custom' ? t.custom : t.all}
            </div>
          </div>
          <div className="h-[320px] w-full">
            {filteredSales.length > 0 ? (
              <Suspense fallback={<div className="h-full w-full bg-[var(--tt-surface-2)] animate-pulse rounded-2xl" />}>
                <RevenueChart data={chartData} />
              </Suspense>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[var(--tt-text-muted)]">
                <div className="w-16 h-16 bg-[var(--tt-surface-2)] rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <p className="text-xs font-black uppercase tracking-widest mb-4">{t.noRecords}</p>
                <button onClick={() => onViewChange(View.POS)} className="px-6 py-2.5 bg-[var(--tt-amber)] text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg active:scale-95">
                  {t.addSale || 'Add Sale'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expense Breakdown / Side Widgets */}
        <div className="space-y-8">
          <div className="tt-card p-6 h-full">
            <h3 className="text-lg font-black text-[var(--tt-text-main)] uppercase tracking-tight mb-6">{t.expenseBreakdown}</h3>
            <div className="h-[250px] w-full">
              {expenseBreakdown.length > 0 ? (
                <Suspense fallback={<div className="h-full w-full bg-[var(--tt-surface-2)] animate-pulse rounded-2xl" />}>
                  <ExpensePieChart data={expenseBreakdown} colors={COLORS} />
                </Suspense>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[var(--tt-text-muted)]">
                   <p className="text-xs font-black uppercase tracking-widest">No expenses recorded</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <div className="tt-card p-6" id="tour-appointments">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-black text-[var(--tt-text-main)] uppercase tracking-tight">{t.appointments || 'Today\'s Schedule'}</h3>
             <button onClick={() => onViewChange(View.APPOINTMENTS)} className="text-[10px] font-black text-[var(--tt-amber)] hover:underline uppercase tracking-widest">View All</button>
           </div>
           <div className="space-y-4">
             {todayAppointments.length > 0 ? todayAppointments.map(apt => (
               <div key={apt.id} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--tt-surface-2)] border border-transparent hover:border-[var(--tt-border)] transition-all group">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-[var(--tt-surface)] rounded-2xl flex flex-col items-center justify-center shadow-sm border border-[var(--tt-border)]">
                     <span className="text-[8px] font-black text-[var(--tt-text-muted)] uppercase leading-none">{format(parseISO(apt.startTime), 'MMM')}</span>
                     <span className="text-lg font-black text-[var(--tt-text-main)] leading-none mt-1">{format(parseISO(apt.startTime), 'dd')}</span>
                   </div>
                   <div>
                     <p className="text-sm font-bold text-[var(--tt-text-main)] group-hover:text-[var(--tt-amber)] transition-colors">{apt.customerName || 'Walk-in'}</p>
                     <p className="text-[10px] text-[var(--tt-text-muted)] font-bold">{format(parseISO(apt.startTime), 'hh:mm a')}</p>
                   </div>
                 </div>
                 <span className={`tt-badge ${
                   apt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                   apt.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                 }`}>
                   {apt.status}
                 </span>
               </div>
             )) : (
               <div className="py-12 text-center text-[var(--tt-text-muted)] italic text-xs font-bold uppercase tracking-widest opacity-50">No appointments today</div>
             )}
           </div>
        </div>

        {/* Staff Leaderboard */}
        <div className="tt-card p-6">
          <h3 className="text-lg font-black text-[var(--tt-text-main)] uppercase tracking-tight mb-6">Top Performers</h3>
          <div className="space-y-6">
            {staffLeaderboard.length > 0 ? staffLeaderboard.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-500 text-slate-950' : 'bg-[var(--tt-surface-2)] text-[var(--tt-text-muted)]'}`}>{idx + 1}</span>
                    <span className="text-sm font-bold text-[var(--tt-text-main)]">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-[var(--tt-text-main)]">{currency}{item.revenue.toFixed(0)}</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--tt-surface-2)] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(item.revenue / (staffLeaderboard[0].revenue || 1)) * 100}%` }}
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500" />
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-[var(--tt-text-muted)] italic text-xs font-bold uppercase tracking-widest opacity-50">No sales data</div>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="tt-card p-6" id="tour-recent-sales">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-black text-[var(--tt-text-main)] uppercase tracking-tight">{t.recentSales || 'Recent Sales'}</h3>
             <button onClick={() => onViewChange(View.POS)} className="text-[10px] font-black text-[var(--tt-amber)] hover:underline uppercase tracking-widest">New Sale</button>
           </div>
           <div className="space-y-4">
             {recentSales.length > 0 ? recentSales.map(sale => (
               <div key={sale.id} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--tt-surface-2)] border border-transparent hover:border-[var(--tt-border)] transition-all">
                 <div className="flex items-center gap-4">
                   <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-lg ${sale.paymentMethod === 'cash' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-blue-500 shadow-blue-500/20'}`}>
                     {sale.paymentMethod === 'cash' ? '$' : '💳'}
                   </div>
                   <div>
                     <p className="text-sm font-bold text-[var(--tt-text-main)]">{sale.customerName || 'Walk-in Client'}</p>
                     <p className="text-[10px] text-[var(--tt-text-muted)] font-bold">{format(parseISO(sale.timestamp), 'hh:mm a')} • {sale.staffName}</p>
                   </div>
                 </div>
                 <p className="text-sm font-black text-[var(--tt-text-main)]">{currency}{sale.total.toFixed(2)}</p>
               </div>
             )) : (
               <div className="py-12 text-center text-[var(--tt-text-muted)] italic text-xs font-bold uppercase tracking-widest opacity-50">No sales yet</div>
             )}
           </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-[2rem] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5 text-center md:text-left">
              <div className="w-16 h-16 bg-rose-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-rose-500/30 shrink-0">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-rose-500 uppercase tracking-tight">{t.lowStockAlerts}</h3>
                <p className="text-rose-400/80 text-sm font-bold uppercase tracking-widest mt-1">{lowStockItems.length} {t.itemsRestock}</p>
              </div>
            </div>
            <button onClick={() => onViewChange(View.INVENTORY)} className="px-8 py-4 bg-rose-500 text-white rounded-[1.25rem] text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 active:scale-95">
              {t.restockNow}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 relative z-10">
            {lowStockItems.map(item => (
              <div key={item.id} className="bg-[var(--tt-surface)]/50 backdrop-blur-sm p-4 rounded-2xl border border-rose-500/20 flex justify-between items-center">
                <div>
                  <p className="font-bold text-[var(--tt-text-main)] text-sm">{item.name}</p>
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">{item.stock} {t.unitsLeft}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-[var(--tt-text-muted)] uppercase tracking-widest">Alert: {item.lowStockThreshold || 5}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;


