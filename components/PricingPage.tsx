import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Language, PLAN_PRICES } from '../types';
import { TRANSLATIONS } from '../constants';
import { demoActivateSubscription, addDemoAddOnPack } from '../services/authService';
import { polarService } from '../services/polarService';
import { useToast } from '../contexts/ToastContext';

interface PricingPageProps {
  tenantId: string;
  userEmail: string;
  language: Language;
  onClose: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ tenantId, userEmail, language, onClose }) => {
  const t = TRANSLATIONS[language];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setIsLoading(true);
    setError(null);
    try {
      if (polarService.isConfigured()) {
        // ✅ Production path: redirect to Polar.sh hosted checkout
        polarService.redirectToCheckout(plan, tenantId, userEmail);
        // Navigation will happen — no need to reset loading state
      } else {
        // 🚧 Demo / Dev fallback: activate subscription directly in Supabase
        // Remove this block once Polar is fully wired up.
        const success = await demoActivateSubscription(tenantId, plan);
        if (success) {
          showToast('Plan activated locally! (Dev Mode)', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          throw new Error('Demo activation failed.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Activation failed');
      setIsLoading(false);
    }
  };

  const handleAddOnPurchase = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await addDemoAddOnPack(tenantId);
      if (success) {
        showToast('Scale Add-on Pack activated! (+10 Branches, +50 Employees)', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('Add-on activation failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Add-on purchase failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 relative max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
          disabled={isLoading}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white font-brand tracking-tighter mb-4">
            Select Your Plan
          </h2>
          <p className="text-slate-400 text-lg">
            Upgrade your account to unlock all premium features and continue growing your business with TrimTime.
          </p>
        </div>

        {!import.meta.env.PROD && !polarService.isConfigured() && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-center text-sm">
            ⚠️ <strong>Payment not yet connected.</strong> Add <code>VITE_POLAR_MONTHLY_CHECKOUT_URL</code> and <code>VITE_POLAR_YEARLY_CHECKOUT_URL</code> to your <code>.env.local</code> to enable real Polar.sh payments.
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-center font-bold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Monthly Plan */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 flex flex-col hover:border-amber-500/50 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">Monthly</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-black text-white">${PLAN_PRICES.monthly}</span>
              <span className="text-slate-400">/ month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                'Max 10 Branches / Locations',
                'Max 30 Employees / Staff',
                'Unlimited Transactions',
                'Inventory Tracking',
                'Payroll & Commission Tracking',
                'Standard Support'
              ].map(feature => (
                <li key={feature} className="flex items-center gap-3 text-slate-300 text-sm">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-black uppercase tracking-widest transition-colors disabled:opacity-50 text-sm"
            >
              {isLoading ? 'Processing...' : 'Subscribe Monthly'}
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="bg-gradient-to-b from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-3xl p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">
              Save $30/yr
            </div>
            <h3 className="text-xl font-bold text-amber-500 mb-2">Yearly (Pro)</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-black text-white">${PLAN_PRICES.yearly}</span>
              <span className="text-slate-400">/ year</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                'Max 25 Branches / Locations',
                'Max 100 Employees / Staff',
                'Everything in Monthly',
                'AI Financial Insights',
                'Priority 24/7 Support',
                'Advanced Reports & Exports'
              ].map(feature => (
                <li key={feature} className="flex items-center gap-3 text-slate-300 text-sm">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('yearly')}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl font-black uppercase tracking-widest transition-colors disabled:opacity-50 shadow-lg shadow-amber-500/20 text-sm"
            >
              {isLoading ? 'Processing...' : 'Subscribe Yearly'}
            </button>
          </div>
        </div>

        {/* Add-on Pack Card */}
        <div className="max-w-4xl mx-auto border border-violet-500/20 bg-gradient-to-r from-violet-950/10 to-violet-900/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-violet-500/40 transition-colors">
          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20">
              Stackable Expansion
            </div>
            <h3 className="text-xl font-bold text-white">Scale Add-on Pack</h3>
            <p className="text-slate-400 text-sm max-w-xl">
              Need more branches or team members? Stacks infinitely on top of your existing plan. Adds **+10 Branches** and **+50 Employees** per purchase.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4 min-w-[200px]">
            <div className="text-center md:text-right">
              <span className="text-4xl font-black text-white">$10</span>
              <span className="text-slate-400 text-xs block">/ month</span>
            </div>
            <button
              onClick={handleAddOnPurchase}
              disabled={isLoading}
              className="w-full py-3.5 px-6 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg shadow-violet-600/20 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Purchase Add-on'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PricingPage;
