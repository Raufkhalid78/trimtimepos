
import { Subscription } from '../types';

// ==========================================
// SUBSCRIPTION SERVICE — Plan display & lifecycle
// ==========================================

/**
 * Calculate days remaining in trial
 */
export function getTrialDaysRemaining(subscription: Subscription): number {
  if (subscription.status !== 'trial') return 0;
  const now = new Date();
  const end = new Date(subscription.trialEnd);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Get human-friendly status text
 */
export function getStatusText(subscription: Subscription): string {
  const days = getTrialDaysRemaining(subscription);
  switch (subscription.status) {
    case 'trial':
      return `Free Trial — ${days} day${days !== 1 ? 's' : ''} left`;
    case 'active':
      return `${subscription.plan === 'monthly' ? 'Monthly' : 'Yearly'} Plan — Active`;
    case 'expired':
      return 'Subscription Expired';
    case 'cancelled':
      return 'Subscription Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Get status color class
 */
export function getStatusColor(subscription: Subscription): string {
  switch (subscription.status) {
    case 'trial':
      return getTrialDaysRemaining(subscription) <= 7 ? 'text-amber-500' : 'text-emerald-500';
    case 'active':
      return 'text-emerald-500';
    case 'expired':
    case 'cancelled':
      return 'text-rose-500';
    default:
      return 'text-slate-500';
  }
}

/**
 * Get status badge color
 */
export function getStatusBadgeClasses(subscription: Subscription): string {
  switch (subscription.status) {
    case 'trial':
      return getTrialDaysRemaining(subscription) <= 7
        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'active':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'expired':
    case 'cancelled':
      return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    default:
      return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  }
}

/**
 * Check if subscription allows app usage
 */
export function isSubscriptionValid(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  if (subscription.status === 'active') return true;
  if (subscription.status === 'trial') {
    return getTrialDaysRemaining(subscription) > 0;
  }
  return false;
}

/**
 * Get plan display info
 */
export function getPlanDisplayInfo(plan: 'monthly' | 'yearly'): { name: string; price: string; period: string; savings?: string } {
  if (plan === 'monthly') {
    return { name: 'Monthly', price: '$15', period: '/month' };
  }
  return { name: 'Yearly', price: '$150', period: '/year', savings: 'Save $30' };
}

export interface SubscriptionLimits {
  maxBranches: number;
  maxEmployees: number;
}

/**
 * Determine maximum branches and employees based on active plan and add-on packs.
 */
export function getSubscriptionLimits(subscription: Subscription | null): SubscriptionLimits {
  if (!subscription) {
    return { maxBranches: 1, maxEmployees: 1 };
  }

  // Base limits
  let baseBranches = 10;
  let baseEmployees = 30;

  if (subscription.status === 'trial') {
    // Generous trial quotas
    baseBranches = 2;
    baseEmployees = 5;
  } else if (subscription.plan === 'yearly') {
    baseBranches = 25;
    baseEmployees = 100;
  }

  // Stackable add-on packs: each pack adds 10 branches and 50 employees
  const packsCount = subscription.addOnPacks || 0;

  return {
    maxBranches: baseBranches + (packsCount * 10),
    maxEmployees: baseEmployees + (packsCount * 50)
  };
}
