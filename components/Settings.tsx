
import React, { useState, useEffect } from 'react';
import { ShopSettings, Language, Staff, DiscountCode } from '../types';
import { CURRENCY_OPTIONS, TRANSLATIONS, COUNTRY_CODES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsProps {
  settings: ShopSettings;
  onUpdateSettings: (settings: ShopSettings) => void;
  currentUser?: Staff;
  onPurgeSales?: () => void;
  onLogout: () => void;
  dbStatus: 'connected' | 'offline' | 'error';
  dbErrorMessage?: string | null;
  onRefreshStatus?: (isSilent?: boolean) => Promise<void>;
  onTestNotification?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, currentUser, onPurgeSales, onLogout, dbStatus, dbErrorMessage, onRefreshStatus, onTestNotification }) => {
  const [formData, setFormData] = useState<ShopSettings>(settings);
  const [isCustomCurrency, setIsCustomCurrency] = useState(!CURRENCY_OPTIONS.some(opt => opt.symbol === settings.currency));
  const [newPromo, setNewPromo] = useState<DiscountCode>({ code: '', type: 'percentage', value: 0, description: '' });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  
  const t = TRANSLATIONS[settings.language];

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    if (onRefreshStatus) {
        try {
            await onRefreshStatus(true);
            // The status will be updated via props, but we can show a local message too
            setTimeout(() => {
                setIsTesting(false);
                // We check the prop dbStatus which should have been updated by onRefreshStatus
                setTestResult("Connection test complete.");
                setTimeout(() => setTestResult(null), 5000);
            }, 800);
        } catch (err) {
            setIsTesting(false);
            setTestResult("Test failed to execute.");
        }
    } else {
        setIsTesting(false);
    }
  };

  const handleRefreshPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  // Sync formData with settings prop when it changes (e.g. after initial DB load)
  useEffect(() => {
    setFormData(settings);
    setIsCustomCurrency(!CURRENCY_OPTIONS.some(opt => opt.symbol === settings.currency));
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const handleCurrencyChange = (val: string) => {
    if (val === 'CUSTOM') {
      setIsCustomCurrency(true);
    } else {
      setIsCustomCurrency(false);
      setFormData({ ...formData, currency: val });
    }
  };

  const handleResetSales = () => {
    setShowResetConfirm(true);
  };

  const confirmResetSales = () => {
    if (onPurgeSales) onPurgeSales();
    setShowResetConfirm(false);
  };

  const addPromoCode = () => {
    if (!newPromo.code || newPromo.value <= 0) return;
    
    // Create the updated list
    const updatedCodes = [...(formData.promoCodes || []), { ...newPromo, code: newPromo.code.toUpperCase() }];
    const updatedSettings = { ...formData, promoCodes: updatedCodes };
    
    // Update local state immediately for UI responsiveness
    setFormData(updatedSettings);
    
    // Save to database immediately
    onUpdateSettings(updatedSettings);
    
    // Reset input fields
    setNewPromo({ code: '', type: 'percentage', value: 0, description: '' });
  };

  const removePromoCode = (codeToRemove: string) => {
    // Create the updated list
    const updatedCodes = (formData.promoCodes || []).filter(c => c.code !== codeToRemove);
    const updatedSettings = { ...formData, promoCodes: updatedCodes };
    
    // Update local state immediately
    setFormData(updatedSettings);
    
    // Save to database immediately
    onUpdateSettings(updatedSettings);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-12">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white font-brand">{t.settings}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t.fineTune}</p>
      </div>

      {currentUser?.role === 'admin' ? (
      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        {/* Database Diagnostics - Moved OUT of the admin check entirely */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{t.shopBranding}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-2 ml-1">{t.terminalIdentity}</label>
              <input 
                type="text" 
                value={formData.shopName}
                onChange={e => setFormData({...formData, shopName: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" 
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-2 ml-1">{t.language} / زبان</label>
              <select 
                value={formData.language}
                onChange={e => setFormData({...formData, language: e.target.value as Language})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200"
              >
                <option value="en">English (US)</option>
                <option value="ur">Urdu (اردو)</option>
                <option value="ar">Arabic (العربية)</option>
                <option value="hi">Hindi (हिन्दी)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest block ml-1">{t.preferredCurrency}</label>
              <select 
                value={isCustomCurrency ? 'CUSTOM' : formData.currency}
                onChange={e => handleCurrencyChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200"
              >
                {CURRENCY_OPTIONS.map(opt => (
                  <option key={opt.symbol} value={opt.symbol}>{opt.label}</option>
                ))}
                <option value="CUSTOM">{t.customSymbol}</option>
              </select>
              
              <AnimatePresence>
                {isCustomCurrency && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2"
                  >
                    <input 
                      type="text" 
                      placeholder="Symbol (e.g. Rs.)"
                      value={formData.currency}
                      onChange={e => setFormData({...formData, currency: e.target.value})}
                      className="w-full bg-slate-100 dark:bg-slate-800/50 border-0 rounded-2xl px-5 py-3 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-2 ml-1">{t.countryCode}</label>
              <select 
                value={formData.countryCode}
                onChange={e => setFormData({...formData, countryCode: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200"
              >
                {COUNTRY_CODES.map(code => (
                  <option key={code.code} value={code.code}>{code.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-2 ml-1">{t.taxCalculation}</label>
              <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-slate-700">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, taxType: 'excluded'})}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${formData.taxType === 'excluded' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  {t.excluded}
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, taxType: 'included'})}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${formData.taxType === 'included' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  {t.included}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-2 ml-1">{t.taxRate}</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.taxRate}
                  onChange={e => setFormData({...formData, taxRate: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none pr-12 text-sm font-bold dark:text-slate-200" 
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-black">%</span>
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <div className="flex-1 pr-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">{t.deductExpenses}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{t.deductExpensesDesc}</p>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={formData.deductExpensesFromCommission}
                  onChange={e => setFormData({...formData, deductExpensesFromCommission: e.target.checked})}
                  className="w-6 h-6 rounded-lg text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-2 ml-1">{t.receiptFooter}</label>
              <textarea 
                value={formData.receiptFooter}
                onChange={e => setFormData({...formData, receiptFooter: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none h-[52px] resize-none text-sm font-medium dark:text-slate-300 overflow-hidden" 
              />
            </div>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{t.notificationSettings}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.notificationStatus}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${notifPermission === 'granted' ? 'bg-emerald-500' : notifPermission === 'denied' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                  <p className={`font-bold text-sm ${notifPermission === 'granted' ? 'text-emerald-600' : notifPermission === 'denied' ? 'text-rose-600' : 'text-amber-600'}`}>
                    {notifPermission === 'granted' ? t.notificationGranted : notifPermission === 'denied' ? t.notificationDenied : t.notificationDefault}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleRefreshPermission}
                className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                {t.updatePermissions}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.testNotification}</p>
                <p className="text-[10px] text-slate-500 font-medium">Send a sample alert</p>
              </div>
              <button 
                type="button"
                disabled={notifPermission !== 'granted'}
                onClick={onTestNotification}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
              >
                {t.testNotification}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Promo Codes Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{t.promoCodes}</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form to Add New */}
            <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
               <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">{t.addPromo}</h4>
               <div>
                  <input 
                    type="text" 
                    placeholder={t.code}
                    value={newPromo.code}
                    onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-black uppercase dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
               </div>
               <div className="grid grid-cols-2 gap-3">
                   <select 
                      value={newPromo.type}
                      onChange={e => setNewPromo({...newPromo, type: e.target.value as 'percentage' | 'fixed'})}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-xs font-bold dark:text-white focus:outline-none"
                   >
                      <option value="percentage">{t.percentage}</option>
                      <option value="fixed">{t.fixed}</option>
                   </select>
                   <input 
                    type="number" 
                    placeholder={t.value}
                    value={newPromo.value || ''}
                    onChange={e => setNewPromo({...newPromo, value: parseFloat(e.target.value) || 0})}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-xs font-bold dark:text-white focus:outline-none"
                  />
               </div>
               <div>
                  <input 
                    type="text" 
                    placeholder={t.description}
                    value={newPromo.description}
                    onChange={e => setNewPromo({...newPromo, description: e.target.value})}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-medium dark:text-white focus:outline-none"
                  />
               </div>
               <button 
                 type="button"
                 onClick={addPromoCode}
                 className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
               >
                 Add Code (Auto-Save)
               </button>
            </div>

            {/* List of Existing */}
            <div className="lg:col-span-2 space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
               {(formData.promoCodes || []).length === 0 ? (
                 <p className="text-slate-400 text-sm italic text-center py-8">{t.noActivePromoCodes}</p>
               ) : (
                 (formData.promoCodes || []).map((code, idx) => (
                   <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-4">
                         <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border border-purple-100 dark:border-purple-900/30">
                            {code.code}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                               {code.type === 'percentage' ? `${code.value}% OFF` : `-${settings.currency}${code.value} OFF`}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-300 font-medium">{code.description}</p>
                         </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removePromoCode(code.code)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                   </div>
                 ))
               )}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.224-3.52c1.54.914 3.453 1.403 5.385 1.404h.005c5.632 0 10.211-4.579 10.214-10.211 0-2.729-1.063-5.295-2.993-7.225s-4.496-2.992-7.225-2.993c-5.633 0-10.213 4.58-10.214 10.214 0 2.022.529 3.996 1.531 5.74l-.991 3.618 3.707-.972zm11.233-5.62c-.301-.151-1.782-.879-2.057-.979-.275-.1-.475-.151-.675.151s-.777.979-.952 1.179-.35.225-.65.076c-.301-.151-1.268-.467-2.417-1.492-.892-.795-1.494-1.777-1.669-2.078-.175-.301-.019-.463.131-.613.135-.134.301-.351.451-.526s.201-.3.301-.5c.101-.201.05-.376-.025-.526s-.675-1.629-.925-2.229c-.244-.583-.491-.504-.675-.513-.175-.008-.376-.01-.576-.01s-.526.076-.801.376c-.275.301-1.051 1.028-1.051 2.508s1.076 2.908 1.226 3.109c.151.201 2.118 3.235 5.132 4.537.717.309 1.277.494 1.714.633.72.228 1.375.196 1.892.119.577-.085 1.782-.728 2.032-1.429s.25-.151.25-.376-.101-.351-.401-.502z"/></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t.whatsAppSummaries}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.enableWhatsApp}</p>
              </div>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                checked={formData.whatsappEnabled}
                onChange={e => setFormData({...formData, whatsappEnabled: e.target.checked})}
                className="w-6 h-6 rounded-lg text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
          </div>

          <div className={`space-y-4 transition-all duration-300 ${formData.whatsappEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-2 ml-1">{t.businessMobile}</label>
              <input 
                type="tel" 
                placeholder="+1234567890"
                value={formData.whatsappNumber}
                onChange={e => setFormData({...formData, whatsappNumber: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" 
              />
            </div>
          </div>
        </motion.div>

        {/* Loyalty Program Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
        >
           <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{t.loyaltyProgram || 'Loyalty Program'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.loyaltyProgramDesc || 'Reward customers with points on every purchase'}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.loyaltyEnabled}
                    onChange={e => setFormData({...formData, loyaltyEnabled: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-amber-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-full shadow-inner" />
                </label>
           </div>
           
           <div className={`space-y-4 transition-all duration-300 ${formData.loyaltyEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-2 ml-1">{t.pointsPerCurrency || 'Points Per Currency Unit'}</label>
                 <input 
                   type="number" 
                   min="0.1"
                   step="0.1"
                   value={formData.pointsPerCurrency}
                   onChange={e => setFormData({...formData, pointsPerCurrency: parseFloat(e.target.value) || 1})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" 
                 />
                 <p className="text-[9px] text-slate-400 mt-1 ml-1">{t.pointsPerCurrencyHelp || `e.g., 1 = earn 1 point per ${formData.currency}1 spent`}</p>
               </div>
               <div>
                 <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-2 ml-1">{t.minPointsRedeem || 'Minimum Points to Redeem'}</label>
                 <input 
                   type="number" 
                   min="1"
                   value={formData.minPointsToRedeem}
                   onChange={e => setFormData({...formData, minPointsToRedeem: parseInt(e.target.value) || 100})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" 
                 />
                 <p className="text-[9px] text-slate-400 mt-1 ml-1">{t.minPointsRedeemHelp || 'Customers need at least this many points before they can redeem'}</p>
               </div>
             </div>
             <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                 <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                   <strong>ℹ️ {t.howItWorks || 'How it works'}:</strong> {t.loyaltyExplanation || `Customers earn ${formData.pointsPerCurrency} point(s) per ${formData.currency}1 spent. Once they accumulate ${formData.minPointsToRedeem}+ points, they can redeem them at checkout. 1 point = ${formData.currency}1 discount.`}
                 </p>
             </div>
           </div>
        </motion.div>

        {/* Business Month Cycle */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
        >
           <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{t.monthlySalesCycle}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.configureBusinessMonth}</p>
                </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-2 ml-1">{t.billingCycle}</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="1"
                      max="28"
                      value={formData.billingCycleDay || 1}
                      onChange={e => setFormData({...formData, billingCycleDay: Math.min(28, Math.max(1, parseInt(e.target.value) || 1))})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/10 outline-none pr-12 text-sm font-bold dark:text-slate-200" 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase">{t.billingDay}</span>
                  </div>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                  <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
                    <strong>📅 {t.reportingPeriod || 'Reporting Period'}:</strong> {t.billingCycleDescription || `Your financial reports and dashboard will use day ${formData.billingCycleDay} as the start of each business month.`}
                  </p>
              </div>
           </div>
        </motion.div>

        {/* Database Diagnostics moved below */}

        {/* Online Booking Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{t.onlineBooking}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.enableBooking}</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => {
                const newEnabled = !formData.bookingEnabled;
                const newSettings = { ...formData, bookingEnabled: newEnabled };
                setFormData(newSettings);
                onUpdateSettings(newSettings);
              }}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${formData.bookingEnabled ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.bookingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <AnimatePresence>
            {formData.bookingEnabled && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest block ml-1">{t.bookingSlug}</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold pointer-events-none">
                        trimtimepos.com/book/
                      </div>
                      <input 
                        type="text" 
                        value={formData.bookingSlug}
                        onChange={e => setFormData({...formData, bookingSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                        placeholder="your-shop-name"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl pl-36 pr-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" 
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!formData.bookingSlug}
                      onClick={() => {
                        const link = `https://trimtimepos.com/book/${formData.bookingSlug}`;
                        navigator.clipboard.writeText(link);
                        alert(t.bookingLinkCopied);
                      }}
                      className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      {t.copyBookingLink}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 ml-2 mt-2">Only letters, numbers, and hyphens allowed.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Staff Shift Login Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3a9.99 9.99 0 00-4.556 1.088m.054 13.926a10.003 10.003 0 01-2.46-3.572m11.756 3.572a10.003 10.003 0 01-5.32 2.315 m0 0A10.003 10.003 0 0112 21a9.99 9.99 0 01-4.556-1.088m4.556 1.088V11"/></svg>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{t.staffLoginLink}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.staffLoginDesc}</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black uppercase tracking-tighter opacity-50 group-hover:opacity-100 transition-opacity">
                  Staff URL
                </div>
                <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-20 pr-5 py-4 text-sm font-mono text-emerald-600 dark:text-emerald-400 break-all overflow-hidden whitespace-nowrap">
                  https://trimtimepos.com/staff-login/{formData.bookingSlug}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`https://trimtimepos.com/staff-login/${formData.bookingSlug}`);
                  alert(t.staffLinkCopied);
                }}
                className="px-8 py-4 bg-slate-950 dark:bg-emerald-500 text-white dark:text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                  {t.copyStaffLink}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic px-2">
              Tip: Copy this link and send it to your staff groups or pin it on your shop tablet browser for quick access.
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-rose-50/50 dark:bg-rose-900/10 p-6 md:p-8 rounded-[2rem] border border-rose-100 dark:border-rose-900/30 shadow-sm space-y-6"
        >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center text-rose-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <div>
                  <h3 className="text-lg md:text-xl font-bold text-rose-600 dark:text-rose-400">{t.dangerZone}</h3>
                  <p className="text-xs text-rose-400 dark:text-rose-500/70 mt-1">{t.resetSalesDesc}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                  type="button"
                  onClick={handleResetSales}
                  className="bg-rose-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
              >
                  {t.resetSales}
              </button>
            </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 pt-4">
            <button 
                type="button" 
                onClick={() => {
                  setFormData(settings);
                  setIsCustomCurrency(!CURRENCY_OPTIONS.some(opt => opt.symbol === settings.currency));
                }}
                className="px-8 py-4 font-black text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors uppercase text-xs tracking-widest"
            >
                {t.resetChanges}
            </button>
            <button 
                type="submit" 
                className="bg-slate-950 dark:bg-amber-500 text-white dark:text-slate-950 px-10 py-4 rounded-2xl font-black text-base hover:bg-slate-800 dark:hover:bg-amber-600 transition-all shadow-xl active:scale-95"
            >
                {t.saveSettings}
            </button>
        </div>
      </form>
      ) : (
        <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl text-center border border-slate-200 dark:border-slate-800 mb-6">
          <p className="text-slate-500 font-medium text-sm">{t.globalSettingsAdminOnly}</p>
        </div>
      )}

      {/* Database Diagnostics - Visible to All */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
      >
         <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
              </div>
              <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{t.databaseDiagnostics}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.verifyCloudConnection}</p>
              </div>
         </div>
         
         <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.status}</p>
                  <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                     <p className={`font-bold text-sm ${dbStatus === 'connected' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {dbStatus === 'connected' ? 'Connected' : 'Disconnected / Error'}
                     </p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  {testResult && (
                    <span className={`text-[10px] font-bold ${dbStatus === 'connected' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {testResult}
                    </span>
                  )}
                  <button 
                    type="button"
                    disabled={isTesting}
                    onClick={handleTestConnection}
                    className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                  >
                    {isTesting ? (
                        <svg className="animate-spin h-3 w-3 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : null}
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </button>
               </div>
            </div>
            
            {dbStatus === 'error' && dbErrorMessage && (
               <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">{t.errorMessage}</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
                     {dbErrorMessage}
                  </p>
                  <p className="text-[9px] text-rose-400 mt-2 italic">
                     Tip: If you are in Pakistan, ensure your internet provider is not blocking Supabase domains. Try using a VPN if the error persists.
                  </p>
               </div>
            )}
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.configurationCheck}</p>
               <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                     <div className={`w-1.5 h-1.5 rounded-full ${(import.meta as any).env?.VITE_SUPABASE_URL ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                     URL: {(import.meta as any).env?.VITE_SUPABASE_URL ? 'Custom URL Detected' : 'Using Fallback (Default)'}
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                     <div className={`w-1.5 h-1.5 rounded-full ${(import.meta as any).env?.VITE_SUPABASE_ANON_KEY ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                     Key: {(import.meta as any).env?.VITE_SUPABASE_ANON_KEY ? 'API Key Detected' : 'API Key Missing'}
                  </li>
               </ul>
            </div>
         </div>
      </motion.div>

      {/* Account Section - Visible to All */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-black text-slate-500 uppercase text-xl shadow-inner">
                  {(currentUser?.name || 'U').charAt(0)}
              </div>
              <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{currentUser?.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentUser?.role}</p>
              </div>
          </div>
          <button 
              onClick={onLogout}
              className="w-full md:w-auto px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900/30"
          >
              {t.logout}
          </button>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showSuccessAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 z-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            Configuration updated successfully!
          </motion.div>
        )}

        {showResetConfirm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">{t.dangerZone}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8">{t.confirmReset}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-4 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmResetSales}
                  className="flex-1 py-4 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
