/**
 * Service to manage Creem.io subscription checkouts and integration logic.
 * Creem.io is used as the Merchant of Record (MoR) for SaaS subscriptions and add-on packs.
 */

import { PLAN_PRICES } from '../types';

export const getCreemCheckoutUrl = (plan: 'monthly' | 'yearly' | 'addon'): string => {
  if (plan === 'yearly') {
    return (import.meta.env.VITE_CREEM_YEARLY_CHECKOUT_URL as string) || 'https://www.creem.io/payment/prod_1RTmnGDfh1NREFv8YREuKs';
  }
  if (plan === 'addon') {
    return (import.meta.env.VITE_CREEM_ADDON_CHECKOUT_URL as string) || 'https://www.creem.io/payment/prod_2ZUDSYB7rHdHN2CEoORQPT';
  }
  return (import.meta.env.VITE_CREEM_MONTHLY_CHECKOUT_URL as string) || 'https://www.creem.io/payment/prod_1703RaWKPg9yWhvYsBzVmV';
};

export const creemService = {
  plans: {
    monthly: {
      id: 'monthly_plan',
      price: PLAN_PRICES.monthly,
      get checkoutUrl() {
        return getCreemCheckoutUrl('monthly');
      },
    },
    yearly: {
      id: 'yearly_plan',
      price: PLAN_PRICES.yearly,
      get checkoutUrl() {
        return getCreemCheckoutUrl('yearly');
      },
    },
    addon: {
      id: 'addon_pack',
      price: 10,
      get checkoutUrl() {
        return getCreemCheckoutUrl('addon');
      },
    },
  },

  /**
   * Returns true if Creem checkout URLs are available.
   */
  isConfigured: (): boolean => {
    return Boolean(getCreemCheckoutUrl('monthly') && getCreemCheckoutUrl('yearly'));
  },

  /**
   * Redirects the user to the Creem.io hosted checkout page with dynamic tenant metadata.
   * Passes tenantId and email as metadata so the webhook can
   * activate the correct subscription / add-on in Supabase automatically.
   *
   * @param planType  - 'monthly' | 'yearly' | 'addon'
   * @param tenantId  - Your Supabase tenant ID (stored in Creem order metadata)
   * @param email     - Pre-fill customer email in the checkout form
   */
  redirectToCheckout: (planType: 'monthly' | 'yearly' | 'addon', tenantId: string, email: string): void => {
    const baseUrl = getCreemCheckoutUrl(planType);

    if (!baseUrl) {
      console.error(`[CreemService] Checkout URL for "${planType}" plan is not configured.`);
      return;
    }

    const url = new URL(baseUrl);
    // Pre-fill email so the customer doesn't have to type it again
    if (email) {
      url.searchParams.set('customer_email', email);
    }
    // These metadata fields are forwarded to your webhook payload
    url.searchParams.set('metadata[tenant_id]', tenantId);
    url.searchParams.set('metadata[plan]', planType);

    // Direct hosted redirect provides optimal mobile & PWA support (Apple Pay / Google Pay)
    window.location.href = url.toString();
  },

  /**
   * Helper to construct checkout URL
   */
  getCheckoutUrl: (planType: 'monthly' | 'yearly' | 'addon', tenantId: string, email: string): string => {
    const baseUrl = getCreemCheckoutUrl(planType);
    const url = new URL(baseUrl);
    if (email) url.searchParams.set('customer_email', email);
    url.searchParams.set('metadata[tenant_id]', tenantId);
    url.searchParams.set('metadata[plan]', planType);
    return url.toString();
  },
};
