
import React from 'react';
import { Subscription } from '../types';
import { getTrialDaysRemaining, getStatusText, getStatusBadgeClasses, isSubscriptionValid } from '../services/subscriptionService';
import { motion } from 'framer-motion';

interface SubscriptionBannerProps {
  subscription: Subscription | null;
  onManageSubscription?: () => void;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ subscription, onManageSubscription }) => {
  if (!subscription) return null;

  const isValid = isSubscriptionValid(subscription);
  const daysLeft = getTrialDaysRemaining(subscription);
  const statusText = getStatusText(subscription);
  const badgeClasses = getStatusBadgeClasses(subscription);

  // Don't show banner for active paid subscriptions (not in trial)
  if (subscription.status === 'active') return null;

  // Show warning/expired banner
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-4 md:mx-8 mt-4 p-4 rounded-2xl border flex items-center justify-between gap-4 ${
        !isValid
          ? 'bg-rose-500/10 border-rose-500/20'
          : daysLeft <= 7
          ? 'bg-amber-500/10 border-amber-500/20'
          : 'bg-emerald-500/10 border-emerald-500/20'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`text-2xl`}>
          {!isValid ? '🔒' : daysLeft <= 7 ? '⏰' : '🎉'}
        </div>
        <div>
          <p className={`text-sm font-bold ${!isValid ? 'text-rose-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {statusText}
          </p>
          <p className="text-[10px] text-slate-500">
            {!isValid
              ? 'Your trial has ended. Subscribe to continue using TrimTime.'
              : daysLeft <= 7
              ? `Your trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Subscribe to keep your data.`
              : 'Enjoy full access to all features during your trial.'}
          </p>
        </div>
      </div>

      {onManageSubscription && (
        <button
          onClick={onManageSubscription}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex-shrink-0 ${
            !isValid
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
          }`}
        >
          {!isValid ? 'Subscribe Now' : 'View Plans'}
        </button>
      )}
    </motion.div>
  );
};

/**
 * Compact badge for sidebar display
 */
export const SubscriptionBadge: React.FC<{ subscription: Subscription | null }> = ({ subscription }) => {
  if (!subscription) return null;

  const daysLeft = getTrialDaysRemaining(subscription);
  const badgeClasses = getStatusBadgeClasses(subscription);

  let label = '';
  switch (subscription.status) {
    case 'trial':
      label = `TRIAL • ${daysLeft}d`;
      break;
    case 'active':
      label = 'PRO';
      break;
    case 'expired':
      label = 'EXPIRED';
      break;
    case 'cancelled':
      label = 'CANCELLED';
      break;
  }

  return (
    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${badgeClasses}`}>
      {label}
    </span>
  );
};

/**
 * Full-screen expired overlay
 */
export const SubscriptionExpiredScreen: React.FC<{ 
  onManageSubscription: () => void; 
  onSelectPlan?: (plan: 'monthly' | 'yearly') => void;
  onLogout: () => void;
}> = ({ onManageSubscription, onSelectPlan, onLogout }) => {
  const handlePlanClick = (plan: 'monthly' | 'yearly') => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    } else {
      onManageSubscription();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center z-10"
      >
        <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 border border-rose-500/20 shadow-inner">
          🔒
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Trial Expired</h1>
        <p className="text-slate-400 mb-8 leading-relaxed text-sm">
          Your 30-day free trial has ended. Subscribe to a plan to continue managing your business with TrimTime.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handlePlanClick('monthly')}
              className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:border-amber-500/50 hover:bg-slate-800/80 transition-all cursor-pointer text-center group"
            >
              <p className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors">$15</p>
              <p className="text-slate-400 text-xs mt-1">/month</p>
            </button>
            <button
              type="button"
              onClick={() => handlePlanClick('yearly')}
              className="p-4 bg-amber-500/5 border-2 border-amber-500/30 rounded-2xl hover:border-amber-500 hover:bg-amber-500/10 transition-all relative cursor-pointer text-center group"
            >
              <div className="absolute -top-2.5 right-2 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-sm">SAVE $30</div>
              <p className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors">$150</p>
              <p className="text-slate-400 text-xs mt-1">/year</p>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handlePlanClick('monthly')}
            className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 rounded-2xl font-black text-base shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            Subscribe Now
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3 text-slate-400 hover:text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionBanner;
