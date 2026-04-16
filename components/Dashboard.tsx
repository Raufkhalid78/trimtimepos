import React, { useState, useMemo } from 'react';
import { Sale, Expense, Product, Language, View, Staff } from '../types';
import { TRANSLATIONS } from '../constants';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { format, subDays, addDays, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, getDaysInMonth, isSameMonth, isSameYear, isValid } from 'date-fns';

interface DashboardProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  staff: Staff[];
  currency: string;
  language: Language;
  onViewChange: (view: View) => void;
}

type DateRange = 'today' | 'week' | 'month' | 'all' | 'custom';

const Dashboard: React.FC<DashboardProps> = ({ sales, expenses, products, staff, currency, language, onViewChange }) => {
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
    const revenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const expensesTotal = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const payroll = filteredSales.reduce((acc, sale) => {
      const staffMember = staff.find(s => s.id === sale.staffId);
      const commissionRate = staffMember?.commission || 0;
      return acc + (sale.total * (commissionRate / 100));
    }, 0);

    const inventoryValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const avgTicket = filteredSales.length > 0 ? revenue / filteredSales.length : 0;
    const remainingBalance = revenue - expensesTotal - payroll;

    return {
      revenue,
      expenses: expensesTotal,
      payroll,
      inventoryValue,
      avgTicket,
      remainingBalance
    };
  }, [filteredSales, filteredExpenses, products, staff]);

  const chartData = useMemo(() => {
    const now = new Date();
    // Default to strict calendar month (1st to end)
    let startDate = startOfMonth(now);
    let days = getDaysInMonth(now);

    const activeRange = dateRange || 'month';
    
    if (activeRange === 'today') {
      days = 1;
      startDate = startOfDay(now);
    } else if (activeRange === 'week') {
      days = 7;
      startDate = subDays(startOfDay(now), 6);
    } else if (activeRange === 'custom') {
      const start = startOfDay(parseISO(customRange.start));
      const end = endOfDay(parseISO(customRange.end));
      days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      startDate = start;
    } else if (activeRange === 'all') {
      days = 30;
      startDate = subDays(startOfDay(now), 29);
    } 

    return Array.from({ length: days }).map((_, i) => {
      const date = addDays(startDate, i);
      const dayStr = format(date, 'MMM dd');
      const daySales = sales.filter(s => {
        const sDate = parseISO(s.timestamp);
        return isValid(sDate) && format(sDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      });
      const dayRevenue = daySales.reduce((acc, s) => acc + s.total, 0);
      return { name: dayStr, revenue: dayRevenue };
    });
  }, [sales, dateRange, customRange]);

  const topPerformers = useMemo(() => {
    const serviceMap: Record<string, number> = {};
    const productMap: Record<string, number> = {};

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.type === 'service') {
          serviceMap[item.name] = (serviceMap[item.name] || 0) + (item.price * item.quantity);
        } else {
          productMap[item.name] = (productMap[item.name] || 0) + (item.price * item.quantity);
        }
      });
    });

    const topServices = Object.entries(serviceMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topProducts = Object.entries(productMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { topServices, topProducts };
  }, [filteredSales]);

  const staffLeaderboard = useMemo(() => {
    const staffMap: Record<string, number> = {};
    filteredSales.forEach(sale => {
      const name = sale.staffName || 'Unknown';
      staffMap[name] = (staffMap[name] || 0) + sale.total;
    });

    return Object.entries(staffMap)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  const expenseBreakdown = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      catMap[exp.category] = (catMap[exp.category] || 0) + exp.amount;
    });

    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const lowStockItems = products.filter(p => p.stock <= (p.lowStockThreshold || 5));

  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
            {t.dashboard}
            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-md uppercase font-black tracking-tighter">Verified Filter: {format(new Date(), 'yyyy-MM')}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-4 uppercase tracking-widest text-[10px] font-black">{t.commandCenter}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl self-start">
            {(['today', 'week', 'month', 'all', 'custom'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-all ${dateRange === range ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {t[range as keyof typeof t] || range}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-2">
              <input
                type="date"
                value={customRange.start}
                onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                className="text-[10px] font-bold text-slate-600 outline-none"
              />
              <span className="text-slate-300">→</span>
              <input
                type="date"
                value={customRange.end}
                onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                className="text-[10px] font-bold text-slate-600 outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: t.revenue, value: stats.revenue, color: 'bg-amber-500', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: t.expenses, value: stats.expenses, color: 'bg-rose-500', icon: 'M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: t.payroll, value: stats.payroll, color: 'bg-violet-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { label: t.remainingBalance, value: stats.remainingBalance, color: 'bg-emerald-500', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
          { label: t.inventoryValue, value: stats.inventoryValue, color: 'bg-indigo-500', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
          { label: t.avgTicket, value: stats.avgTicket, color: 'bg-blue-500', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-3"
          >
            <div className={`w-10 h-10 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/10`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} /></svg>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {currency}{stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trends */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.revenueTrends}</h3>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              {dateRange === 'today' ? t.today : dateRange === 'week' ? t.last7Days : dateRange === 'month' ? t.month : dateRange === 'custom' ? t.custom : t.all}
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fbbf24', fontWeight: 800 }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">{t.expenseBreakdown}</h3>
          <div className="h-[300px] w-full">
            {expenseBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-xs font-bold uppercase tracking-widest">{t.noRecords}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">{t.topPerformers}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t.topServices}</p>
              <div className="h-[250px] w-full">
                {topPerformers.topServices.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPerformers.topServices} layout="vertical" margin={{ left: 20, right: 30 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} width={80} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#fbbf24', fontWeight: 800 }}
                      />
                      <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-400 italic text-center py-12">{t.noRecords}</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t.topProducts}</p>
              <div className="h-[250px] w-full">
                {topPerformers.topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPerformers.topProducts} layout="vertical" margin={{ left: 20, right: 30 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} width={80} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#3b82f6', fontWeight: 800 }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-400 italic text-center py-12">{t.noRecords}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Staff Leaderboard */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">{t.staffLeaderboard}</h3>
          <div className="h-[300px] w-full">
            {staffLeaderboard.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffLeaderboard} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#10b981', fontWeight: 800 }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40}>
                    {staffLeaderboard.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <p className="text-sm font-bold uppercase tracking-widest">{t.noRecords}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-6 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-900 uppercase tracking-tight">{t.lowStockAlerts}</h3>
                <p className="text-rose-600 text-sm font-medium">{lowStockItems.length} {t.itemsRestock}</p>
              </div>
            </div>
            <button
              onClick={() => onViewChange(View.INVENTORY)}
              className="px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20"
            >
              {t.restockNow}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                  <p className="text-xs font-black text-rose-500 uppercase tracking-widest">{item.stock} {t.unitsLeft}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.alertQty}: {item.lowStockThreshold || 5}</p>
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

