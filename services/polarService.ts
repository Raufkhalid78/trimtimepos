/**
 * Service to manage Polar.sh subscription links and integration logic.
 * Polar.sh is used as a Merchant of Record for SaaS subscriptions.
 *
 * HOW TO SET UP:
 * 1. Go to https://polar.sh and create an account / organization named "trimtime".
 * 2. Create two Products: "TrimTime Monthly" ($20/mo) and "TrimTime Yearly" ($200/yr).
 * 3. For each product, grab the Checkout Link from Polar dashboard.
 * 4. Add these two env vars to your .env.local:
 *      VITE_POLAR_MONTHLY_CHECKOUT_URL=https://buy.polar.sh/...
 *      VITE_POLAR_YEARLY_CHECKOUT_URL=https://buy.polar.sh/...
 * 5. Redeploy. Polar will webhook back to activate subscriptions automatically.
 */

const MONTHLY_CHECKOUT_URL = import.meta.env.VITE_POLAR_MONTHLY_CHECKOUT_URL as string | undefined;
const YEARLY_CHECKOUT_URL  = import.meta.env.VITE_POLAR_YEARLY_CHECKOUT_URL  as string | undefined;

export const polarService = {
  plans: {
    monthly: {
      id: 'monthly_plan',
      price: 20,
      checkoutUrl: MONTHLY_CHECKOUT_URL ?? '',
    },
    yearly: {
      id: 'yearly_plan',
      price: 200,
      checkoutUrl: YEARLY_CHECKOUT_URL ?? '',
    },
  },

  /**
   * Returns true if real Polar checkout URLs have been configured.
   */
  isConfigured: (): boolean => {
    return Boolean(MONTHLY_CHECKOUT_URL && YEARLY_CHECKOUT_URL);
  },

  /**
   * Redirects the user to the Polar.sh hosted checkout page.
   * Passes tenantId and email as metadata so the webhook can
   * activate the correct subscription in Supabase.
   *
   * @param planType  - 'monthly' | 'yearly'
   * @param tenantId  - Your Supabase tenant ID (stored in Polar order metadata)
   * @param email     - Pre-fill customer email in the checkout form
   */
  redirectToCheckout: (planType: 'monthly' | 'yearly', tenantId: string, email: string): void => {
    const baseUrl = polarService.plans[planType].checkoutUrl;

    if (!baseUrl) {
      console.error(
        `[PolarService] Checkout URL for "${planType}" plan is not configured. ` +
        'Add VITE_POLAR_MONTHLY_CHECKOUT_URL / VITE_POLAR_YEARLY_CHECKOUT_URL to your .env.local.'
      );
      return;
    }

    const url = new URL(baseUrl);
    // Pre-fill email so the customer doesn't have to type it
    url.searchParams.set('customer_email', email);
    // These metadata fields are forwarded to your webhook payload
    url.searchParams.set('metadata[tenant_id]', tenantId);
    url.searchParams.set('metadata[plan]', planType);

    window.location.href = url.toString();
  },

  /**
   * @deprecated Use redirectToCheckout instead.
   * Kept for backwards compatibility.
   */
  getCheckoutUrl: (planType: 'monthly' | 'yearly', tenantId: string, email: string): string => {
    const baseUrl = polarService.plans[planType].checkoutUrl;
    return `${baseUrl}?customer_email=${encodeURIComponent(email)}&metadata[tenant_id]=${tenantId}&metadata[plan]=${planType}`;
  },
};
