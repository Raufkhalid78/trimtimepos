import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { Service, Staff, AppointmentStatus } from '../types';
import { format, addMinutes, startOfDay, isBefore, isAfter, parse, addDays, isSameDay } from 'date-fns';
import { setPageMeta } from '../utils/seo';

const BookingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { 
    services, staff, staffAvailability, appointments, settings, loading, branches,
    fetchPublicTenantBySlug, publicCreateAppointment 
  } = useData();

  useEffect(() => { setPageMeta('Book Your Appointment', 'Book an appointment at your favorite barber shop or beauty salon online with TrimTime.'); }, []);

  const [step, setStep] = useState(1);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const filteredStaffForBranch = useMemo(() => {
    if (!selectedBranchId) return staff;
    return staff.filter(s => s.branchId === selectedBranchId);
  }, [staff, selectedBranchId]);

  useEffect(() => {
    if (branches.length > 0) {
      if (branches.length === 1) {
        setSelectedBranchId(branches[0].id);
        setStep(1);
      } else {
        setStep(0);
      }
    }
  }, [branches]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    if (slug) {
      fetchPublicTenantBySlug(slug).then(t => {
        if (!t) {
          setError("Business not found, online booking is disabled, or database permissions are restricting access.");
        } else {
          setTenant(t);
        }
      }).catch(err => {
         setError("Failed to connect to the database: " + err.message);
      });
    }
  }, [slug, fetchPublicTenantBySlug]);

  const availableTimeSlots = useMemo(() => {
    if (!selectedStaff || !selectedService || !selectedDate) return [];

    const dayOfWeek = selectedDate.getDay(); // 0 for Sunday
    const dayAvail = staffAvailability.find(a => a.staffId === selectedStaff.id && a.dayOfWeek === dayOfWeek);
    
    if (!dayAvail) return [];

    const slots: string[] = [];
    let current = parse(dayAvail.startTime.substring(0, 5), 'HH:mm', selectedDate);
    const end = parse(dayAvail.endTime.substring(0, 5), 'HH:mm', selectedDate);
    const slotDuration = selectedService.duration;

    // Filter appointments for this staff on this day
    const dayAppointments = appointments.filter(a => 
      a.staffId === selectedStaff.id && 
      isSameDay(new Date(a.startTime), selectedDate) &&
      a.status !== 'cancelled'
    );

    while (isBefore(addMinutes(current, slotDuration), end) || addMinutes(current, slotDuration).getTime() === end.getTime()) {
      const timeStr = format(current, 'HH:mm');
      const currentEnd = addMinutes(current, slotDuration);

      // Check for overlap
      const hasOverlap = dayAppointments.some(appt => {
        const apptStart = new Date(appt.startTime);
        const apptEnd = new Date(appt.endTime);
        return (isBefore(current, apptEnd) && isAfter(currentEnd, apptStart));
      });

      // Check if slot is in the past
      const isPast = isBefore(current, new Date());

      if (!hasOverlap && !isPast) {
        slots.push(timeStr);
      }
      
      current = addMinutes(current, 15); // 15-minute intervals between potential starts
    }

    return slots;
  }, [selectedStaff, selectedService, selectedDate, staffAvailability, appointments]);

  const handleBooking = async () => {
    if (!selectedService || !selectedStaff || !selectedTime || !customerName || !customerPhone) {
      setError("Please fill in all details.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const startDateTime = parse(selectedTime, 'HH:mm', selectedDate);
      const endDateTime = addMinutes(startDateTime, selectedService.duration);

      const newAppointment = {
        branchId: selectedBranchId || undefined,
        staffId: selectedStaff.id,
        serviceIds: [selectedService.id],
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        status: 'unconfirmed' as AppointmentStatus,
        customerName,
        customerPhone,
        customerEmail,
        notes: `Online booking via ${slug}`
      };

      const success = await publicCreateAppointment(newAppointment, tenant.id);
      
      if (success) {
        setStep(5); // Success step
      } else {
        setError("Failed to create appointment. Please try again or call the shop.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !services.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading shop details...</p>
      </div>
    );
  }

  if (error && step !== 5) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Unavailable</h2>
        <p className="text-slate-500 mb-8">{error}</p>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header Info */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Book an Appointment</h1>
        <p className="text-slate-400 font-medium">at {settings.shopName}</p>
      </div>

      {/* Progress Bar */}
      {step < 5 && (
        <div className="flex gap-2 mb-12">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-slate-800'}`}></div>
          ))}
        </div>
      )}

      
      <AnimatePresence mode="wait">
        {/* Step 0: Location Selection */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="step0">
            <h2 className="text-xl font-bold text-white mb-6">Choose a Location</h2>
            <div className="grid gap-4">
              {branches.filter(b => b.isActive).map(b => (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBranchId(b.id); setStep(1); }}
                  className="flex flex-col p-6 rounded-[2rem] border transition-all bg-slate-900/50 border-white/5 text-slate-300 hover:border-white/10 text-left hover:scale-[1.01] active:scale-95"
                >
                  <span className="font-bold text-white text-lg">{b.name}</span>
                  {b.address && <span className="text-sm text-slate-400 mt-1">📍 {b.address}</span>}
                  {b.phone && <span className="text-xs text-slate-500 mt-1">📞 {b.phone}</span>}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 1: Services */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="step1">
            {branches.length > 1 && (
              <button onClick={() => setStep(0)} className="mb-6 p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl flex items-center gap-2 text-xs font-bold self-start">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Back to Locations
              </button>
            )}
            <h2 className="text-xl font-bold text-white mb-6">Which service would you like?</h2>
            <div className="grid gap-3">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); setStep(2); }}
                  className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all ${selectedService?.id === s.id ? 'bg-amber-500 border-amber-400 text-slate-950 scale-[1.02]' : 'bg-slate-900/50 border-white/5 text-slate-300 hover:border-white/10'}`}
                >
                  <div className="text-left">
                    <p className="font-bold text-lg">{s.name}</p>
                    <p className={`text-xs ${selectedService?.id === s.id ? 'text-slate-800' : 'text-slate-500'}`}>{s.duration} mins • {s.category}</p>
                  </div>
                  <div className="text-xl font-black">{settings.currency}{s.price}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Staff */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="step2">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setStep(1)} className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <h2 className="text-xl font-bold text-white">Choose a professional</h2>
            </div>
            <div className="grid gap-3">
              {filteredStaffForBranch.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStaff(s); setStep(3); }}
                  className={`flex items-center gap-4 p-5 rounded-[2rem] border transition-all ${selectedStaff?.id === s.id ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900/50 border-white/5 text-slate-300 hover:border-white/10'}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${selectedStaff?.id === s.id ? 'bg-slate-950 text-amber-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {(s.name || 'S').charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">{s.name}</p>
                    <p className={`text-xs uppercase tracking-widest font-black ${selectedStaff?.id === s.id ? 'text-slate-800' : 'text-slate-500'}`}>{s.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Date & Time */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="step3">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setStep(2)} className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <h2 className="text-xl font-bold text-white">Select time</h2>
            </div>
            
            <div className="flex gap-2 mb-8 overflow-x-auto pb-4 scrollbar-hide">
              {[0, 1, 2, 3, 4, 5, 6].map(i => {
                const date = addDays(new Date(), i);
                const isActive = isSameDay(date, selectedDate);
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                    className={`flex-shrink-0 w-20 py-4 border rounded-[1.5rem] transition-all ${isActive ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900/50 border-white/5 text-slate-500 hover:border-white/10'}`}
                  >
                    <p className="text-[10px] uppercase font-black mb-1">{format(date, 'EEE')}</p>
                    <p className="text-lg font-black">{format(date, 'd')}</p>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableTimeSlots.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`py-4 rounded-2xl border text-sm font-bold transition-all ${selectedTime === t ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
              {availableTimeSlots.length === 0 && (
                <div className="col-span-full py-12 text-center bg-slate-900/20 border border-dashed border-white/5 rounded-[2rem]">
                  <p className="text-slate-500 font-bold">No slots available for this day.</p>
                </div>
              )}
            </div>

            {selectedTime && (
              <motion.button
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setStep(4)}
                className="w-full mt-12 py-5 bg-white text-slate-950 rounded-[1.5rem] font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                Continue →
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Step 4: Contact */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="step4">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setStep(3)} className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <h2 className="text-xl font-bold text-white">Your details</h2>
            </div>

            <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-2">Full Name</label>
                <input
                  type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="John Doe" required
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-2xl px-6 py-4 focus:border-amber-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-2">Phone Number</label>
                <input
                  type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+1 234 567 890" required
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-2xl px-6 py-4 focus:border-amber-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-2">Email Address (Optional)</label>
                <input
                  type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-2xl px-6 py-4 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="pt-4">
                <div className="flex justify-between items-center mb-4 px-2">
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-black text-slate-600">Total Price</p>
                    <p className="text-2xl font-black text-white">{settings.currency}{selectedService?.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-black text-slate-600">Booking with</p>
                    <p className="text-sm font-bold text-amber-500">{selectedStaff?.name}</p>
                  </div>
                </div>
                
                <button
                  disabled={!customerName || !customerPhone || isSubmitting}
                  onClick={handleBooking}
                  className="w-full py-5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-[1.5rem] font-black text-lg shadow-xl shadow-amber-500/10 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'Processing...' : 'Request Booking'}
                </button>
                <p className="text-center text-[10px] text-slate-500 mt-4 px-4">By tapping Request Booking, you agree to receive messages from {settings.shopName} regarding your appointment.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key="success" className="text-center py-12">
            <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Booking Requested!</h2>
            <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem] mb-8 text-center">
              <p className="text-slate-400 font-medium mb-6">We've received your request for <span className="text-white font-bold">{selectedService?.name}</span> with <span className="text-white font-bold">{selectedStaff?.name}</span> at <span className="text-amber-500 font-bold">{selectedTime}</span>.</p>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-[0.3em] text-amber-500/50">Status</span>
                <span className="px-4 py-1.5 bg-amber-500/10 text-amber-500 text-xs font-black uppercase tracking-widest border border-amber-500/20 rounded-full">Pending Approval</span>
              </div>
            </div>
            <p className="text-slate-500 text-sm mb-12 italic">The manager will review your request and contact you shortly via WhatsApp or call to confirm.</p>
            <button onClick={() => setStep(1)} className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all">
              Book another appointment
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingPage;
