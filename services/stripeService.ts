import { supabase } from '../supabaseClient';

export const createCheckoutSession = async (tenantId: string, plan: 'monthly' | 'yearly', email: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { tenantId, plan, email }
    });

    if (error) throw error;
    if (data?.sessionUrl) {
      window.location.href = data.sessionUrl;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to initiate payment. Please try again later.');
  }
};

export const createCustomerPortalSession = async (tenantId: string) => {
  try {
     const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: { tenantId }
    });

    if (error) throw error;
    if (data?.sessionUrl) {
      window.location.href = data.sessionUrl;
    } else {
      throw new Error('No portal URL returned');
    }
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    throw new Error('Failed to open billing portal. Please try again later.');
  }
};
