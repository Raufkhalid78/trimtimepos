
import React, { useState } from 'react';
import { Customer, Sale, Language, ShopSettings } from '../types';
import { TRANSLATIONS, DEFAULT_SETTINGS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomersProps {
  customers: Customer[];
  sales: Sale[];
  onUpdateCustomers: (customers: Customer[]) => void;
  currency: string;
  language: Language;
  settings: ShopSettings;
}

const Customers: React.FC<CustomersProps> = ({ customers, sales, onUpdateCustomers, currency, language, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' });
  
  const t = TRANSLATIONS[language];

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const getCustomerStats = (id: string) => {
    // Exclude refunded sales from customer lifetime stats
    const custSales = sales.filter(s => s.customerId === id && !s.isRefunded);
    const totalSpent = custSales.reduce((acc, s) => acc + s.total, 0);
    const lastVisit = custSales.length > 0 
      ? new Date(custSales.sort((a,b) => b.timestamp.localeCompare(a.timestamp))[0].timestamp).toLocaleDateString()
      : 'Never';
    return { totalSpent, lastVisit, visitCount: custSales.length };
  };

  const customerTransactions = selectedCustomer 
    ? sales.filter(s => s.customerId === selectedCustomer.id).sort((a,b) => b.timestamp.localeCompare(a.timestamp))
    : [];

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ name: '', phone: '', email: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setIsEditing(true);
    setFormData({ name: customer.name, phone: customer.phone, email: customer.email, notes: customer.notes });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      onUpdateCustomers(customers.filter(c => c.id !== showDeleteConfirm));
      setSelectedCustomer(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleSave = () => {
     if (!formData.name) return;
     
     let finalPhone = formData.phone.trim();
     
     // Auto-prefix country code if missing
     if (finalPhone && !finalPhone.startsWith('+')) {
        const cleanPhone = finalPhone.replace(/\D/g, '');
        // If it starts with 0, remove it (common in some regions)
        const phoneWithoutLeadingZero = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;
        finalPhone = `${settings.countryCode}${phoneWithoutLeadingZero}`;
     }
     
     if (isEditing && selectedCustomer) {
        const updatedList = customers.map(c => c.id === selectedCustomer.id ? { ...c, ...formData, phone: finalPhone } : c);
        onUpdateCustomers(updatedList);
        setSelectedCustomer({ ...selectedCustomer, ...formData, phone: finalPhone });
     } else {
        const newCustomer: Customer = {
           id: 'c' + Date.now().toString(36),
           ...formData,
           phone: finalPhone,
           createdAt: new Date().toISOString().split('T')[0],
           loyaltyPoints: 0
        };
        onUpdateCustomers([...customers, newCustomer]);
     }
     setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print ${selectedCustomer ? 'hidden lg:flex' : 'flex'}`}>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white font-brand">{t.directory}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.clientProfiles}</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-slate-900 dark:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg text-sm w-full sm:w-auto justify-center active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          {t.addClient}
        </button>
      </div>

      <div className={`relative no-print ${selectedCustomer ? 'hidden lg:block' : 'block'}`}>
        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input 
          type="text" 
          placeholder={t.searchClients}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="tt-input py-3.5 pl-12 pr-6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* List of Customers */}
        <div className={`lg:col-span-1 space-y-3 lg:max-h-[70vh] lg:overflow-y-auto pr-1 no-print scrollbar-hide ${selectedCustomer ? 'hidden lg:block' : 'block'}`}>
          {filteredCustomers.map(customer => {
            const stats = getCustomerStats(customer.id);
            return (
              <motion.div 
                layout
                key={customer.id} 
                onClick={() => setSelectedCustomer(customer)}
                className={`tt-card p-4 md:p-5 transition-all cursor-pointer flex justify-between items-center ${selectedCustomer?.id === customer.id ? 'border-[var(--tt-amber)] ring-4 ring-[var(--tt-amber-glow)] shadow-md' : 'hover:border-[var(--tt-border)] shadow-sm'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm font-black uppercase shadow-inner">
                    {(customer.name || 'C').charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate max-w-[140px] md:max-w-[120px]">{customer.name}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">{customer.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                    <p className="text-[8px] text-slate-400 dark:text-slate-600 uppercase font-black tracking-widest">{t.visits}</p>
                    <p className="text-xs font-black text-amber-600 dark:text-amber-500">{stats.visitCount}</p>
                </div>
              </motion.div>
            );
          })}
          {filteredCustomers.length === 0 && (
            <div className="text-center py-10 text-slate-300 dark:text-slate-700 font-medium italic">{t.noMatchingClients}</div>
          )}
        </div>

        {/* Selected Customer Profile */}
        <div className={`lg:col-span-2 space-y-6 ${!selectedCustomer ? 'hidden lg:block' : 'block'}`}>
          {selectedCustomer ? (
            <>
              <div className="lg:hidden mb-2">
                 <button onClick={() => setSelectedCustomer(null)} className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 uppercase flex items-center gap-2 active:scale-95 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                    Back to directory
                 </button>
              </div>

              {/* Profile Card */}
              <div className="tt-card p-6 md:p-8 relative">
                <div className="absolute top-6 right-6 flex gap-2 no-print">
                    <button 
                        onClick={() => handleOpenEdit(selectedCustomer)} 
                        className="p-2.5 text-slate-400 hover:text-amber-500 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl"
                        title="Edit Profile"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    <button 
                        onClick={() => handleDelete(selectedCustomer.id)} 
                        className="p-2.5 text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl"
                        title="Delete Profile"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left">
                  <div className="w-full md:w-1/3 md:border-r border-slate-100 dark:border-slate-800 md:pr-8 flex flex-col items-center md:items-start">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 flex items-center justify-center text-3xl md:text-4xl font-black mb-4 shadow-inner">
                      {(selectedCustomer.name || 'C').charAt(0)}
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white truncate w-full px-2 md:px-0">{selectedCustomer.name}</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm mb-4 truncate w-full px-2 md:px-0">{selectedCustomer.email || 'No email'}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <span className="tt-badge bg-emerald-500/10 text-emerald-500">{t.member}</span>
                      {getCustomerStats(selectedCustomer.id).visitCount > 5 && (
                        <span className="tt-badge bg-amber-500/10 text-amber-500">{t.vip}</span>
                      )}
                      <span className="tt-badge bg-[var(--tt-surface-2)] text-[var(--tt-text-muted)]">{t.last}: {getCustomerStats(selectedCustomer.id).lastVisit}</span>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">{t.lifetime}</p>
                        <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white">{currency}{getCustomerStats(selectedCustomer.id).totalSpent.toFixed(2)}</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] border border-amber-100 dark:border-amber-900/30 shadow-sm">
                        <p className="text-[9px] text-amber-600 dark:text-amber-500 uppercase font-black tracking-widest mb-1">{t.loyaltyPoints}</p>
                        <p className="text-lg md:text-xl font-black text-amber-600 dark:text-amber-500">{selectedCustomer.loyaltyPoints || 0}</p>
                      </div>
                    </div>

                    <div className="text-left">
                      <h5 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">{t.stylePreferences}</h5>
                      <div className="bg-amber-50/40 dark:bg-amber-900/10 p-5 rounded-2xl md:rounded-[1.5rem] border border-amber-100/50 dark:border-amber-900/20 text-amber-900 dark:text-amber-200 text-sm leading-relaxed italic">
                        {selectedCustomer.notes || t.noNotes}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="tt-card shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/30">
                  <h4 className="font-bold text-slate-800 dark:text-white">{t.history}</h4>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{customerTransactions.length} {t.totalSales}</span>
                </div>
                
                {/* Responsive Transaction View */}
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {customerTransactions.map((sale) => (
                    <div key={sale.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                         <div className="flex justify-between items-start md:block">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white text-sm">{new Date(sale.timestamp).toLocaleDateString()}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-tight uppercase">#{sale.id.slice(0,8)}</p>
                            </div>
                            <div className="md:hidden text-right">
                                <p className="font-black text-slate-900 dark:text-white">{currency}{sale.total.toFixed(2)}</p>
                                <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">{sale.paymentMethod}</p>
                                {sale.earnedPoints ? <p className="text-[8px] text-amber-500 font-bold">+{sale.earnedPoints} pts</p> : null}
                                {sale.redeemedPoints ? <p className="text-[8px] text-rose-500 font-bold">-{sale.redeemedPoints} pts</p> : null}
                            </div>
                         </div>
                         
                         <div className="flex flex-wrap gap-1.5 flex-1 md:justify-center">
                              {sale.items.map((item, idx) => (
                                <span key={idx} className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight shadow-sm ${item.type === 'service' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30'}`}>
                                  {item.quantity}x {item.name}
                                </span>
                              ))}
                         </div>

                         <div className="hidden md:block text-right min-w-[100px]">
                            <p className="font-black text-slate-900 dark:text-white">{currency}{sale.total.toFixed(2)}</p>
                            <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">{sale.paymentMethod}</p>
                            {sale.earnedPoints ? <p className="text-[8px] text-amber-500 font-bold">+{sale.earnedPoints} pts</p> : null}
                            {sale.redeemedPoints ? <p className="text-[8px] text-rose-500 font-bold">-{sale.redeemedPoints} pts</p> : null}
                         </div>
                      </div>
                    </div>
                  ))}
                  {customerTransactions.length === 0 && (
                    <div className="text-center py-12 text-slate-300 dark:text-slate-700 italic text-sm">{t.noRecordedTransactions}</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="tt-card border-dashed h-64 md:h-[60vh] flex flex-col items-center justify-center text-[var(--tt-text-muted)] p-8 text-center">
              <svg className="w-16 h-16 md:w-20 md:h-20 mb-6 opacity-[0.05]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
              <h3 className="text-lg md:text-xl font-bold text-slate-400 dark:text-slate-600">{t.directory}</h3>
              <p className="text-xs max-w-xs mt-2 font-medium">{t.pickClient}</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="tt-card w-full max-w-md p-8 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isEditing ? t.editEntry : t.registerClient}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 transition-colors hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label htmlFor="cust-name" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.name}</label>
                  <input 
                    id="cust-name"
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder=""
                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200 shadow-sm" 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cust-phone" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.mobile}</label>
                    <input 
                      id="cust-phone"
                      type="tel" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200 shadow-sm" 
                    />
                  </div>
                  <div>
                    <label htmlFor="cust-email" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.email}</label>
                    <input 
                      id="cust-email"
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder={t.optional}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200 shadow-sm" 
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="cust-notes" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.details}</label>
                  <textarea 
                    id="cust-notes"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder=""
                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-amber-500/10 outline-none h-32 md:h-28 resize-none text-sm font-medium dark:text-slate-300 shadow-sm"
                  />
                </div>
                <div className="flex gap-4 mt-6">
                  <button 
                    onClick={handleSave}
                    className="flex-1 px-4 py-4 md:py-5 bg-slate-950 dark:bg-amber-500 text-white dark:text-slate-950 rounded-2xl font-black text-base hover:bg-slate-800 dark:hover:bg-amber-600 transition-all shadow-xl active:scale-95 shadow-slate-900/10"
                  >
                    {isEditing ? t.saveChanges : t.createProfile}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="tt-card p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">{t.deleteClient}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8">{t.permanentlyDeleteClient}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-4 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Customers;
