import React, { useState, useRef, useMemo, useEffect, Suspense, lazy } from 'react';
import { Sale, Expense, Staff, Language, Customer, ShopSettings, AdvancePayment } from '../types';
import { TRANSLATIONS } from '../constants';
import { getFinancialInsights } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { parseISO, isValid, isSameMonth, isSameYear, format, getDaysInMonth } from 'date-fns';

const PerformanceBarChart = lazy(() => import('./Charts').then(m => ({ default: m.PerformanceBarChart })));

interface FinanceProps {
  sales: Sale[];
  expenses: Expense[];
  staffList: Staff[];
  customers: Customer[];
  currency: string;
  language: Language;
  currentUser: Staff;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onAddAdvance: (advance: AdvancePayment) => void;
  onDeleteAdvance: (id: string) => void;
  onDeleteSales: (ids: string[]) => void;
  settings: ShopSettings;
  advancePayments: AdvancePayment[];
}

const Finance: React.FC<FinanceProps> = ({ sales, expenses, staffList, customers, currency, language, currentUser, onAddExpense, onDeleteExpense, onAddAdvance, onDeleteAdvance, onDeleteSales, settings, advancePayments }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'expenses' | 'payroll' | 'cash-drawer'>(currentUser.role === 'admin' ? 'overview' : 'expenses');
  const [newExp, setNewExp] = useState<{ category: string; amount: string; description: string; receiptImage: string | null }>({
    category: '',
    amount: '',
    description: '',
    receiptImage: null
  });
  const [newAdvance, setNewAdvance] = useState<{ staffId: string; amount: string; description: string }>({
    staffId: '',
    amount: '',
    description: ''
  });
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [generatingAdvice, setGeneratingAdvice] = useState(false);

  // Date Filtering State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const filteredSales = useMemo(() => {
    const targetMonthStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;
    return sales.filter(sale => {
      const d = parseISO(sale.timestamp);
      if (!isValid(d)) return false;
      return format(d, 'yyyy-MM') === targetMonthStr;
    });
  }, [sales, selectedMonth, selectedYear]);

  const filteredExpenses = useMemo(() => {
    const targetMonthStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;
    return expenses.filter(exp => {
      const d = parseISO(exp.date);
      if (!isValid(d)) return false;
      return format(d, 'yyyy-MM') === targetMonthStr;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const filteredAdvances = useMemo(() => {
    const targetMonthStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;
    return advancePayments.filter(adv => {
      const d = parseISO(adv.date);
      if (!isValid(d)) return false;
      return format(d, 'yyyy-MM') === targetMonthStr;
    });
  }, [advancePayments, selectedMonth, selectedYear]);



  // Chart Logic
  const chartData = useMemo(() => {
    const days = getDaysInMonth(new Date(selectedYear, selectedMonth));
    return Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const dayStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const daySales = filteredSales.filter(s => format(parseISO(s.timestamp), 'yyyy-MM-dd') === dayStr);
      return {
        name: day.toString(),
        revenue: daySales.reduce((acc, s) => acc + s.total, 0)
      };
    });
  }, [filteredSales, selectedMonth, selectedYear]);


  // Hide tab bar on scroll logic
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const mainContainer = document.querySelector('main');
    if (!mainContainer) return;
    const handleScroll = () => {
      const currentScrollY = mainContainer.scrollTop;
      // Threshold to avoid flicker on small scrolls
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setIsTabBarVisible(false);
      } else {
        setIsTabBarVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    mainContainer.addEventListener('scroll', handleScroll);
    return () => mainContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[language];

  const enrichedSales = useMemo(() => {
    return filteredSales.map(sale => {
      const staffMember = staffList.find(s => s.id === sale.staffId);
      const customer = customers.find(c => c.id === sale.customerId);
      return {
        ...sale,
        staffName: sale.staffName || (staffMember ? staffMember.name : 'Unknown Staff'),
        customerName: sale.customerName || (customer ? customer.name : 'Walk-in Client')
      };
    });
  }, [filteredSales, staffList, customers]);

  const totalRevenue = filteredSales.reduce((a, b) => a + b.total, 0);
  const totalExpenses = filteredExpenses.reduce((a, b) => a + b.amount, 0);
  const totalTax = filteredSales.reduce((a, b) => a + (b.tax || 0), 0);
  const totalCostOfGoods = filteredSales.reduce((a, b) => a + (b.costOfGoods || 0), 0);

  const grossProfit = totalRevenue - totalCostOfGoods;
  const netProfit = totalRevenue - totalExpenses;

  const handleExportPL = () => {
    const csvContent = [
      ['Profit & Loss Statement'],
      ['Date', new Date().toLocaleDateString()],
      [''],
      ['Revenue', totalRevenue.toFixed(2)],
      ['Cost of Goods', `-${totalCostOfGoods.toFixed(2)}`],
      ['Gross Profit', grossProfit.toFixed(2)],
      ['Expenses', `-${totalExpenses.toFixed(2)}`],
      ['Net Profit', netProfit.toFixed(2)],
      [''],
      ['Tax Summary'],
      ['Taxable Revenue', totalRevenue.toFixed(2)],
      ['Tax Collected', totalTax.toFixed(2)],
      ['Estimated Tax Liability', totalTax.toFixed(2)]
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `PL_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Staff', 'Customer', 'Total', 'Tax', 'Payment Method'];
    const rows = enrichedSales.map(s => [
      new Date(s.timestamp).toLocaleDateString(),
      s.staffName,
      s.customerName,
      s.total.toFixed(2),
      (s.tax || 0).toFixed(2),
      s.paymentMethod
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedTransactions);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTransactions(newSet);
  };

  const toggleAll = () => {
    if (selectedTransactions.size === enrichedSales.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(enrichedSales.map(s => s.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTransactions.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDeleteSales(Array.from(selectedTransactions));
    setSelectedTransactions(new Set());
    setShowDeleteConfirm(false);
  };

  const handleGenerateAdvice = async () => {
    setGeneratingAdvice(true);
    try {
      const advice = await getFinancialInsights(filteredSales, filteredExpenses);
      setAiAdvice(advice);
    } catch (e) {
      setAiAdvice("Insight generation failed.");
    } finally {
      setGeneratingAdvice(false);
    }
  };



  const [cashDrawer, setCashDrawer] = useState<{
    startingCash: number;
    actualCash: number;
    isOpen: boolean;
    lastClosed: string | null;
    startTime?: string | null;
  }>(() => {
    const saved = localStorage.getItem('trimtime_cash_drawer');
    return saved ? JSON.parse(saved) : { startingCash: 0, actualCash: 0, isOpen: false, lastClosed: null, startTime: null };
  });

  useEffect(() => {
    localStorage.setItem('trimtime_cash_drawer', JSON.stringify(cashDrawer));
  }, [cashDrawer]);

  const handleOpenDrawer = (amount: number) => {
    setCashDrawer({ ...cashDrawer, startingCash: amount, isOpen: true, startTime: new Date().toISOString() });
  };

  const handleCloseDrawer = (actual: number) => {
    setCashDrawer({ ...cashDrawer, actualCash: actual, isOpen: false, lastClosed: new Date().toISOString() });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;
        if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
        else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setNewExp(prev => ({ ...prev, receiptImage: canvas.toDataURL('image/jpeg', 0.7) }));
      };
      if (event.target?.result) img.src = event.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.category || !newExp.amount) return;
    onAddExpense({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      category: newExp.category,
      amount: parseFloat(newExp.amount),
      description: newExp.description,
      receiptImage: newExp.receiptImage || undefined
    });
    setNewExp({ category: '', amount: '', description: '', receiptImage: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvance.staffId || !newAdvance.amount) return;
    onAddAdvance({
      id: Math.random().toString(36).substr(2, 9),
      staffId: newAdvance.staffId,
      amount: parseFloat(newAdvance.amount),
      date: new Date().toISOString().split('T')[0],
      description: newAdvance.description
    });
    setNewAdvance({ staffId: '', amount: '', description: '' });
  };

  const renderReceiptModal = () => {
    if (!viewingSale) return null;
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        onClick={() => setViewingSale(null)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
          className="bg-white text-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-slate-900 text-white p-6 text-center">
            <h2 className="font-brand text-2xl font-bold">{settings.shopName}</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{t.transactionReceipt}</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between text-xs border-b pb-4">
              <div>
                <p className="font-bold">{new Date(viewingSale.timestamp).toLocaleDateString(language)}</p>
                <p className="opacity-50 font-mono">#{viewingSale.id.slice(0, 8)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{viewingSale.staffName}</p>
                <p className="opacity-50">{viewingSale.customerName}</p>
              </div>
            </div>
            <div className="space-y-2 py-2 max-h-48 overflow-y-auto">
              {viewingSale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-bold">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-1">
              <div className="flex justify-between text-sm"><span>{t.total}</span><span className="text-xl font-black">{currency}{viewingSale.total.toFixed(2)}</span></div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs font-bold shadow-xl border border-slate-700">
          <p className="mb-1 text-slate-400">{label}</p>
          <p className="capitalize">{payload[0].name}: {currency}{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      <motion.div
        animate={{ y: isTabBarVisible ? 0 : -80, opacity: isTabBarVisible ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar sticky top-0 z-40"
      >
        <div className="flex gap-1 min-w-max w-full">
          {currentUser.role === 'admin' && (
            <>
              <button onClick={() => setActiveTab('overview')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>{t.overview}</button>
              <button onClick={() => setActiveTab('transactions')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'transactions' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>{t.transactions}</button>
              <button onClick={() => setActiveTab('payroll')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'payroll' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>{t.payroll}</button>
              <button onClick={() => setActiveTab('cash-drawer')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'cash-drawer' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>{t.cashDrawer}</button>
            </>
          )}
          <button onClick={() => setActiveTab('expenses')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'expenses' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>{t.expenses}</button>
        </div>
      </motion.div>

      {/* Date Filter Selection */}
      <div className="flex gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">{t.selectMonth}</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold border-none focus:ring-2 focus:ring-amber-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(2000, i).toLocaleString(language, { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">{t.selectYear}</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold border-none focus:ring-2 focus:ring-amber-500"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            {/* P&L and Tax Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black uppercase tracking-tight">📈 {t.profitAndLoss}</h3>
                  <button onClick={handleExportPL} className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest">{t.exportCSV}</button>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{t.revenue}</span>
                    <span className="font-black text-slate-900 dark:text-white">{currency}{totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{t.costOfGoods}</span>
                    <span className="font-black text-rose-500 dark:text-rose-400">-{currency}{totalCostOfGoods.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <span className="text-sm font-bold text-emerald-700">{t.grossProfit}</span>
                    <span className="font-black text-emerald-600">{currency}{grossProfit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{t.expenses}</span>
                    <span className="font-black text-rose-500 dark:text-rose-400">-{currency}{totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
                    <span className="text-sm font-black uppercase tracking-widest">{t.netProfit}</span>
                    <span className="text-xl font-black text-amber-400">{currency}{netProfit.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800">
                <h3 className="text-lg font-black uppercase tracking-tight mb-6">🧾 {t.taxSummary}</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{t.taxableRevenue}</span>
                    <span className="font-black text-slate-900 dark:text-white">{currency}{totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm font-bold text-slate-500">{t.taxCollected}</span>
                    <span className="font-black text-amber-600">{currency}{totalTax.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">{t.taxLiability}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{currency}{totalTax.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400 mt-2 italic">{t.basedOn} {settings.taxRate}% {settings.taxType} tax rate.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3">📊 {t.shopPerformance}</h3>
              <div className="h-64 w-full">
                <Suspense fallback={<div className="h-full w-full bg-slate-50 animate-pulse rounded-2xl" />}>
                  <PerformanceBarChart data={[{ name: 'Summary', rev: totalRevenue, exp: totalExpenses }]} color="#10b981" layout="horizontal" />
                </Suspense>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800">
                <h3 className="font-bold mb-4">{t.commissionReport}</h3>
                <div className="space-y-3">
                  {staffList.filter(s => s.role === 'employee').map(s => {
                    const sRev = filteredSales.filter(x => String(x.staffId) === String(s.id)).reduce((a, b) => a + b.total, 0);
                    const commissionEarned = (sRev * (s.commission || 0)) / 100;
                    return (
                      <div key={s.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{s.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t.revenue}: {currency}{sRev.toFixed(2)} ({s.commission || 0}%)</span>
                        </div>
                        <span className="font-black text-emerald-600">{currency}{commissionEarned.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[2rem] text-white">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">✨ {t.smartInsights}</h3>
                <p className="text-indigo-100 text-xs mb-6">{t.aiPrompt}</p>
                {aiAdvice ? (
                  <div className="bg-white/10 p-4 rounded-xl text-sm max-h-48 overflow-y-auto"><ReactMarkdown>{aiAdvice}</ReactMarkdown></div>
                ) : (
                  <button onClick={handleGenerateAdvice} disabled={generatingAdvice} className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-black text-xs uppercase disabled:opacity-50">{generatingAdvice ? '...' : t.generateAdvice}</button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'transactions' && (
          <motion.div key="tr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">{t.transactionHistory}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {enrichedSales.length} {t.totalSales} | <span className="text-emerald-500">Filtered for: {`${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`}</span>
                </p>
              </div>
              <button onClick={handleExportCSV} className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl uppercase tracking-widest flex items-center gap-2">
                <span>📥</span> {t.exportCSV}
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <input type="checkbox" onChange={toggleAll} checked={selectedTransactions.size === enrichedSales.length && enrichedSales.length > 0} className="w-5 h-5 rounded text-amber-500" />
                  <span className="text-xs font-bold">{selectedTransactions.size} Selected</span>
                </div>
                {selectedTransactions.size > 0 && <button onClick={handleDeleteSelected} className="text-rose-500 text-xs font-black uppercase min-h-[44px] px-4 flex items-center touch-manipulation active:opacity-70">{t.deleteSelected}</button>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400">
                    <tr><th className="p-4 w-10"></th><th className="p-4">{t.time}</th><th className="p-4">{t.details}</th><th className="p-4">{t.total}</th><th className="p-4">{t.action}</th></tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {enrichedSales.slice().reverse().map(sale => (
                      <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-4"><input type="checkbox" checked={selectedTransactions.has(sale.id)} onChange={() => toggleSelection(sale.id)} className="w-5 h-5 rounded text-amber-500" /></td>
                        <td className="p-4 text-xs font-bold">{new Date(sale.timestamp).toLocaleDateString(language)}</td>
                        <td className="p-4"><p className="text-sm font-bold">{sale.staffName}</p><p className="text-xs text-slate-400">{sale.customerName}</p></td>
                        <td className="p-4 font-black">{currency}{sale.total.toFixed(2)}</td>
                        <td className="p-4"><button onClick={() => setViewingSale(sale)} className="text-amber-500 font-bold text-xs">{t.view}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'expenses' && (
          <motion.div key="ex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800">
              <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder={t.category} value={newExp.category} onChange={e => setNewExp({ ...newExp, category: e.target.value })} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm" required />
                  <input type="number" placeholder={t.amount} value={newExp.amount} onChange={e => setNewExp({ ...newExp, amount: e.target.value })} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm" required />
                </div>
                <input type="text" placeholder={t.description} value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm" />
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer bg-slate-50 dark:bg-slate-800 border-2 border-dashed rounded-xl p-3 text-center text-slate-400 text-xs font-bold">
                    {newExp.receiptImage ? '✅ Attached' : '📸 Image'}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                  </label>
                  <button type="submit" className="flex-1 bg-amber-500 text-slate-900 py-3 rounded-xl font-black uppercase text-xs">{t.save}</button>
                </div>
              </form>
            </div>
            <div className="space-y-3">
              {filteredExpenses.slice().reverse().map(exp => (
                <div key={exp.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 flex justify-between items-center transition-all hover:border-amber-500/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">🧾</div>
                    <div><p className="font-bold dark:text-white">{exp.category}</p><p className="text-[10px] opacity-50 dark:text-slate-400">{exp.date}</p></div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-rose-500 dark:text-rose-400">{currency}{exp.amount.toFixed(2)}</p>
                    <button onClick={() => onDeleteExpense(exp.id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[10px] text-slate-400 hover:text-rose-500 active:text-rose-600 transition-colors uppercase font-bold touch-manipulation">{t.delete}</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'payroll' && (
          <motion.div key="py" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800">
                <h3 className="font-bold mb-4 flex items-center gap-2">💸 {t.addAdvance}</h3>
                <form onSubmit={handleAddAdvanceSubmit} className="space-y-4">
                  <select
                    value={newAdvance.staffId}
                    onChange={e => setNewAdvance({ ...newAdvance, staffId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm"
                    required
                  >
                    <option value="">{t.chooseProfessional}</option>
                    {staffList.filter(s => s.role === 'employee').map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder={t.amount}
                    value={newAdvance.amount}
                    onChange={e => setNewAdvance({ ...newAdvance, amount: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t.description}
                    value={newAdvance.description}
                    onChange={e => setNewAdvance({ ...newAdvance, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm"
                  />
                  <button type="submit" className="w-full bg-amber-500 text-slate-900 py-3 rounded-xl font-black uppercase text-xs">
                    {t.saveChanges}
                  </button>
                </form>

                <div className="mt-8 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.history}</h4>
                  {filteredAdvances.slice().reverse().map(adv => {
                    const staff = staffList.find(s => s.id === adv.staffId);
                    return (
                      <div key={adv.id} className="p-3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl flex justify-between items-center transition-all hover:border-amber-500/30">
                        <div>
                          <p className="text-xs font-bold dark:text-white">{staff?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-400">{adv.date}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <p className="text-xs font-black text-amber-600 dark:text-amber-500">{currency}{adv.amount.toFixed(2)}</p>
                          <button onClick={() => onDeleteAdvance(adv.id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[9px] text-rose-500 font-bold uppercase hover:underline active:opacity-70 touch-manipulation">{t.remove}</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800">
                <h3 className="font-bold mb-6 flex items-center gap-2">🧾 {t.payoutSummary}</h3>
                <div className="space-y-4">
                  {staffList.filter(s => s.role === 'employee').map(s => {
                    const sSales = filteredSales.filter(x => String(x.staffId) === String(s.id));
                    const sRev = sSales.reduce((a, b) => a + b.total, 0);

                    // Calculation logic
                    let baseRevenue = sRev;
                    if (settings.deductExpensesFromCommission) {
                      const expenseShare = totalRevenue > 0 ? (sRev / totalRevenue) * totalExpenses : 0;
                      baseRevenue = Math.max(0, sRev - expenseShare);
                    }

                    const commissionEarned = (baseRevenue * (s.commission || 0)) / 100;
                    const totalAdvances = filteredAdvances.filter(a => a.staffId === s.id).reduce((a, b) => a + b.amount, 0);
                    const finalPayout = Math.max(0, commissionEarned - totalAdvances);

                    return (
                      <div key={s.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-black">{s.name}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t.commission}: {s.commission}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.totalSales}</p>
                            <p className="text-xl font-black">{currency}{sRev.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t dark:border-slate-700">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{t.netCommission}</p>
                            <p className="font-bold text-emerald-600">{currency}{commissionEarned.toFixed(2)}</p>
                            {settings.deductExpensesFromCommission && (
                              <p className="text-[9px] text-rose-400 italic">{t.afterExpenseShare}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{t.totalAdvances}</p>
                            <p className="font-bold text-amber-600">-{currency}{totalAdvances.toFixed(2)}</p>
                          </div>
                          <div className="col-span-2 md:col-span-1 bg-amber-500 text-slate-950 p-3 rounded-2xl text-center">
                            <p className="text-[10px] font-black uppercase mb-1">{t.finalPayout}</p>
                            <p className="text-lg font-black">{currency}{finalPayout.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === 'cash-drawer' && (
          <motion.div key="cd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800">
                <h3 className="text-lg font-black uppercase tracking-tight mb-6">💰 {t.cashDrawer}</h3>

                {!cashDrawer.isOpen ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 mb-4">{t.drawerClosedMessage}</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        id="startingCashInput"
                        placeholder={t.startingCash}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm"
                      />
                      <button
                        onClick={() => {
                          const val = parseFloat((document.getElementById('startingCashInput') as HTMLInputElement).value);
                          if (!isNaN(val)) handleOpenDrawer(val);
                        }}
                        className="bg-amber-500 text-slate-900 px-6 py-3 rounded-xl font-black uppercase text-xs"
                      >
                        {t.openDrawer}
                      </button>
                    </div>
                    {cashDrawer.lastClosed && (
                      <p className="text-[10px] text-slate-400 mt-4">{t.lastClosed}: {new Date(cashDrawer.lastClosed).toLocaleString()}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.startingCash}</p>
                        <p className="text-xl font-black">{currency}{cashDrawer.startingCash.toFixed(2)}</p>
                      </div>
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{t.expectedCash}</p>
                        <p className="text-xl font-black">{currency}{(cashDrawer.startingCash + filteredSales.filter(s => s.paymentMethod === 'cash' && cashDrawer.startTime && s.timestamp >= cashDrawer.startTime).reduce((a, b) => a + b.total, 0)).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t dark:border-slate-800">
                      <p className="text-sm font-bold">{t.closeDrawer}</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          id="actualCashInput"
                          placeholder={t.actualCash}
                          className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm"
                        />
                        <button
                          onClick={() => {
                            const val = parseFloat((document.getElementById('actualCashInput') as HTMLInputElement).value);
                            if (!isNaN(val)) handleCloseDrawer(val);
                          }}
                          className="bg-rose-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs"
                        >
                          {t.closeDrawer}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800">
                <h3 className="text-lg font-black uppercase tracking-tight mb-6">📊 Session Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm font-bold text-slate-500">{t.cashSales}</span>
                    <span className="font-black text-emerald-600">+{currency}{filteredSales.filter(s => s.paymentMethod === 'cash' && cashDrawer.startTime && s.timestamp >= cashDrawer.startTime).reduce((a, b) => a + b.total, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm font-bold text-slate-500">{t.cardSales}</span>
                    <span className="font-black text-blue-600">+{currency}{filteredSales.filter(s => s.paymentMethod === 'card' && cashDrawer.startTime && s.timestamp >= cashDrawer.startTime).reduce((a, b) => a + b.total, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm font-bold text-slate-500">{t.splitSales}</span>
                    <span className="font-black text-indigo-600">+{currency}{filteredSales.filter(s => s.paymentMethod === 'split' && cashDrawer.startTime && s.timestamp >= cashDrawer.startTime).reduce((a, b) => a + b.total, 0).toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t dark:border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black uppercase tracking-widest">{t.totalSessionRevenue}</span>
                      <span className="text-xl font-black text-slate-900">{currency}{totalRevenue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{viewingSale && renderReceiptModal()}</AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
            style={{ touchAction: 'none' }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">{t.deleteData}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8">{t.confirmDeleteTransactions}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-4 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 active:bg-rose-700 transition-colors shadow-lg shadow-rose-500/20 touch-manipulation"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Finance;
