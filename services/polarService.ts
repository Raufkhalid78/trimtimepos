/**
 * Service to manage Polar.sh subscription links and integration logic.
 * Polar.sh is used as a Merchant of Record for SaaS subscriptions.
 */
export const polarService = {
  // Replace these with actual Polar.sh product/checkout IDs when available
  plans: {
    monthly: {
      id: 'monthly_plan',
      price: 20,
      checkoutUrl: 'https://polar.sh/trimtime/checkout/monthly', // Placeholder
    },
    yearly: {
      id: 'yearly_plan',
      price: 200,
      checkoutUrl: 'https://polar.sh/trimtime/checkout/yearly', // Placeholder
    }
  },

  /**
   * Generates a checkout URL with pre-filled tenant information.
   */
  getCheckoutUrl: (planType: 'monthly' | 'yearly', tenantId: string, email: string) => {
    const baseUrl = polarService.plans[planType].checkoutUrl;
    // We can pass metadata to Polar via query params if they support it, 
    // or use a setup where we link the Polar customer to our tenantId later.
    return `${baseUrl}?email=${encodeURIComponent(email)}&metadata_tenant_id=${tenantId}`;
  }
};
