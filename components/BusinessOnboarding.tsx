import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BusinessType, PLAN_PRICES } from '../types';
import { completeBusinessRegistration, SignUpData } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface BusinessOnboardingProps {
  onSuccess: () => void | Promise<void>;
  onLogout: () => void | Promise<void>;
}

// ==========================================
//  PRE-BUILT SERVICE CATALOGS BY BUSINESS TYPE
// ==========================================
const BARBER_SERVICES = [
  { id: 'svc_b1', name: 'Classic Haircut', price: 30, duration: 30, category: 'Hair' },
  { id: 'svc_b2', name: 'Skin Fade', price: 40, duration: 45, category: 'Hair' },
  { id: 'svc_b3', name: 'Beard Trim', price: 20, duration: 20, category: 'Beard' },
  { id: 'svc_b4', name: 'Hot Towel Shave', price: 35, duration: 40, category: 'Shave' },
  { id: 'svc_b5', name: "Kid's Haircut", price: 20, duration: 25, category: 'Hair' },
  { id: 'svc_b6', name: 'Head Shave', price: 25, duration: 30, category: 'Hair' },
  { id: 'svc_b7', name: 'Hair Wash & Style', price: 15, duration: 20, category: 'Hair' },
  { id: 'svc_b8', name: 'Beard Coloring', price: 30, duration: 30, category: 'Beard' },
];

const SALON_SERVICES = [
  { id: 'svc_s1', name: 'Haircut & Blowdry', price: 50, duration: 60, category: 'Hair' },
  { id: 'svc_s2', name: 'Hair Coloring', price: 80, duration: 90, category: 'Color' },
  { id: 'svc_s3', name: 'Highlights / Balayage', price: 120, duration: 120, category: 'Color' },
  { id: 'svc_s4', name: 'Manicure', price: 25, duration: 30, category: 'Nails' },
  { id: 'svc_s5', name: 'Pedicure', price: 35, duration: 45, category: 'Nails' },
  { id: 'svc_s6', name: 'Facial Treatment', price: 60, duration: 60, category: 'Skincare' },
  { id: 'svc_s7', name: 'Waxing (Full Legs)', price: 45, duration: 40, category: 'Waxing' },
  { id: 'svc_s8', name: 'Eyebrow Threading', price: 12, duration: 15, category: 'Waxing' },
  { id: 'svc_s9', name: 'Keratin Treatment', price: 150, duration: 120, category: 'Hair' },
  { id: 'svc_s10', name: 'Bridal Makeup', price: 200, duration: 90, category: 'Makeup' },
];

function getServicesForType(type: BusinessType) {
  if (type === 'barbershop') return BARBER_SERVICES;
  if (type === 'beauty_salon') return SALON_SERVICES;
  return [...BARBER_SERVICES, ...SALON_SERVICES];
}

