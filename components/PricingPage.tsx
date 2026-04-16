import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Language, PLAN_PRICES } from '../types';
import { TRANSLATIONS } from '../constants';
import { polarService } from '../services/polarService';

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

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setIsLoading(true);
    setError(null);
    try {
      const checkoutUrl = polarService.getCheckoutUrl(plan, tenantId, userEmail);
      window.open(checkoutUrl, '_blank');
      // We don't necessarily need to set loading back to false here if we assume 
      // the user is leaving, but for safety: 
      setTimeout(() => setIsLoading(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Check out initiation failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 relative my-8"
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

        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-center font-bold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 flex flex-col hover:border-amber-500/50 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">Monthly</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-black text-white">${PLAN_PRICES.monthly}</span>
              <span className="text-slate-400">/ month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {['Unlimited Transactions', 'Staff Management', 'Inventory Tracking', 'Standard Support', 'Basic Reports'].map(feature => (
                <li key={feature} className="flex items-center gap-3 text-slate-300">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-black uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Subscribe Monthly'}
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="bg-gradient-to-b from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-3xl p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">
              Save $40/yr
            </div>
            <h3 className="text-xl font-bold text-amber-500 mb-2">Yearly (Pro)</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-black text-white">${PLAN_PRICES.yearly}</span>
              <span className="text-slate-400">/ year</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {['Everything in Monthly', 'AI Financial Insights', 'Priority 24/7 Support', 'Advanced Analytics', 'Early Access to Features'].map(feature => (
                <li key={feature} className="flex items-center gap-3 text-slate-300">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('yearly')}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl font-black uppercase tracking-widest transition-colors disabled:opacity-50 shadow-lg shadow-amber-500/20"
            >
              {isLoading ? 'Processing...' : 'Subscribe Yearly'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PricingPage;
