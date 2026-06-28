
import React, { useState } from 'react';
import { Staff, UserRole, Language, Subscription } from '../types';
import { TRANSLATIONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { getSubscriptionLimits } from '../services/subscriptionService';
import { useToast } from '../contexts/ToastContext';

interface StaffManagementProps {
  staffList: Staff[];
  onUpdateStaff: (staff: Staff[]) => void;
  currentUser: Staff;
  language: Language;
  subscription?: Subscription | null;
}

import AvailabilityModal from './AvailabilityModal';
import { useData } from '../contexts/DataContext';

const StaffManagement: React.FC<StaffManagementProps> = ({ staffList, onUpdateStaff, currentUser, language, subscription }) => {
  const { staffAvailability, updateStaffAvailability, branches } = useData();
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [availabilityStaff, setAvailabilityStaff] = useState<Staff | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'employee' as UserRole,
    commission: 30,
    commissionServices: 30,
    commissionProducts: 10,
    baseSalary: 0,
    branchId: ''
  });

  const t = TRANSLATIONS[language];

  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      commission: formData.commissionServices // Legacy support
    };
    if (editingStaff) {
      const updatedList = staffList.map(s => s.id === editingStaff.id ? { ...editingStaff, ...submitData } : s);
      onUpdateStaff(updatedList);
    } else {
      // Quota Limit Enforcement
      const limits = getSubscriptionLimits(subscription);
      const activeStaff = staffList.length;
      if (activeStaff >= limits.maxEmployees) {
        showToast(`Employee limit reached: Your plan allows up to ${limits.maxEmployees} employees. Upgrade or purchase an Add-on to add more.`, 'error');
        return;
      }

      const newStaff: Staff = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        ...submitData
      };
      onUpdateStaff([...staffList, newStaff]);
    }
    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingStaff(null);
    setShowPassword(false);
    setFormData({
      name: '',
      username: '',
      password: '',
      role: 'employee',
      commission: 30,
      commissionServices: 30,
      commissionProducts: 10,
      baseSalary: 0,
      branchId: branches.length === 1 ? branches[0].id : ''
    });
  };

  const deleteStaff = (id: string) => {
    if (id === currentUser.id) {
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 3000);
      return;
    }
    setShowDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      onUpdateStaff(staffList.filter(s => s.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white font-brand">{t.teamHub}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm flex flex-wrap items-center gap-2">
            <span>{t.manageAccess}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-[var(--tt-surface-2)] text-[var(--tt-text-muted)] border border-[var(--tt-border)] shadow-sm">
              Quota: {staffList.length} / {getSubscriptionLimits(subscription).maxEmployees}
            </span>
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[var(--tt-surface-2)] text-[var(--tt-text-main)] px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-[var(--tt-surface)] transition-all shadow-lg text-sm w-full sm:w-auto justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
          {t.addStaff}
        </button>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4">
        {staffList.map(staff => (
          <div key={staff.id} className="tt-card p-5 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 rounded-full bg-[var(--tt-surface-2)] flex items-center justify-center font-black text-[var(--tt-text-muted)] uppercase shadow-inner text-lg">
                  {(staff.name || 'S').charAt(0)}
               </div>
               <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{staff.name}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-600 font-bold tracking-tight">@{staff.username}</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
               <div className="bg-[var(--tt-surface-2)] p-3 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t.role}</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${staff.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'}`}>
                      {staff.role === 'admin' ? t.admin : t.employee}
                  </span>
               </div>
               <div className="bg-[var(--tt-surface-2)] p-3 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t.commission}</p>
                  <p className="font-black text-slate-900 dark:text-white">{staff.commission}%</p>
               </div>
            </div>

            <div className="flex gap-2">
               <button 
                 onClick={() => {
                   setEditingStaff(staff);
                  setFormData({ 
                    name: staff.name, 
                    username: staff.username, 
                    password: staff.password || '', 
                    role: staff.role, 
                    commission: staff.commission,
                    commissionServices: staff.commissionServices ?? staff.commission,
                    commissionProducts: staff.commissionProducts ?? staff.commission,
                    baseSalary: staff.baseSalary || 0,
                    branchId: staff.branchId || ''
                  });
                   setIsAdding(true);
                 }}
                 className="flex-1 py-3 rounded-xl bg-[var(--tt-surface-2)] text-[var(--tt-text-main)] font-bold text-sm hover:bg-[var(--tt-surface)] transition-colors"
               >
                 {t.editProfessional}
               </button>
               <button 
                 onClick={() => setAvailabilityStaff(staff)}
                 className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors font-bold"
                 title="Weekly Availability"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
               </button>
               <button 
                 onClick={() => deleteStaff(staff.id)}
                 className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors font-bold"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block tt-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[650px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <th className="px-8 py-5">{t.professional}</th>
                <th className="px-8 py-5">{t.loginId}</th>
                <th className="px-8 py-5">{t.role}</th>
                {branches.length > 1 && <th className="px-8 py-5">{t.branch || 'Branch'}</th>}
                <th className="px-8 py-5">{t.commission}</th>
                <th className="px-8 py-5 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {staffList.map(staff => (
                <tr key={staff.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 dark:text-slate-400 uppercase shadow-inner">
                        {(staff.name || 'S').charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{staff.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-mono tracking-tighter uppercase">ID: {staff.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-600 dark:text-slate-400 tracking-tight">{staff.username}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${staff.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'}`}>
                      {staff.role === 'admin' ? t.admin : t.employee}
                    </span>
                  </td>
                  {branches.length > 1 && (
                    <td className="px-8 py-6 text-sm font-bold text-slate-600 dark:text-slate-400">
                      {branches.find(b => b.id === staff.branchId)?.name || 'All Branches'}
                    </td>
                  )}
                  <td className="px-8 py-6 font-black text-slate-900 dark:text-white">
                    {staff.commissionServices ?? staff.commission}% / {staff.commissionProducts ?? staff.commission}%
                  </td>
                  <td className="px-8 py-6 text-right space-x-2">
                    <button 
                      onClick={() => setAvailabilityStaff(staff)}
                      className="p-2 text-slate-300 dark:text-slate-600 hover:text-amber-500 transition-colors"
                      title="Weekly Availability"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </button>
                    <button 
                      onClick={() => {
                        setEditingStaff(staff);
                        setFormData({ 
                          name: staff.name, 
                          username: staff.username, 
                          password: staff.password || '', 
                          role: staff.role, 
                          commission: staff.commission,
                          commissionServices: staff.commissionServices ?? staff.commission,
                          commissionProducts: staff.commissionProducts ?? staff.commission,
                          baseSalary: staff.baseSalary || 0,
                          branchId: staff.branchId || ''
                        });
                        setIsAdding(true);
                      }}
                      className="p-2 text-slate-300 dark:text-slate-600 hover:text-amber-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button onClick={() => deleteStaff(staff.id)} className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="tt-card w-full max-w-md p-8 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{editingStaff ? t.editProfessional : t.addToTeam}</h3>
                <button onClick={resetForm} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="staff-name" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.fullName}</label>
                  <input 
                    id="staff-name"
                    name="name" 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" 
                  />
                </div>
                <div>
                  <label htmlFor="staff-username" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.username}</label>
                  <input 
                    id="staff-username"
                    name="username" 
                    type="text" 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" 
                  />
                </div>
                <div>
                  <label htmlFor="staff-password" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.password}</label>
                  <div className="relative">
                    <input 
                      id="staff-password"
                      name="password" 
                      type={showPassword ? "text" : "password"} 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 pr-12 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="staff-role" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.role}</label>
                    <select 
                      id="staff-role"
                      value={formData.role} 
                      onChange={e => setFormData({...formData, role: e.target.value as UserRole})} 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200"
                    >
                      <option value="employee">{t.employee}</option>
                      <option value="admin">{t.admin}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="staff-salary" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.baseSalary || 'Base Salary'}</label>
                    <input 
                      id="staff-salary"
                      name="baseSalary" 
                      type="number" 
                      value={formData.baseSalary} 
                      onChange={e => setFormData({...formData, baseSalary: parseFloat(e.target.value) || 0})} 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" 
                    />
                  </div>
                  <div>
                    <label htmlFor="staff-comm-services" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.commissionServices || 'Service Comm'} (%)</label>
                    <input 
                      id="staff-comm-services"
                      name="commissionServices" 
                      type="number" 
                      value={formData.commissionServices} 
                      onChange={e => setFormData({...formData, commissionServices: parseInt(e.target.value) || 0})} 
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" 
                    />
                  </div>
                  <div>
                    <label htmlFor="staff-comm-products" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.commissionProducts || 'Product Comm'} (%)</label>
                    <input 
                      id="staff-comm-products"
                      name="commissionProducts" 
                      type="number" 
                      value={formData.commissionProducts} 
                      onChange={e => setFormData({...formData, commissionProducts: parseInt(e.target.value) || 0})} 
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" 
                    />
                  </div>
                  {branches.length > 1 && (
                    <div className="col-span-2">
                      <label htmlFor="staff-branch" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.assignedBranch || 'Assigned Branch'}</label>
                      <select 
                        id="staff-branch"
                        value={formData.branchId} 
                        onChange={e => setFormData({...formData, branchId: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200"
                      >
                        <option value="">Select Branch...</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 mt-8">
                  <button type="submit" className="flex-1 px-4 py-4 bg-slate-950 dark:bg-amber-500 text-white dark:text-slate-950 rounded-2xl font-black text-base hover:bg-slate-800 dark:hover:bg-amber-600 transition-all shadow-xl">
                    {editingStaff ? t.updateProfessional : t.saveProfessional}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showErrorAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 z-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            You cannot delete your own admin account.
          </motion.div>
        )}

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
              <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">{t.deleteProfessional}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8">{t.permanentlyRemoveTeamMember}</p>
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
        {availabilityStaff && (
          <AvailabilityModal
            staff={availabilityStaff}
            availability={staffAvailability}
            language={language}
            onClose={() => setAvailabilityStaff(null)}
            onSave={(updated) => {
              updateStaffAvailability(availabilityStaff.id, updated);
              setAvailabilityStaff(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffManagement;
