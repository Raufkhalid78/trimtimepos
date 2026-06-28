import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Appointment, Staff, Service, Customer, Language, AppointmentStatus, ShopSettings } from '../types';
import { TRANSLATIONS } from '../constants';
import { format } from 'date-fns';
import { whatsAppService } from '../services/whatsAppService';
import { setPageMeta } from '../utils/seo';
import { useToast } from '../contexts/ToastContext';

interface AppointmentsProps {
  appointments: Appointment[];
  staffList: Staff[];
  services: Service[];
  customers: Customer[];
  language: Language;
  onUpdateAppointments: (appointments: Appointment[]) => void;
  onUpdateStatus?: (id: string, status: AppointmentStatus) => void;
  settings: ShopSettings;
  staffAvailability: any[];
  onRefresh?: () => Promise<void>;
  /** Called when the user wants to charge for a completed appointment.
   *  The parent should open POS with the appointment's services + staff pre-filled. */
  onConvertToSale?: (appointment: Appointment) => void;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 9); // 9 AM to 7 PM

import { useData } from '../contexts/DataContext';

const Appointments: React.FC<AppointmentsProps> = ({ 
  appointments, staffList, services, customers, language, 
  onUpdateAppointments, onUpdateStatus, settings, staffAvailability, onRefresh, onConvertToSale
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { branches } = useData();
  const [selectedBranchId, setSelectedBranchId] = useState('all');

  const currentStaffList = useMemo(() => {
    return selectedBranchId === 'all' ? staffList : staffList.filter(s => s.branchId === selectedBranchId);
  }, [staffList, selectedBranchId]);

  const currentAppointments = useMemo(() => {
    return selectedBranchId === 'all' ? appointments : appointments.filter(a => a.branchId === selectedBranchId);
  }, [appointments, selectedBranchId]);

  const { showToast } = useToast();
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; message: string; onConfirm: () => void; } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<Partial<Appointment>>({
    staffId: currentStaffList[0]?.id || '',
    serviceIds: [],
    startTime: '',
    endTime: '',
    status: 'pending'
  });

  useEffect(() => {
    if (currentStaffList.length > 0 && !currentStaffList.some(s => s.id === formData.staffId)) {
      setFormData(prev => ({ ...prev, staffId: currentStaffList[0].id }));
    }
  }, [currentStaffList]);

  const t = TRANSLATIONS[language];

  useEffect(() => { setPageMeta('Appointments', 'Manage your salon appointments and booking calendar.'); }, []);

  // Utility to check if an appointment falls on the selected date
  const getAppointmentsForDate = () => {
    return currentAppointments.filter(app => {
      const appDate = new Date(app.startTime);
      return appDate.getDate() === selectedDate.getDate() &&
             appDate.getMonth() === selectedDate.getMonth() &&
             appDate.getFullYear() === selectedDate.getFullYear();
    });
  };

  const executeSave = () => {
    if (editingAppointment) {
      const updated = appointments.map(app => app.id === editingAppointment.id ? { ...editingAppointment, ...formData } as Appointment : app);
      onUpdateAppointments(updated);
    } else {
      const newApp: Appointment = {
        id: 'app_' + Math.random().toString(36).substr(2, 9),
        branchId: selectedBranchId !== 'all' ? selectedBranchId : (currentStaffList.find(s => s.id === formData.staffId)?.branchId || undefined),
        ...(formData as Omit<Appointment, 'id'>)
      };
      onUpdateAppointments([...appointments, newApp]);
    }
    closeModal();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Quick validation
    if (!formData.startTime || !formData.endTime || !formData.staffId || formData.serviceIds?.length === 0) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    // Overlap Detection
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    const hasOverlap = currentAppointments.some(app => {
      if (editingAppointment && app.id === editingAppointment.id) return false;
      if (app.staffId !== formData.staffId) return false;
      if (app.status === 'cancelled') return false;
      
      const appStart = new Date(app.startTime);
      const appEnd = new Date(app.endTime);
      return (start < appEnd && end > appStart);
    });

    const checkAvailabilityAndSave = () => {
      const dayOfWeek = start.getDay();
      const avail = staffAvailability.find(a => a.staffId === formData.staffId && a.dayOfWeek === dayOfWeek);
      if (avail) {
        const [startH, startM] = avail.startTime.split(':').map(Number);
        const [endH, endM] = avail.endTime.split(':').map(Number);
        
        const availStart = new Date(start);
        availStart.setHours(startH, startM, 0, 0);
        const availEnd = new Date(start);
        availEnd.setHours(endH, endM, 0, 0);

        if (start < availStart || end > availEnd) {
          setConfirmModal({
            isOpen: true,
            message: "Warning: This time is outside the staff member's working hours. Do you want to proceed?",
            onConfirm: () => executeSave()
          });
          return;
        }
      }
      executeSave();
    };

    if (hasOverlap) {
      setConfirmModal({
        isOpen: true,
        message: "Warning: This staff member already has an appointment at this time. Do you want to proceed anyway?",
        onConfirm: () => checkAvailabilityAndSave()
      });
      return;
    }

    checkAvailabilityAndSave();
  };

  const closeModal = () => {
    setIsAdding(false);
    setEditingAppointment(null);
    setFormData({
      staffId: currentStaffList[0]?.id || '',
      serviceIds: [],
      startTime: '',
      endTime: '',
      status: 'pending'
    });
  };

  const openSlot = (staffId: string, hour: number) => {
    const start = new Date(selectedDate);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(hour + 1, 0, 0, 0);

    setFormData({
      ...formData,
      staffId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: 'pending'
    });
    setIsAdding(true);
  };

  const filteredAppointments = getAppointmentsForDate();

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white font-brand">Appointments</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your daily schedule and bookings.</p>
          </div>
          {branches.length > 1 && (
            <div className="flex bg-[var(--tt-surface-2)] p-1 rounded-2xl border border-[var(--tt-border)] shadow-sm">
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-wider text-[var(--tt-text-main)] outline-none px-3 py-2 cursor-pointer rounded-xl font-sans"
              >
                <option value="all" className="bg-[var(--tt-surface)]">{t.allBranches || 'All Locations'}</option>
                {branches.filter(b => b.isActive).map(b => (
                  <option key={b.id} value={b.id} className="bg-[var(--tt-surface)]">{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <input 
            type="date" 
            value={selectedDate.toISOString().split('T')[0]} 
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="tt-input px-4 py-2"
          />
          {onRefresh && (
            <button
              onClick={async () => {
                setIsRefreshing(true);
                await onRefresh();
                setIsRefreshing(false);
              }}
              disabled={isRefreshing}
              className="p-3 bg-[var(--tt-surface-2)] text-[var(--tt-text-muted)] rounded-xl border border-[var(--tt-border)] hover:text-[var(--tt-amber)] transition-all active:scale-95 shadow-sm"
              title="Refresh Bookings"
            >
              <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-amber-500 text-slate-950 px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 text-sm"
          >
            + New Booking
          </button>
        </div>
      </div>

      {/* Approval Queue */}
      <AnimatePresence mode="wait">
        {currentAppointments.filter(a => a.status === 'unconfirmed').length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-[2.5rem] p-8 mb-8 no-print shadow-sm relative overflow-visible"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-black text-lg animate-pulse shadow-lg shadow-amber-500/20">!</div>
                <div>
                  <h3 className="text-xl font-black text-amber-900 dark:text-amber-400 leading-tight">Approval Queue</h3>
                  <p className="text-amber-700/60 dark:text-amber-500/60 text-[10px] font-bold uppercase tracking-widest">
                    {currentAppointments.filter(a => a.status === 'unconfirmed').length} {currentAppointments.filter(a => a.status === 'unconfirmed').length === 1 ? 'Pending Request' : 'Pending Requests'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentAppointments.filter(a => a.status === 'unconfirmed').map(app => {
                const staff = currentStaffList.find(s => s.id === app.staffId);
                const appServices = services.filter(s => app.serviceIds.includes(s.id));
                const appDate = new Date(app.startTime);
                
                return (
                  <motion.div 
                    key={app.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="tt-card p-5 border-[var(--tt-amber)]/20 shadow-xl shadow-amber-900/5 flex flex-col gap-4 group hover:border-[var(--tt-amber)] transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">
                          {format(appDate, 'MMM dd • h:mm a')}
                        </p>
                        <h4 className="font-black text-lg text-[var(--tt-text-main)] truncate">{app.customerName || 'Guest'}</h4>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span className="text-xs font-bold truncate">With {staff?.name || 'Any Professional'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        <span className="text-xs font-bold truncate">
                          {appServices.length > 0 ? appServices.map(s => s.name).join(', ') : 'Custom Service'}
                        </span>
                      </div>
                      {app.customerPhone && (
                        <div className="flex items-center gap-2 text-emerald-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          <span className="text-xs font-black tracking-widest">{app.customerPhone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          if (onUpdateStatus) {
                            onUpdateStatus(app.id, 'confirmed');
                          } else {
                            const updated = appointments.map(a => a.id === app.id ? { ...a, status: 'confirmed' as AppointmentStatus } : a);
                            onUpdateAppointments(updated);
                          }
                        }}
                        className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          if (onUpdateStatus) {
                            onUpdateStatus(app.id, 'cancelled');
                          } else {
                            const updated = appointments.map(a => a.id === app.id ? { ...a, status: 'cancelled' as AppointmentStatus } : a);
                            onUpdateAppointments(updated);
                          }
                        }}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                      >
                        Decline
                      </button>
                      <button 
                        onClick={() => {
                          const link = whatsAppService.getConfirmationLink(
                            app.customerPhone || '',
                            app.customerName || 'Guest',
                            settings.shopName,
                            appServices[0]?.name || 'Service',
                            format(appDate, 'h:mm a'),
                            format(appDate, 'MMM d')
                          );
                          window.open(link, '_blank');
                        }}
                        className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                        title="Notify via WhatsApp"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.432h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Grid */}
      <div className="flex-1 tt-card overflow-hidden flex flex-col min-h-[600px]">
        <div className="flex-1 overflow-auto relative">
          <table className="w-full min-w-[800px] border-collapse relative">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
              <tr>
                <th className="p-4 border-b border-r dark:border-slate-700 w-24">Time</th>
                {currentStaffList.map(staff => (
                  <th key={staff.id} className="p-4 border-b border-r dark:border-slate-700 text-center font-bold text-slate-800 dark:text-white truncate">
                    {staff.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td className="p-4 border-b border-r border-[var(--tt-border)] text-xs font-bold text-[var(--tt-text-muted)] text-right uppercase sticky left-0 bg-[var(--tt-surface)]">
                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </td>
                  {currentStaffList.map(staff => {
                    // Find appointments for this slot
                    const slotAppts = filteredAppointments.filter(app => {
                      const appStart = new Date(app.startTime);
                      return app.staffId === staff.id && appStart.getHours() === hour;
                    });

                    return (
                      <td 
                        key={`${staff.id}-${hour}`} 
                        tabIndex={0}
                        role="button"
                        aria-label={`Book appointment with ${staff.name} at ${hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}`}
                        className="p-1 border-b border-r dark:border-slate-700 relative h-20 align-top group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        onClick={() => openSlot(staff.id, hour)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSlot(staff.id, hour); } }}
                      >
                        {slotAppts.map(app => {
                          const customer = customers.find(c => c.id === app.customerId);
                          const appServices = services.filter(s => app.serviceIds.includes(s.id));
                          const isNoShow = app.status === 'no_show';
                          const isPast = new Date(app.endTime) < new Date();
                          const canMarkNoShow = isPast && app.status !== 'completed' && app.status !== 'cancelled' && app.status !== 'no_show';
                          
                          return (
                            <div 
                              key={app.id} 
                              tabIndex={0}
                              role="button"
                              aria-label={`Edit appointment for ${app.customerName || 'Guest'} with ${staff.name}`}
                              onClick={(e) => { e.stopPropagation(); setEditingAppointment(app); setFormData(app); setIsAdding(true); }}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); setEditingAppointment(app); setFormData(app); setIsAdding(true); } }}
                              className={`absolute inset-x-1 top-1 bottom-1 rounded-lg p-2 text-xs font-bold shadow-sm overflow-hidden border group/card focus:ring-2 focus:ring-amber-500 focus:outline-none
                                ${app.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300' :
                                  app.status === 'completed' ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 opacity-60' :
                                  isNoShow ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300 opacity-70' :
                                  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300'
                                }
                              `}
                            >
                              <div className="truncate">{customer ? customer.name : (app.customerName || 'Walk-in')}</div>
                              <div className="font-normal opacity-80 truncate text-[10px]">{appServices.map(s => s.name).join(', ')}</div>
                              {isNoShow && <div className="text-[9px] font-black uppercase tracking-widest opacity-80 mt-0.5">⚠ No Show</div>}

                              {/* Quick action buttons on hover */}
                              <div className="absolute inset-x-1 bottom-1 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                {/* No-Show quick button — only for past appointments not already finished */}
                                {canMarkNoShow && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onUpdateStatus) {
                                        onUpdateStatus(app.id, 'no_show');
                                      } else {
                                        onUpdateAppointments(appointments.map(a => a.id === app.id ? { ...a, status: 'no_show' as AppointmentStatus } : a));
                                      }
                                      // Offer WhatsApp re-booking nudge
                                      const phone = customer?.phone || app.customerPhone;
                                      if (phone) {
                                        const msg = `Hi ${customer?.name || app.customerName || 'there'} 👋 We noticed you missed your appointment at *${settings.shopName}* today. We'd love to rebook you — just reply here to schedule a new time!`;
                                        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                      }
                                    }}
                                    className="flex-1 py-1 bg-rose-500 text-white rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm"
                                    title="Mark as No-Show & send WhatsApp rebooking message"
                                  >
                                    No Show
                                  </button>
                                )}
                                {/* WhatsApp reminder button */}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const link = whatsAppService.getConfirmationLink(
                                      customer?.phone || app.customerPhone || '',
                                      customer?.name || app.customerName || 'Guest',
                                      settings.shopName,
                                      appServices[0]?.name || 'Service',
                                      format(new Date(app.startTime), 'h:mm a'),
                                      format(new Date(app.startTime), 'MMM d')
                                    );
                                    window.open(link, '_blank');
                                  }}
                                  className="p-1 bg-emerald-500 text-white rounded-md"
                                  title="Send WhatsApp confirmation"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.432h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No-Show Summary Banner */}
      {filteredAppointments.filter(a => a.status === 'no_show').length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/40 rounded-2xl p-5 flex items-center gap-4 no-print"
        >
          <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-rose-700 dark:text-rose-400">
              {filteredAppointments.filter(a => a.status === 'no_show').length} No-Show{filteredAppointments.filter(a => a.status === 'no_show').length > 1 ? 's' : ''} Today
            </p>
            <p className="text-xs text-rose-600/70 dark:text-rose-400/60 mt-0.5">
              {filteredAppointments.filter(a => a.status === 'no_show').map(a => a.customerName || 'Guest').join(', ')}
            </p>
          </div>
          <div className="text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0">
            {filteredAppointments.filter(a => a.status === 'no_show').length > 0 && (
              <span className="bg-rose-100 dark:bg-rose-900/30 px-3 py-1.5 rounded-xl">
                Revenue Lost: ~{settings.currency}{filteredAppointments.filter(a => a.status === 'no_show').reduce((sum, a) => {
                  const svcTotal = services.filter(s => a.serviceIds.includes(s.id)).reduce((t, s) => t + s.price, 0);
                  return sum + svcTotal;
                }, 0).toFixed(0)}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="tt-card w-full max-w-lg p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={closeModal} className="absolute top-6 right-6 p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
                {editingAppointment ? 'Edit Appointment' : 'New Appointment'}
              </h3>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Status Selection (only if editing) */}
                {editingAppointment && (
                  <div className="mb-4">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Status</label>
                     <select 
                       value={formData.status} 
                       onChange={e => setFormData({...formData, status: e.target.value as AppointmentStatus})}
                       className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200"
                     >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="no_show">No Show</option>
                        <option value="cancelled">Cancelled</option>
                     </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Start Time</label>
                    <input 
                      type="datetime-local" 
                      value={formData.startTime ? new Date(new Date(formData.startTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={e => setFormData({...formData, startTime: new Date(e.target.value).toISOString()})}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">End Time</label>
                    <input 
                      type="datetime-local" 
                      value={formData.endTime ? new Date(new Date(formData.endTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={e => setFormData({...formData, endTime: new Date(e.target.value).toISOString()})}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Professional</label>
                   <select 
                     value={formData.staffId} 
                     onChange={e => setFormData({...formData, staffId: e.target.value})}
                     className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200"
                   >
                     {currentStaffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Customer (Optional)</label>
                   <select 
                     value={formData.customerId || ''} 
                     onChange={e => setFormData({...formData, customerId: e.target.value})}
                     className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200"
                   >
                     <option value="">Walk-in (No Account)</option>
                     {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                   </select>
                </div>

                {!formData.customerId && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Name</label>
                      <input 
                        type="text" 
                        value={formData.customerName || ''}
                        onChange={e => setFormData({...formData, customerName: e.target.value})}
                        placeholder="John Doe"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Phone</label>
                      <input 
                        type="text" 
                        value={formData.customerPhone || ''}
                        onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                        placeholder="555-0101"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200"
                      />
                    </div>
                  </div>
                )}

                <div>
                   <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Services</label>
                   <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl max-h-48 overflow-y-auto space-y-2 border border-transparent">
                     {services.map(service => (
                       <label key={service.id} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl cursor-pointer">
                         <input 
                           type="checkbox" 
                           checked={(formData.serviceIds || []).includes(service.id)}
                           onChange={(e) => {
                             const ids = formData.serviceIds || [];
                             if (e.target.checked) setFormData({...formData, serviceIds: [...ids, service.id]});
                             else setFormData({...formData, serviceIds: ids.filter(id => id !== service.id)});
                           }}
                           className="w-4 h-4 text-amber-500 rounded border-slate-300 dark:border-slate-600 focus:ring-amber-500"
                         />
                         <div className="flex-1">
                           <span className="text-sm font-bold dark:text-white">{service.name}</span>
                         </div>
                         <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{settings.currency}{service.price}</span>
                       </label>
                     ))}
                   </div>
                </div>

                <div className="pt-4 flex gap-4 flex-wrap">
                  <button type="submit" className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-amber-500/20">
                    {editingAppointment ? 'Save Changes' : 'Create Appointment'}
                  </button>
                  {/* Appointment → Sale conversion (FEATURE-08) */}
                  {editingAppointment && onConvertToSale && (
                    <button
                      type="button"
                      onClick={() => {
                        closeModal();
                        onConvertToSale(editingAppointment);
                      }}
                      className="flex items-center gap-2 py-4 px-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                      title="Open POS with this appointment's services pre-filled"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Charge
                    </button>
                  )}
                  {editingAppointment && (
                    <button 
                      type="button" 
                      onClick={() => {
                        onUpdateAppointments(appointments.filter(a => a.id !== editingAppointment.id));
                        closeModal();
                      }}
                      className="py-4 px-6 bg-rose-100 hover:bg-rose-200 text-rose-600 dark:bg-rose-500/10 dark:text-rose-500 dark:hover:bg-rose-500/20 font-black rounded-2xl transition-all"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Overlap/Availability Warning Modal */}
      <AnimatePresence>
        {confirmModal && confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--tt-surface)] border border-[var(--tt-border)] rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--tt-text-main)] mb-2">Attention Required</h3>
              <p className="text-[var(--tt-text-muted)] text-sm mb-6 leading-relaxed">{confirmModal.message}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const confirmFn = confirmModal.onConfirm;
                    setConfirmModal(null);
                    confirmFn();
                  }}
                  className="flex-1 py-3 bg-[var(--tt-amber)] hover:scale-105 active:scale-95 text-slate-950 rounded-xl font-black text-sm uppercase tracking-wider transition-all"
                >
                  Proceed
                </button>
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 bg-[var(--tt-surface-2)] text-[var(--tt-text-main)] border border-[var(--tt-border)] rounded-xl font-bold text-sm transition-colors hover:bg-[var(--tt-surface)]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Appointments;
