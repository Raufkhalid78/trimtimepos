import React, { useState } from 'react';
import { Staff, StaffAvailability, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface AvailabilityModalProps {
  staff: Staff;
  availability: StaffAvailability[];
  onSave: (availability: StaffAvailability[]) => void;
  onClose: () => void;
  language: Language;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({ staff, availability, onSave, onClose, language }) => {
  const t = TRANSLATIONS[language];
  
  // Initialize local state with existing availability or defaults
  const [localAvail, setLocalAvail] = useState<StaffAvailability[]>(() => {
    const existing = availability.filter(a => a.staffId === staff.id);
    if (existing.length > 0) return existing;
    
    // Default: Mon-Fri 09:00 - 18:00
    return [1, 2, 3, 4, 5].map(day => ({
      id: Math.random().toString(36).substr(2, 9),
      staffId: staff.id,
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '18:00'
    }));
  });

  const toggleDay = (dayIndex: number) => {
    setLocalAvail(prev => {
      const exists = prev.find(a => a.dayOfWeek === dayIndex);
      if (exists) {
        return prev.filter(a => a.dayOfWeek !== dayIndex);
      } else {
        return [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          staffId: staff.id,
          dayOfWeek: dayIndex,
          startTime: '09:00',
          endTime: '18:00'
        }];
      }
    });
  };

  const updateTime = (dayIndex: number, type: 'start' | 'end', value: string) => {
    setLocalAvail(prev => prev.map(a => 
      a.dayOfWeek === dayIndex 
        ? { ...a, [type === 'start' ? 'startTime' : 'endTime']: value } 
        : a
    ));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="tt-card w-full max-w-xl p-8 md:p-10 shadow-2xl overflow-y-auto max-h-[85vh]"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t.staffAvailability || 'Working Hours'}</h3>
            <p className="text-sm font-bold text-amber-500 uppercase tracking-widest">{staff.name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="space-y-3">
          {DAYS.map((dayName, idx) => {
            const dayAvail = localAvail.find(a => a.dayOfWeek === idx);
            const isActive = !!dayAvail;
            
            return (
              <div key={dayName} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isActive ? 'bg-[var(--tt-surface-2)] border-[var(--tt-amber)]/30' : 'bg-[var(--tt-surface)] border-[var(--tt-border)] opacity-60'}`}>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleDay(idx)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${isActive ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'left-7' : 'left-1'}`} />
                  </button>
                  <span className={`font-black text-sm uppercase tracking-widest ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {t[dayName.toLowerCase()] || dayName}
                  </span>
                </div>

                {isActive && (
                  <div className="flex items-center gap-2">
                    <input 
                      type="time" 
                      value={dayAvail.startTime} 
                      onChange={(e) => updateTime(idx, 'start', e.target.value)}
                      className="bg-[var(--tt-surface)] border-0 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-[var(--tt-amber)]/20 outline-none text-[var(--tt-text-main)]"
                    />
                    <span className="text-slate-400 font-bold">to</span>
                    <input 
                      type="time" 
                      value={dayAvail.endTime} 
                      onChange={(e) => updateTime(idx, 'end', e.target.value)}
                      className="bg-[var(--tt-surface)] border-0 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-[var(--tt-amber)]/20 outline-none text-[var(--tt-text-main)]"
                    />
                  </div>
                )}
                
                {!isActive && (
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.closed || 'Off Duty'}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 mt-10">
          <button 
            onClick={() => onSave(localAvail)}
            className="flex-1 px-4 py-4 bg-slate-950 dark:bg-amber-500 text-white dark:text-slate-950 rounded-2xl font-black text-base hover:bg-slate-800 dark:hover:bg-amber-600 transition-all shadow-xl"
          >
            {t.saveChanges || 'Save Availability'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AvailabilityModal;
