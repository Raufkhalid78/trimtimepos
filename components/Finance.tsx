
import React, { useState, useRef, useMemo, useEffect, Suspense, lazy } from 'react';
import { useData } from '../contexts/DataContext';
import { Sale, Expense, Staff, Language, Customer, ShopSettings, AdvancePayment } from '../types';
import { TRANSLATIONS } from '../constants';
import { getFinancialInsights } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { parseISO, isValid, isSameMonth, isSameYear, format, getDaysInMonth, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

const PerformanceBarChart = lazy(() => import('./Charts').then(m => ({ default: m.PerformanceBarChart })));

// Helper to calculate split commissions (service vs product)
const calculateCommissionForStaff = (staffMember: Staff, salesList: Sale[]) => {
  let commission = 0;
  salesList.forEach(sale => {
    let saleServiceTotal = 0;
    let saleProductTotal = 0;
    sale.items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      if (item.type === 'service') {
        saleServiceTotal += itemTotal;
      } else {
        saleProductTotal += itemTotal;
      }
    });

    const itemSum = saleServiceTotal + saleProductTotal;
    if (itemSum <= 0) return;

    const serviceProp = saleServiceTotal / itemSum;
    const productProp = saleProductTotal / itemSum;

    // net commissionable amount after discounts
    const netAmount = Math.max(0, sale.subtotal - sale.discount);

    const serviceNet = netAmount * serviceProp;
    const productNet = netAmount * productProp;

    const servRate = staffMember.commissionServices !== undefined ? staffMember.commissionServices : (staffMember.commission || 0);
    const prodRate = staffMember.commissionProducts !== undefined ? staffMember.commissionProducts : (staffMember.commission || 0);

    commission += (serviceNet * servRate) / 100 + (productNet * prodRate) / 100;
  });
  return commission;
};

