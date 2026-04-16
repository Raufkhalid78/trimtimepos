import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Appointment, Staff, Service, Customer, Language, AppointmentStatus, ShopSettings } from '../types';
import { TRANSLATIONS } from '../constants';
import { format } from 'date-fns';
import { whatsAppService } from '../services/whatsAppService';

interface AppointmentsProps {
  appointments: Appointment[];
  staffList: Staff[];
  services: Service[];
  customers: Customer[];
  language: Language;
  onUpdateAppointments: (appointments: Appointment[]) => void;
  settings: ShopSettings;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 9); // 9 AM to 7 PM

const Appointments: React.FC<AppointmentsProps> = ({ appointments, staffList, services, customers, language, onUpdateAppointments, settings }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<Partial<Appointment>>({
    staffId: staffList[0]?.id || '',
    serviceIds: [],
    startTime: '',
    endTime: '',
    status: 'pending'
  });

  const t = TRANSLATIONS[language];

  // Utility to check if an appointment falls on the selected date
  const getAppointmentsForDate = () => {
    return appointments.filter(app => {
      const appDate = new Date(app.startTime);
      return appDate.getDate() === selectedDate.getDate() &&
             appDate.getMonth() === selectedDate.getMonth() &&
             appDate.getFullYear() === selectedDate.getFullYear();
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Quick validation
    if (!formData.startTime || !formData.endTime || !formData.staffId || formData.serviceIds?.length === 0) {
      alert("Please fill in all required fields.");
      return;
    }

    if (editingAppointment) {
      const updated = appointments.map(app => app.id === editingAppointment.id ? { ...editingAppointment, ...formData } as Appointment : app);
      onUpdateAppointments(updated);
    } else {
      const newApp: Appointment = {
        id: 'app_' + Math.random().toString(36).substr(2, 9),
        ...(formData as Omit<Appointment, 'id'>)
      };
      onUpdateAppointments([...appointments, newApp]);
    }
    closeModal();
  };

  const closeModal = () => {
    setIsAdding(false);
    setEditingAppointment(null);
    setFormData({
      staffId: staffList[0]?.id || '',
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
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white font-brand">Appointments</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your daily schedule and bookings.</p>
        </div>
        <div className="flex gap-4 items-center">
          <input 
            type="date" 
            value={selectedDate.toISOString().split('T')[0]} 
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 dark:text-white"
          />
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-amber-500 text-slate-950 px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 text-sm"
          >
            + New Booking
          </button>
        </div>
      </div>

      {/* Approval Queue */}
      <AnimatePresence>
        {appointments.filter(a => a.status === 'unconfirmed').length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-[2rem] p-6 mb-6 overflow-hidden no-print"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-amber-500 text-slate-950 rounded-lg flex items-center justify-center font-black text-xs animate-pulse">!</div>
              <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400">Approval Queue</h3>
              <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded-full font-bold">
                {appointments.filter(a => a.status === 'unconfirmed').length} pending requests
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments.filter(a => a.status === 'unconfirmed').map(app => {
                const staff = staffList.find(s => s.id === app.staffId);
                const appServices = services.filter(s => app.serviceIds.includes(s.id));
                const appDate = new Date(app.startTime);
                
                return (
                  <motion.div 
                    key={app.id} 
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-amber-200 dark:border-amber-900/50 shadow-sm"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-black text-slate-800 dark:text-white line-clamp-1">{app.customerName || 'Guest'}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{app.customerPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-amber-500 uppercase tracking-widest">{format(appDate, 'h:mm a')}</p>
                        <p className="text-[10px] text-slate-400">{format(appDate, 'MMM d')}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                        <span className="line-clamp-1">{appServices.map(s => s.name).join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
                        With {staff?.name}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          const updated = appointments.map(a => a.id === app.id ? { ...a, status: 'confirmed' as AppointmentStatus } : a);
                          onUpdateAppointments(updated);
                        }}
                        className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-400 transition-all"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          const updated = appointments.map(a => a.id === app.id ? { ...a, status: 'cancelled' as AppointmentStatus } : a);
                          onUpdateAppointments(updated);
                        }}
                        className="flex-1 py-2 bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-xl text-xs font-black hover:bg-rose-200 transition-all"
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
                        className="p-2 bg-amber-500/10 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all"
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
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="flex-1 overflow-auto relative">
          <table className="w-full min-w-[800px] border-collapse relative">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
              <tr>
                <th className="p-4 border-b border-r dark:border-slate-700 w-24">Time</th>
                {staffList.map(staff => (
                  <th key={staff.id} className="p-4 border-b border-r dark:border-slate-700 text-center font-bold text-slate-800 dark:text-white truncate">
                    {staff.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td className="p-4 border-b border-r dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 text-right uppercase sticky left-0 bg-white dark:bg-slate-900">
                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </td>
                  {staffList.map(staff => {
                    // Find appointments for this slot
                    const slotAppts = filteredAppointments.filter(app => {
                      const appStart = new Date(app.startTime);
                      return app.staffId === staff.id && appStart.getHours() === hour;
                    });

                    return (
                      <td 
                        key={`${staff.id}-${hour}`} 
                        className="p-1 border-b border-r dark:border-slate-700 relative h-20 align-top group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        onClick={() => openSlot(staff.id, hour)}
                      >
                        {slotAppts.map(app => {
                          const customer = customers.find(c => c.id === app.customerId);
                          const appServices = services.filter(s => app.serviceIds.includes(s.id));
                          
                          return (
                            <div 
                              key={app.id} 
                              onClick={(e) => { e.stopPropagation(); setEditingAppointment(app); setFormData(app); setIsAdding(true); }}
                              className={`absolute inset-x-1 top-1 bottom-1 rounded-lg p-2 text-xs font-bold shadow-sm overflow-hidden border
                                ${app.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300' :
                                  app.status === 'completed' ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 opacity-60' :
                                  app.status === 'no_show' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300' :
                                  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300'
                                }
                              `}
                            >
                              <div className="truncate">{customer ? customer.name : (app.customerName || 'Walk-in')}</div>
                              <div className="font-normal opacity-80 truncate text-[10px]">{appServices.map(s => s.name).join(', ')}</div>
                              
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
                                className="absolute right-1 bottom-1 p-1 bg-emerald-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.432h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                              </button>
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
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
                     {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                         <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">${service.price}</span>
                       </label>
                     ))}
                   </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="submit" className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-amber-500/20">
                    {editingAppointment ? 'Save Changes' : 'Create Appointment'}
                  </button>
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
    </div>
  );
};

export default Appointments;
