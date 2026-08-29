import { describe, it, expect } from 'vitest';
import { getTrialDaysRemaining, isSubscriptionValid } from '../services/subscriptionService';
import { Subscription } from '../types';

describe('Subscription Service & Validation Logic', () => {
  const baseSubscription: Subscription = {
    id: 'sub-1',
    tenantId: 'tenant-1',
    plan: 'monthly',
    status: 'trial',
    trialStart: new Date().toISOString(),
    trialEnd: new Date(Date.now() + 15 * 86400000).toISOString(),
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    price: 15,
    createdAt: new Date().toISOString(),
  };

  it('should compute remaining trial days accurately', () => {
    const days = getTrialDaysRemaining(baseSubscription);
    expect(days).toBeGreaterThanOrEqual(14);
    expect(days).toBeLessThanOrEqual(16);
  });

  it('should validate active trial subscription', () => {
    expect(isSubscriptionValid(baseSubscription)).toBe(true);
  });

  it('should validate active paid subscription', () => {
    const activeSub: Subscription = {
      ...baseSubscription,
      status: 'active',
    };
    expect(isSubscriptionValid(activeSub)).toBe(true);
  });

  it('should invalidate expired trial subscription', () => {
    const expiredTrial: Subscription = {
      ...baseSubscription,
      status: 'trial',
      trialEnd: new Date(Date.now() - 86400000).toISOString(), // 1 day in past
    };
    expect(isSubscriptionValid(expiredTrial)).toBe(false);
  });

  it('should invalidate cancelled subscription', () => {
    const cancelledSub: Subscription = {
      ...baseSubscription,
      status: 'cancelled',
    };
    expect(isSubscriptionValid(cancelledSub)).toBe(false);
  });
});