const financeWarnTranslations = {
  en: "Historical Data Limit: To optimize performance, reports show data from the last 90 days only. Older records are safely stored in the database.",
  ur: "تاریخی ڈیٹا کی حد: کارکردگی کو بہتر بنانے کے لیے، رپورٹس صرف گزشتہ 90 دنوں کا ڈیٹا دکھاتی ہیں۔ پرانے ریکارڈز ڈیٹا بیس میں محفوظ ہیں۔",
  ar: "حد البيانات التاريخية: لتحسين الأداء، تعرض التقارير بيانات آخر 90 يومًا فقط. السجلات الأقدم محفوظة بشكل آمن في قاعدة البيانات.",
  hi: "ऐतिहासिक डेटा सीमा: प्रदर्शन को बेहतर बनाने के लिए, रिपोर्ट केवल पिछले 90 दिनों का डेटा दिखाती हैं। पुराने रिकॉर्ड डेटाबेस में सुरक्षित हैं।"
};

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
  
  const { branches } = useData();
  const [selectedBranchId, setSelectedBranchId] = useState('all');

  const currentSales = useMemo(() => {
    return selectedBranchId === 'all' ? sales : sales.filter(s => s.branchId === selectedBranchId);
  }, [sales, selectedBranchId]);

  const currentExpenses = useMemo(() => {
    return selectedBranchId === 'all' ? expenses : expenses.filter(e => e.branchId === selectedBranchId);
  }, [expenses, selectedBranchId]);

  const currentAdvances = useMemo(() => {
    return selectedBranchId === 'all' ? advancePayments : advancePayments.filter(a => {
      const s = staffList.find(x => x.id === a.staffId);
      return s && s.branchId === selectedBranchId;
    });
  }, [advancePayments, selectedBranchId, staffList]);

  const currentStaffList = useMemo(() => {
    return selectedBranchId === 'all' ? staffList : staffList.filter(s => s.branchId === selectedBranchId);
  }, [staffList, selectedBranchId]);
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

  const [payrollStart, setPayrollStart] = useState<string>(format(new Date(), 'yyyy-MM-01'));
  const [payrollEnd, setPayrollEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [confirmingPayStaffId, setConfirmingPayStaffId] = useState<string | null>(null);
  const [paidStaffIds, setPaidStaffIds] = useState<Set<string>>(new Set());

  const filteredSales = useMemo(() => {
    const targetMonthStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;
    return currentSales.filter(sale => {
      const d = parseISO(sale.timestamp);
      if (!isValid(d)) return false;
      return format(d, 'yyyy-MM') === targetMonthStr;
    });
  }, [currentSales, selectedMonth, selectedYear]);

  const filteredExpenses = useMemo(() => {
    const targetMonthStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;
    return currentExpenses.filter(exp => {
      const d = parseISO(exp.date);
      if (!isValid(d)) return false;
      return format(d, 'yyyy-MM') === targetMonthStr;
    });
  }, [currentExpenses, selectedMonth, selectedYear]);

  const filteredAdvances = useMemo(() => {
    const targetMonthStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;
    return currentAdvances.filter(adv => {
      const d = parseISO(adv.date);
      if (!isValid(d)) return false;
      return format(d, 'yyyy-MM') === targetMonthStr;
    });
  }, [currentAdvances, selectedMonth, selectedYear]);

  const payrollSales = useMemo(() => {
    if (!payrollStart || !payrollEnd) return [];
    const start = startOfDay(parseISO(payrollStart));
    const end = endOfDay(parseISO(payrollEnd));
    return currentSales.filter(sale => {
      const d = parseISO(sale.timestamp);
      if (!isValid(d)) return false;
      return isWithinInterval(d, { start, end });
    });
  }, [currentSales, payrollStart, payrollEnd]);

  const payrollAdvances = useMemo(() => {
    if (!payrollStart || !payrollEnd) return [];
    const start = startOfDay(parseISO(payrollStart));
    const end = endOfDay(parseISO(payrollEnd));
    return currentAdvances.filter(adv => {
      const d = parseISO(adv.date);
      if (!isValid(d)) return false;
      return isWithinInterval(d, { start, end });
    });
  }, [currentAdvances, payrollStart, payrollEnd]);



  // Chart Logic
  const chartData = useMemo(() => {
    const days = getDaysInMonth(new Date(selectedYear, selectedMonth));
    return Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const dayStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      // Exclude refunded sales from chart
      const daySales = filteredSales.filter(s => !s.isRefunded && format(parseISO(s.timestamp), 'yyyy-MM-dd') === dayStr);
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

  const totalRevenue = filteredSales.filter(s => !s.isRefunded).reduce((a, b) => a + b.total, 0);
  const totalRefunds = filteredSales.filter(s => s.isRefunded).reduce((a, b) => a + b.total, 0);
  const totalExpenses = filteredExpenses.reduce((a, b) => a + b.amount, 0);
  const totalTax = filteredSales.filter(s => !s.isRefunded).reduce((a, b) => a + (b.tax || 0), 0);
  const totalCostOfGoods = filteredSales.filter(s => !s.isRefunded).reduce((a, b) => a + (b.costOfGoods || 0), 0);

  const grossProfit = totalRevenue - totalCostOfGoods;
  const netProfit = totalRevenue - totalRefunds - totalExpenses;

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

  
  const handleExportQuickBooks = () => {
    const headers = ['Date', 'Ref No', 'Customer', 'Payment Method', 'Item Type', 'Item Name', 'Quantity', 'Amount', 'Tax'];
    const rows = [];
    
    enrichedSales.forEach(s => {
      s.items.forEach(item => {
        rows.push([
          new Date(s.timestamp).toISOString().split('T')[0],
          s.id,
          s.customerName || 'Walk-in',
          s.paymentMethod,
          item.type,
          item.name,
          item.quantity,
          item.price.toFixed(2),
          ((s.tax || 0) / s.items.length).toFixed(2)
        ]);
      });
    });

    const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `quickbooks_sales_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportXero = () => {
    const headers = ['*ContactName', 'EmailAddress', 'Date', 'InvoiceNumber', 'Reference', '*Description', '*Quantity', '*UnitAmount', 'TaxType', 'TaxAmount'];
    const rows = [];
    
    enrichedSales.forEach(s => {
      s.items.forEach(item => {
        rows.push([
          s.customerName || 'Walk-in Client',
          '',
          new Date(s.timestamp).toISOString().split('T')[0],
          s.id,
          s.paymentMethod,
          item.name,
          item.quantity,
          item.price.toFixed(2),
          s.tax > 0 ? 'Tax on Sales' : 'Tax Exempt',
          ((s.tax || 0) / s.items.length).toFixed(2)
        ]);
      });
    });

    const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `xero_sales_${new Date().toISOString().split('T')[0]}.csv`);
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
        className="flex bg-[var(--tt-surface)] p-1.5 rounded-2xl shadow-sm border border-[var(--tt-border)] overflow-x-auto no-scrollbar sticky top-0 z-40"
      >
        <div className="flex gap-1 min-w-max w-full">
          {currentUser.role === 'admin' && (
            <>
              <button onClick={() => setActiveTab('overview')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-[var(--tt-amber)] text-slate-950 shadow-lg shadow-[var(--tt-amber-glow)]' : 'text-[var(--tt-text-muted)] hover:text-[var(--tt-text-main)]'}`}>{t.overview}</button>
              <button onClick={() => setActiveTab('transactions')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'transactions' ? 'bg-[var(--tt-amber)] text-slate-950 shadow-lg shadow-[var(--tt-amber-glow)]' : 'text-[var(--tt-text-muted)] hover:text-[var(--tt-text-main)]'}`}>{t.transactions}</button>
              <button onClick={() => setActiveTab('payroll')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'payroll' ? 'bg-[var(--tt-amber)] text-slate-950 shadow-lg shadow-[var(--tt-amber-glow)]' : 'text-[var(--tt-text-muted)] hover:text-[var(--tt-text-main)]'}`}>{t.payroll}</button>
              <button onClick={() => setActiveTab('cash-drawer')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'cash-drawer' ? 'bg-[var(--tt-amber)] text-slate-950 shadow-lg shadow-[var(--tt-amber-glow)]' : 'text-[var(--tt-text-muted)] hover:text-[var(--tt-text-main)]'}`}>{t.cashDrawer}</button>
            </>
          )}
          <button onClick={() => setActiveTab('expenses')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'expenses' ? 'bg-[var(--tt-amber)] text-slate-950 shadow-lg shadow-[var(--tt-amber-glow)]' : 'text-[var(--tt-text-muted)] hover:text-[var(--tt-text-main)]'}`}>{t.expenses}</button>
        </div>
      </motion.div>

      {/* Date Filter Selection */}
      <div className="flex gap-4 items-center bg-[var(--tt-surface)] p-4 rounded-3xl border border-[var(--tt-border)] shadow-sm flex-wrap md:flex-nowrap">
        {branches.length > 1 && (
          <div className="flex-1 flex flex-col gap-1 min-w-[150px]">
            <label className="text-[10px] font-black uppercase text-[var(--tt-text-muted)] tracking-widest px-2">{t.locationsAndBranches || 'Location'}</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="tt-input py-2.5"
            >
              <option value="all">{t.allBranches || 'All Locations'}</option>
              {branches.filter(b => b.isActive).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-[var(--tt-text-muted)] tracking-widest px-2">{t.selectMonth}</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="tt-input py-2.5"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(2000, i).toLocaleString(language, { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-[var(--tt-text-muted)] tracking-widest px-2">{t.selectYear}</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="tt-input py-2.5"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>
      </div>

      {/* 90-day Data Window Info Warning (BUG-06) */}
      <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-3xl text-amber-400 text-xs flex items-start gap-3 shadow-sm no-print">
        <span className="text-base shrink-0">⚠️</span>
        <p className="leading-relaxed font-bold">
          {financeWarnTranslations[language] || financeWarnTranslations['en']}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            {/* P&L and Tax Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="tt-card p-8 md:p-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black uppercase tracking-tight text-[var(--tt-text-main)]">📈 {t.profitAndLoss}</h3>
                  <button onClick={handleExportPL} className="text-[10px] font-black text-[var(--tt-amber)] bg-[var(--tt-amber)]/10 px-4 py-1.5 rounded-full uppercase tracking-widest hover:bg-[var(--tt-amber)]/20 transition-colors">{t.exportCSV}</button>
                </div>
                <div className="space-y-5">
                  <div className="flex justify-between items-center p-4 bg-[var(--tt-surface-2)] rounded-2xl border border-[var(--tt-border)]">
                    <span className="text-sm font-bold text-[var(--tt-text-muted)]">{t.revenue}</span>
                    <span className="font-black text-[var(--tt-text-main)] text-lg">{currency}{totalRevenue.toFixed(2)}</span>
                  </div>
                  {totalRefunds > 0 && (
                    <div className="flex justify-between items-center p-4 bg-rose-500/5 rounded-2xl border border-rose-500/20">
                      <span className="text-sm font-bold text-rose-500">{t.refunds || 'Refunds'}</span>
                      <span className="font-black text-rose-500">-{currency}{totalRefunds.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-4 bg-[var(--tt-surface-2)] rounded-2xl border border-[var(--tt-border)]">
                    <span className="text-sm font-bold text-[var(--tt-text-muted)]">{t.costOfGoods}</span>
                    <span className="font-black text-rose-500">-{currency}{totalCostOfGoods.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <span className="text-sm font-black text-emerald-500 uppercase tracking-widest">{t.grossProfit}</span>
                    <span className="font-black text-emerald-500 text-lg">{currency}{grossProfit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-[var(--tt-surface-2)] rounded-2xl border border-[var(--tt-border)]">
                    <span className="text-sm font-bold text-[var(--tt-text-muted)]">{t.expenses}</span>
                    <span className="font-black text-rose-500">-{currency}{totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="p-6 bg-white text-slate-950 rounded-[2rem] shadow-2xl shadow-white/5 mt-8 border border-white/20">
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t.netProfit}</span>
                       <span className={`text-3xl font-black tracking-tighter ${netProfit < 0 ? 'text-rose-500' : ''}`}>{netProfit < 0 ? '-' : ''}{currency}{Math.abs(netProfit).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tt-card p-6">
                <h3 className="text-lg font-black uppercase tracking-tight mb-6">🧾 {t.taxSummary}</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-[var(--tt-surface-2)] rounded-xl border border-[var(--tt-border)]">
                    <span className="text-sm font-bold text-[var(--tt-text-muted)]">{t.taxableRevenue}</span>
                    <span className="font-black text-[var(--tt-text-main)]">{currency}{totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[var(--tt-surface-2)] rounded-xl border border-[var(--tt-border)]">
                    <span className="text-sm font-bold text-[var(--tt-text-muted)]">{t.taxCollected}</span>
                    <span className="font-black text-[var(--tt-amber)]">{currency}{totalTax.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-[var(--tt-amber-glow)] rounded-2xl border border-[var(--tt-amber)]/20">
                    <p className="text-[10px] font-black text-[var(--tt-amber)] uppercase tracking-widest mb-1">{t.taxLiability}</p>
                    <p className="text-2xl font-black text-[var(--tt-text-main)]">{currency}{totalTax.toFixed(2)}</p>
                    <p className="text-[10px] text-[var(--tt-text-muted)] mt-2 italic">{t.basedOn} {settings.taxRate}% {settings.taxType} tax rate.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="tt-card p-6">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-[var(--tt-text-main)]">📊 {t.shopPerformance}</h3>
              <div className="h-64 w-full">
                <Suspense fallback={<div className="h-full w-full bg-[var(--tt-surface-2)] animate-pulse rounded-2xl" />}>
                  <PerformanceBarChart data={[{ name: 'Summary', rev: totalRevenue, exp: totalExpenses }]} color="var(--tt-emerald)" layout="horizontal" />
                </Suspense>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="tt-card p-6">
                <h3 className="font-bold mb-4 text-[var(--tt-text-main)]">{t.commissionReport}</h3>
                <div className="space-y-3">
                  {currentStaffList.filter(s => s.role === 'employee').map(s => {
                    const sRev = filteredSales.filter(x => String(x.staffId) === String(s.id) && !x.isRefunded).reduce((a, b) => a + b.total, 0);
                    const commissionEarned = calculateCommissionForStaff(s, filteredSales.filter(x => String(x.staffId) === String(s.id) && !x.isRefunded));
                    return (
                      <div key={s.id} className="flex justify-between items-center p-4 bg-[var(--tt-surface-2)] border border-[var(--tt-border)] rounded-2xl">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[var(--tt-text-main)]">{s.name}</span>
                          <span className="text-[10px] text-[var(--tt-text-muted)] font-bold uppercase tracking-tighter">{t.revenue}: {currency}{sRev.toFixed(2)} ({s.commission || 0}%)</span>
                        </div>
                        <span className="font-black text-[var(--tt-emerald)]">{currency}{commissionEarned.toFixed(2)}</span>
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
            <div className="tt-card p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-[var(--tt-text-main)]">{t.transactionHistory}</h3>
                <p className="text-[10px] text-[var(--tt-text-muted)] font-bold uppercase tracking-widest">
                  {enrichedSales.length} {t.totalSales} | <span className="text-[var(--tt-emerald)]">Filtered for: {`${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`}</span>
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={handleExportCSV} className="text-[10px] font-black text-[var(--tt-text-main)] bg-slate-800 border border-[var(--tt-border)] px-4 py-2 rounded-xl uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 transition-colors">
                  <span>📥</span> {t.exportCSV || 'Export CSV'}
                </button>
                <button onClick={handleExportQuickBooks} className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl uppercase tracking-widest flex items-center gap-2 hover:bg-amber-500/20 transition-colors">
                  <span>📊</span> QuickBooks
                </button>
                <button onClick={handleExportXero} className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-4 py-2 rounded-xl uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500/20 transition-colors">
                  <span>💼</span> Xero
                </button>
              </div>
            </div>
            <div className="tt-card overflow-hidden">
              <div className="p-4 border-b border-[var(--tt-border)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <input type="checkbox" onChange={toggleAll} checked={selectedTransactions.size === enrichedSales.length && enrichedSales.length > 0} className="w-5 h-5 rounded text-[var(--tt-amber)] bg-[var(--tt-surface-2)] border-[var(--tt-border)]" />
                  <span className="text-xs font-bold text-[var(--tt-text-main)]">{selectedTransactions.size} Selected</span>
                </div>
                {selectedTransactions.size > 0 && <button onClick={handleDeleteSelected} className="text-[var(--tt-rose)] text-xs font-black uppercase min-h-[44px] px-4 flex items-center touch-manipulation active:opacity-70">{t.deleteSelected}</button>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[var(--tt-surface-2)] text-[10px] font-black uppercase text-[var(--tt-text-muted)]">
                    <tr><th className="p-4 w-10"></th><th className="p-4">{t.time}</th><th className="p-4">{t.details}</th><th className="p-4">{t.total}</th><th className="p-4">{t.action}</th></tr>
                  </thead>
                  <tbody className="divide-y border-[var(--tt-border)]">
                    {enrichedSales.slice().reverse().map(sale => (
                      <tr key={sale.id} className={`hover:bg-[var(--tt-surface-2)]/50 transition-colors ${sale.isRefunded ? 'opacity-60' : ''}`}>
                        <td className="p-4"><input type="checkbox" checked={selectedTransactions.has(sale.id)} onChange={() => toggleSelection(sale.id)} className="w-5 h-5 rounded text-[var(--tt-amber)] bg-[var(--tt-surface-2)] border-[var(--tt-border)]" /></td>
                        <td className="p-4 text-xs font-bold text-[var(--tt-text-main)]">{new Date(sale.timestamp).toLocaleDateString(language)}</td>
                        <td className="p-4"><p className="text-sm font-bold text-[var(--tt-text-main)]">{sale.staffName}</p><p className="text-xs text-[var(--tt-text-muted)]">{sale.customerName}</p></td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-black ${sale.isRefunded ? 'text-rose-400 line-through' : 'text-[var(--tt-text-main)]'}`}>{currency}{sale.total.toFixed(2)}</span>
                            {sale.isRefunded && (
                              <span className="text-[9px] font-black bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full uppercase tracking-wider border border-rose-500/20">
                                {t.refunds || 'Refunded'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4"><button onClick={() => setViewingSale(sale)} className="text-[var(--tt-amber)] font-bold text-xs">{t.view}</button></td>
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
            <div className="tt-card p-6">
              <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder={t.category} value={newExp.category} onChange={e => setNewExp({ ...newExp, category: e.target.value })} className="tt-input" required />
                  <input type="number" placeholder={t.amount} value={newExp.amount} onChange={e => setNewExp({ ...newExp, amount: e.target.value })} className="tt-input" required />
                </div>
                <input type="text" placeholder={t.description} value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} className="tt-input" />
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer bg-[var(--tt-surface-2)] border-2 border-dashed border-[var(--tt-border)] rounded-2xl p-3 text-center text-[var(--tt-text-muted)] text-xs font-bold hover:border-[var(--tt-amber)]/50 transition-colors">
                    {newExp.receiptImage ? '✅ Attached' : '📸 Image'}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                  </label>
                  <button type="submit" className="tt-button-primary flex-1 py-3 text-xs">{t.save}</button>
                </div>
              </form>
            </div>
            <div className="space-y-3">
              {filteredExpenses.slice().reverse().map(exp => (
                <div key={exp.id} className="tt-card p-4 flex justify-between items-center transition-all hover:border-[var(--tt-amber)]/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--tt-surface-2)] border border-[var(--tt-border)] flex items-center justify-center text-lg">🧾</div>
                    <div><p className="font-bold text-[var(--tt-text-main)]">{exp.category}</p><p className="text-[10px] text-[var(--tt-text-muted)] font-bold">{exp.date}</p></div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[var(--tt-rose)]">{currency}{exp.amount.toFixed(2)}</p>
                    <button onClick={() => onDeleteExpense(exp.id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[10px] text-[var(--tt-text-muted)] hover:text-[var(--tt-rose)] active:text-[var(--tt-rose)] transition-colors uppercase font-bold touch-manipulation">{t.delete}</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'payroll' && (
          <motion.div key="py" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 tt-card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-[var(--tt-text-main)]">💸 {t.addAdvance}</h3>
                <form onSubmit={handleAddAdvanceSubmit} className="space-y-4">
                  <select
                    value={newAdvance.staffId}
                    onChange={e => setNewAdvance({ ...newAdvance, staffId: e.target.value })}
                    className="tt-input"
                    required
                  >
                    <option value="">{t.chooseProfessional}</option>
                    {currentStaffList.filter(s => s.role === 'employee').map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder={t.amount}
                    value={newAdvance.amount}
                    onChange={e => setNewAdvance({ ...newAdvance, amount: e.target.value })}
                    className="tt-input"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t.description}
                    value={newAdvance.description}
                    onChange={e => setNewAdvance({ ...newAdvance, description: e.target.value })}
                    className="tt-input"
                  />
                  <button type="submit" className="tt-button-primary w-full py-3 text-xs">
                    {t.saveChanges}
                  </button>
                </form>

                <div className="mt-8 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-[var(--tt-text-muted)] tracking-widest">{t.history}</h4>
                  {filteredAdvances.slice().reverse().map(adv => {
                    const staff = staffList.find(s => s.id === adv.staffId);
                    return (
                      <div key={adv.id} className="p-3 bg-[var(--tt-surface-2)] border border-[var(--tt-border)] rounded-xl flex justify-between items-center transition-all hover:border-[var(--tt-amber)]/30">
                        <div>
                          <p className="text-xs font-bold text-[var(--tt-text-main)]">{staff?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-[var(--tt-text-muted)]">{adv.date}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <p className="text-xs font-black text-[var(--tt-amber)]">{currency}{adv.amount.toFixed(2)}</p>
                          <button onClick={() => onDeleteAdvance(adv.id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[9px] text-[var(--tt-rose)] font-bold uppercase hover:underline active:opacity-70 touch-manipulation">{t.remove}</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-2 tt-card p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="font-bold flex items-center gap-2 text-[var(--tt-text-main)]">🧾 {t.payoutSummary}</h3>
                  <div className="flex gap-2 items-center bg-[var(--tt-surface-2)] p-1 rounded-xl border border-[var(--tt-border)]">
                    <input type="date" value={payrollStart} onChange={e => setPayrollStart(e.target.value)} className="bg-transparent border-none text-xs font-bold text-[var(--tt-text-main)] px-2 outline-none cursor-pointer" />
                    <span className="text-[var(--tt-text-muted)] font-black">-</span>
                    <input type="date" value={payrollEnd} onChange={e => setPayrollEnd(e.target.value)} className="bg-transparent border-none text-xs font-bold text-[var(--tt-text-main)] px-2 outline-none cursor-pointer" />
                  </div>
                </div>
                <div className="space-y-4">
                  {currentStaffList.filter(s => s.role === 'employee').map(s => {
                    const sSales = payrollSales.filter(x => String(x.staffId) === String(s.id) && !x.isRefunded);
                    const sRev = sSales.reduce((a, b) => a + b.total, 0);
                    const tipTotal = sSales.reduce((a, b) => a + (b.tip || 0), 0);
                    const baseSalary = s.baseSalary || 0;

                    // Calculation logic
                    const pRev = payrollSales.filter(x => !x.isRefunded).reduce((a, b) => a + b.total, 0);
                    let baseRevenue = sRev;
                    if (settings.deductExpensesFromCommission) {
                      const expenseShare = pRev > 0 ? (sRev / pRev) * totalExpenses : 0;
                      baseRevenue = Math.max(0, sRev - expenseShare);
                    }

                    const commissionEarnedRaw = calculateCommissionForStaff(s, sSales);
                    let commissionEarned = commissionEarnedRaw;
                    if (settings.deductExpensesFromCommission && sRev > 0) {
                      const ratio = Math.max(0, sRev - (pRev > 0 ? (sRev / pRev) * totalExpenses : 0)) / sRev;
                      commissionEarned = commissionEarnedRaw * ratio;
                    }
                    const totalAdvances = payrollAdvances.filter(a => a.staffId === s.id).reduce((a, b) => a + b.amount, 0);
                    const finalPayout = Math.max(0, baseSalary + tipTotal + commissionEarned - totalAdvances);

                    const isConfirming = confirmingPayStaffId === s.id;
                    const isPaid = paidStaffIds.has(s.id);

                    const handleMarkPaid = () => {
                      const expense = {
                        id: 'e' + Date.now().toString(36),
                        date: format(new Date(), 'yyyy-MM-dd'),
                        category: 'Payroll',
                        amount: finalPayout,
                        description: `Payroll for ${s.name} (${payrollStart} to ${payrollEnd})`
                      };
                      const advance = {
                        id: 'a' + Date.now().toString(36),
                        staffId: s.id,
                        amount: finalPayout,
                        date: format(new Date(), 'yyyy-MM-dd'),
                        description: `Payroll settlement (${payrollStart} to ${payrollEnd})`
                      };
                      onAddExpense(expense as any);
                      onAddAdvance(advance);
                      setConfirmingPayStaffId(null);
                      setPaidStaffIds(prev => new Set(prev).add(s.id));
                    };

                    return (
                      <div key={s.id} className="p-6 bg-[var(--tt-surface-2)] rounded-3xl border border-[var(--tt-border)] shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-black text-[var(--tt-text-main)]">{s.name}</h4>
                            <p className="text-xs text-[var(--tt-text-muted)] font-bold uppercase tracking-widest">
                              {t.commission}: {s.commission}% (Services: {s.commissionServices !== undefined ? s.commissionServices : s.commission}% | Products: {s.commissionProducts !== undefined ? s.commissionProducts : s.commission}%)
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-[var(--tt-text-muted)] uppercase tracking-widest">{t.totalSales}</p>
                            <p className="text-xl font-black text-[var(--tt-text-main)]">{currency}{sRev.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[var(--tt-border)]">
                          <div>
                            <p className="text-[10px] font-black text-[var(--tt-text-muted)] uppercase mb-1">{t.salaryAndTips}</p>
                            <p className="font-bold text-[var(--tt-text-main)]">{currency}{(baseSalary + tipTotal).toFixed(2)}</p>
                            <p className="text-[9px] text-[var(--tt-text-muted)] mt-1">{t.baseSalaryLabel} {currency}{baseSalary.toFixed(2)} | {t.tipsLabel} {currency}{tipTotal.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[var(--tt-text-muted)] uppercase mb-1">{t.netCommission}</p>
                            <p className="font-bold text-[var(--tt-emerald)]">{currency}{commissionEarned.toFixed(2)}</p>
                            {settings.deductExpensesFromCommission && (
                              <p className="text-[9px] text-[var(--tt-rose)] italic">{t.afterExpenseShare}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[var(--tt-text-muted)] uppercase mb-1">{t.totalAdvances}</p>
                            <p className="font-bold text-[var(--tt-amber)]">-{currency}{totalAdvances.toFixed(2)}</p>
                          </div>
                          <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
                            <div className="bg-[var(--tt-amber)] text-slate-950 p-3 rounded-2xl text-center shadow-lg shadow-[var(--tt-amber-glow)]">
                              <p className="text-[10px] font-black uppercase mb-1">{t.finalPayout}</p>
                              <p className="text-lg font-black">{currency}{finalPayout.toFixed(2)}</p>
                            </div>
                            {isPaid ? (
                              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-2xl py-2 px-3 text-center text-[11px] font-black uppercase tracking-widest">
                                ✓ Paid
                              </div>
                            ) : isConfirming ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={handleMarkPaid}
                                  className="flex-1 bg-emerald-500 text-white rounded-2xl py-2 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                                >
                                  ✓ Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmingPayStaffId(null)}
                                  className="flex-1 bg-[var(--tt-surface)] border border-[var(--tt-border)] text-[var(--tt-text-muted)] rounded-2xl py-2 text-[11px] font-black uppercase tracking-widest hover:bg-[var(--tt-surface-2)] transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmingPayStaffId(s.id)}
                                className="bg-slate-900 dark:bg-slate-700 text-white rounded-2xl py-2 px-3 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors w-full"
                              >
                                Mark Paid
                              </button>
                            )}
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
              <div className="tt-card p-6">
                <h3 className="text-lg font-black uppercase tracking-tight mb-6 text-[var(--tt-text-main)]">💰 {t.cashDrawer}</h3>

                {!cashDrawer.isOpen ? (
                  <div className="space-y-4">
                    <p className="text-sm text-[var(--tt-text-muted)] mb-4">{t.drawerClosedMessage}</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        id="startingCashInput"
                        placeholder={t.startingCash}
                        className="tt-input"
                      />
                      <button
                        onClick={() => {
                          const val = parseFloat((document.getElementById('startingCashInput') as HTMLInputElement).value);
                          if (!isNaN(val)) handleOpenDrawer(val);
                        }}
                        className="tt-button-primary px-6 py-3 text-xs"
                      >
                        {t.openDrawer}
                      </button>
                    </div>
                    {cashDrawer.lastClosed && (
                      <p className="text-[10px] text-[var(--tt-text-muted)] mt-4">{t.lastClosed}: {new Date(cashDrawer.lastClosed).toLocaleString()}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-[var(--tt-surface-2)] rounded-2xl border border-[var(--tt-border)]">
                        <p className="text-[10px] font-black text-[var(--tt-text-muted)] uppercase tracking-widest mb-1">{t.startingCash}</p>
                        <p className="text-xl font-black text-[var(--tt-text-main)]">{currency}{cashDrawer.startingCash.toFixed(2)}</p>
                      </div>
                      <div className="p-4 bg-[var(--tt-emerald)]/10 rounded-2xl border border-[var(--tt-emerald)]/20">
                        <p className="text-[10px] font-black text-[var(--tt-emerald)] uppercase tracking-widest mb-1">{t.expectedCash}</p>
                        <p className="text-xl font-black text-[var(--tt-text-main)]">{currency}{(cashDrawer.startingCash + filteredSales.filter(s => s.paymentMethod === 'cash' && cashDrawer.startTime && s.timestamp >= cashDrawer.startTime).reduce((a, b) => a + b.total, 0)).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[var(--tt-border)]">
                      <p className="text-sm font-bold text-[var(--tt-text-main)]">{t.closeDrawer}</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          id="actualCashInput"
                          placeholder={t.actualCash}
                          className="tt-input"
                        />
                        <button
                          onClick={() => {
                            const val = parseFloat((document.getElementById('actualCashInput') as HTMLInputElement).value);
                            if (!isNaN(val)) handleCloseDrawer(val);
                          }}
                          className="bg-[var(--tt-rose)] text-white px-6 py-3 rounded-xl font-black uppercase text-xs shadow-lg shadow-[var(--tt-rose)]/20 active:scale-95 transition-transform"
                        >
                          {t.closeDrawer}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="tt-card p-6">
                <h3 className="text-lg font-black uppercase tracking-tight mb-6 text-[var(--tt-text-main)]">📊 Session Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-[var(--tt-surface-2)] rounded-xl border border-[var(--tt-border)]">
                    <span className="text-sm font-bold text-[var(--tt-text-muted)]">{t.cashSales}</span>
                    <span className="font-black text-[var(--tt-emerald)]">+{currency}{filteredSales.filter(s => s.paymentMethod === 'cash' && cashDrawer.startTime && s.timestamp >= cashDrawer.startTime).reduce((a, b) => a + b.total, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[var(--tt-surface-2)] rounded-xl border border-[var(--tt-border)]">
                    <span className="text-sm font-bold text-[var(--tt-text-muted)]">{t.cardSales}</span>
                    <span className="font-black text-[var(--tt-blue)]">+{currency}{filteredSales.filter(s => s.paymentMethod === 'card' && cashDrawer.startTime && s.timestamp >= cashDrawer.startTime).reduce((a, b) => a + b.total, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[var(--tt-surface-2)] rounded-xl border border-[var(--tt-border)]">
                    <span className="text-sm font-bold text-[var(--tt-text-muted)]">{t.splitSales}</span>
                    <span className="font-black text-[var(--tt-violet)]">+{currency}{filteredSales.filter(s => s.paymentMethod === 'split' && cashDrawer.startTime && s.timestamp >= cashDrawer.startTime).reduce((a, b) => a + b.total, 0).toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-[var(--tt-border)]">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black uppercase tracking-widest text-[var(--tt-text-main)]">{t.totalSessionRevenue}</span>
                      <span className="text-xl font-black text-[var(--tt-text-main)]">{currency}{totalRevenue.toFixed(2)}</span>
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