const BusinessOnboarding: React.FC<BusinessOnboardingProps> = ({ onSuccess, onLogout }) => {
  const { authUser } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 4; // Skipped email/password step!

  // Card 1: Business
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('barbershop');

  // Card 2: Plan (Original Step 3)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');

  // Card 3: Services (Original Step 4)
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [servicesInitialized, setServicesInitialized] = useState(false);

  // Card 4: Staff (Original Step 5)
  const [staffList, setStaffList] = useState<Array<{ name: string; role: 'admin' | 'employee'; commission: number; username: string; password: string }>>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffCommission, setNewStaffCommission] = useState(40);

  // State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [copied, setCopied] = useState(false);

  // Initialize services when reaching step 3
  if (step === 3 && !servicesInitialized) {
    const allServices = getServicesForType(businessType);
    setSelectedServiceIds(new Set(allServices.map(s => s.id)));
    setServicesInitialized(true);
  }

  const validateStep = (): boolean => {
    setError('');
    switch (step) {
      case 1:
        if (!businessName.trim()) { setError('Business name is required.'); return false; }
        if (businessName.trim().length < 2) { setError('Business name must be at least 2 characters.'); return false; }
        return true;
      case 2:
        return true; // Plan always has a default
      case 3:
        if (selectedServiceIds.size === 0) { setError('Please select at least one service to start with.'); return false; }
        return true;
      case 4:
        return true; // Staff is optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(s => Math.min(s + 1, totalSteps));
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(s => Math.max(s - 1, 1));
      setError('');
    } else {
      onLogout();
    }
  };

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addStaffMember = () => {
    if (!newStaffName.trim() || !newStaffUsername.trim() || !newStaffPassword.trim()) return;
    setStaffList(prev => [...prev, {
      name: newStaffName.trim(),
      role: 'employee' as const,
      commission: newStaffCommission,
      username: newStaffUsername.trim(),
      password: newStaffPassword.trim(),
    }]);
    setNewStaffName('');
    setNewStaffUsername('');
    setNewStaffPassword('');
    setNewStaffCommission(40);
  };

  const removeStaff = (idx: number) => {
    setStaffList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!validateStep() || !authUser) return;
    setLoading(true);
    setError('');

    // Auto-add any pending staff member if all required fields are filled
    let finalStaffList = staffList;
    if (newStaffName.trim() && newStaffUsername.trim() && newStaffPassword.trim()) {
      finalStaffList = [...staffList, {
        name: newStaffName.trim(),
        role: 'employee' as const,
        commission: newStaffCommission,
        username: newStaffUsername.trim(),
        password: newStaffPassword.trim(),
      }];
    }

    const allServices = getServicesForType(businessType);
    const selectedServices = allServices.filter(s => selectedServiceIds.has(s.id));

    const email = authUser.email || '';
    const ownerName = authUser.user_metadata?.full_name || email.split('@')[0] || 'Owner';

    const data = {
      businessName: businessName.trim(),
      businessType,
      plan,
      selectedServices,
      staffMembers: finalStaffList,
      email,
      ownerName
    };

    const result = await completeBusinessRegistration(data);

    if (result.success) {
      setGeneratedSlug(result.slug || '');
      setShowSuccess(true);
    } else {
      let errorMsg = result.error || 'Setup failed.';
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        errorMsg = "Network Error: Could not reach Supabase. Please try again.";
      }
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080c14] relative overflow-x-hidden flex items-center justify-center py-12 px-4 sm:px-6 z-50">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-amber-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Header */}
        {!showSuccess && (
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center font-brand text-3xl text-slate-950 mx-auto mb-4 shadow-xl shadow-amber-500/20">
              T
            </div>
            <h1 className="text-3xl font-black text-white font-brand tracking-tight">Complete Setup</h1>
            <p className="text-slate-500 text-sm mt-2">Step {step} of {totalSteps}</p>

            {/* Progress Bar */}
            <div className="flex gap-2 mt-6 max-w-xs mx-auto">
              {[...Array(totalSteps)].map((_, i) => (
                <div key={i} className="h-1.5 flex-1 rounded-full bg-slate-800/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: i + 1 <= step ? '100%' : '0%' }}
                    className="h-full bg-amber-500"
                    transition={{ duration: 0.3 }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/5 p-6 sm:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={showSuccess ? 'success' : step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {showSuccess ? (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-emerald-500/20">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white mb-2">Setup Complete!</h2>
                    <p className="text-slate-400 text-sm">Your business account is ready.</p>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-5 text-left mb-6">
                    <div>
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Employee Login Link</p>
                      <p className="text-xs text-slate-400 mb-4 px-2 italic">Share this link with your team so they can login for their shifts. Bookmark it on your staff tablet or phone.</p>
                    </div>

                    <div className="relative group">
                      <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-emerald-400 font-mono text-[10px] break-all pr-12">
                        https://trimtimepos.com/staff-login/{generatedSlug}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://trimtimepos.com/staff-login/${generatedSlug}`);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                      >
                        {copied ? '✅' : '📋'}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await onSuccess();
                      } finally {
                        setTimeout(() => setLoading(false), 500);
                      }
                    }}
                    disabled={loading}
                    className="w-full py-5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-[1.5rem] font-black text-xl shadow-xl shadow-amber-500/10 disabled:opacity-60"
                  >
                    {loading ? 'Loading Dashboard...' : 'Go to Dashboard →'}
                  </motion.button>
                </div>
              ) : (
                <>
                  {/* ========== CARD 1: Business Details ========== */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-black text-white mb-1">Business Details</h2>
                        <p className="text-slate-500 text-sm">Tell us about your business.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Business Name</label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={e => setBusinessName(e.target.value)}
                          placeholder="e.g. The Sharp Fade"
                          className="w-full bg-slate-800/30 border border-slate-700/50 text-white rounded-2xl px-5 py-4 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-600 font-medium"
                          autoFocus
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Business Type</label>
                        <div className="space-y-3">
                          {[
                            { value: 'barbershop', label: 'Barbershop', icon: '💈', desc: 'Fades, beards, classic cuts' },
                            { value: 'beauty_salon', label: 'Beauty Salon', icon: '✨', desc: 'Color, styling, nails, aesthetics' },
                            { value: 'both', label: 'Both', icon: '✂️', desc: 'Full service hair and beauty' },
                          ].map(bt => (
                            <button
                              key={bt.value}
                              type="button"
                              onClick={() => { setBusinessType(bt.value as BusinessType); setServicesInitialized(false); }}
                              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${businessType === bt.value
                                ? 'border-amber-500 bg-amber-500/5'
                                : 'border-slate-700/50 bg-slate-800/20 hover:border-slate-600'
                                }`}
                            >
                              <span className="text-3xl">{bt.icon}</span>
                              <div>
                                <p className={`font-bold ${businessType === bt.value ? 'text-amber-400' : 'text-white'}`}>{bt.label}</p>
                                <p className="text-xs text-slate-500">{bt.desc}</p>
                              </div>
                              {businessType === bt.value && (
                                <svg className="w-5 h-5 text-amber-500 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========== CARD 2: Choose Plan ========== */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-black text-white mb-1">Choose Your Plan</h2>
                        <p className="text-slate-500 text-sm">Both plans include a 1-month free trial. No credit card needed.</p>
                      </div>

                      <div className="space-y-4">
                        <button
                          type="button"
                          onClick={() => setPlan('monthly')}
                          className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${plan === 'monthly'
                            ? 'border-amber-500 bg-amber-500/5'
                            : 'border-slate-700/50 bg-slate-800/20 hover:border-slate-600'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-black text-white text-lg">Monthly</p>
                              <p className="text-slate-500 text-xs mt-0.5">Billed monthly, cancel anytime</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-white">${PLAN_PRICES.monthly}</p>
                              <p className="text-slate-500 text-xs">/month</p>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPlan('yearly')}
                          className={`w-full p-5 rounded-2xl border-2 transition-all text-left relative ${plan === 'yearly'
                            ? 'border-amber-500 bg-amber-500/5'
                            : 'border-slate-700/50 bg-slate-800/20 hover:border-slate-600'
                            }`}
                        >
                          <div className="absolute -top-2.5 right-4 bg-emerald-500 text-white px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Save $40
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-black text-white text-lg">Yearly</p>
                              <p className="text-slate-500 text-xs mt-0.5">Best value — only $16.67/mo</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-white">${PLAN_PRICES.yearly}</p>
                              <p className="text-slate-500 text-xs">/year</p>
                            </div>
                          </div>
                        </button>
                      </div>

                      <div className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-4 mt-6">
                        <p className="text-xs text-slate-400 font-medium">Includes: Unlimited staff, unlimited bookings, point of sale, inventory tracking, analytics, and Priority Support.</p>
                      </div>
                    </div>
                  )}

                  {/* ========== CARD 3: Starting Services ========== */}
                  {step === 3 && (
                    <div className="space-y-6 h-full flex flex-col">
                      <div>
                        <h2 className="text-xl font-black text-white mb-1">Starting Services</h2>
                        <p className="text-slate-500 text-sm">We've selected popular services for a {businessType.replace('_', ' ')}. You can edit prices and add more later.</p>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-2 scrollbar-hide">
                        {getServicesForType(businessType).map(svc => {
                          const isSelected = selectedServiceIds.has(svc.id);
                          return (
                            <button
                              key={svc.id}
                              type="button"
                              onClick={() => toggleService(svc.id)}
                              className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${isSelected
                                ? 'border-amber-500/30 bg-amber-500/5'
                                : 'border-slate-700/30 bg-slate-800/20 opacity-50'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-600 text-transparent'}`}>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <div>
                                  <p className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{svc.name}</p>
                                  <p className="text-[10px] text-slate-500">{svc.duration} mins</p>
                                </div>
                              </div>
                              <p className={`font-mono text-sm ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}>${svc.price}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ========== CARD 4: Staff Setup ========== */}
                  {step === 4 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-black text-white mb-1">Add Your Team</h2>
                        <p className="text-slate-500 text-sm">Add staff members who will use the POS. You can skip this and add them later.</p>
                      </div>

                      {staffList.length > 0 && (
                        <div className="space-y-2">
                          {staffList.map((s, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-xl border border-slate-700/30">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center font-black text-xs">
                                  {(s.name || 'S').charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white">{s.name}</p>
                                  <p className="text-[10px] text-slate-500">@{s.username} • {s.commission}% commission</p>
                                </div>
                              </div>
                              <button type="button" onClick={() => removeStaff(i)} className="text-slate-500 hover:text-rose-400 transition-colors p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="bg-slate-800/20 border border-slate-700/30 rounded-2xl p-4 space-y-3">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Add Team Member</p>
                        <input
                          type="text"
                          value={newStaffName}
                          onChange={e => setNewStaffName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full bg-slate-800/40 border border-slate-700/40 text-white rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none placeholder:text-slate-600"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={newStaffUsername}
                            onChange={e => setNewStaffUsername(e.target.value)}
                            placeholder="Login Username"
                            className="w-full bg-slate-800/40 border border-slate-700/40 text-white rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none placeholder:text-slate-600"
                          />
                          <input
                            type="text"
                            value={newStaffPassword}
                            onChange={e => setNewStaffPassword(e.target.value)}
                            placeholder="Login Password"
                            className="w-full bg-slate-800/40 border border-slate-700/40 text-white rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none placeholder:text-slate-600"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] text-slate-500 font-bold mb-1 block">Commission %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={newStaffCommission}
                              onChange={e => setNewStaffCommission(parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-800/40 border border-slate-700/40 text-white rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={addStaffMember}
                            disabled={!newStaffName.trim() || !newStaffUsername.trim() || !newStaffPassword.trim()}
                            className="mt-5 px-5 py-3 bg-amber-500 text-slate-950 rounded-xl text-sm font-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold py-3 px-4 rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!showSuccess && (
          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-4 bg-slate-800/50 border border-slate-700/50 text-slate-400 rounded-2xl font-bold hover:bg-slate-800 transition-colors"
            >
              {step === 1 ? 'Cancel Setup' : '← Previous'}
            </button>

            {step < totalSteps ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={handleNext}
                className="flex-1 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-2xl font-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all"
              >
                Next →
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-r from-emerald-400 to-emerald-600 text-slate-950 rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Creating...
                  </span>
                ) : 'Launch My Business 🚀'}
              </motion.button>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default BusinessOnboarding;
