import { supabase } from '../supabaseClient';
import { BusinessType, Tenant, Subscription, Staff, PLAN_PRICES } from '../types';
import { hashPassword } from './passwordService';

// ==========================================
// AUTH SERVICE — Registration, Login, Tenant Management
// ==========================================

export interface SignUpData {
  // Card 1: Business Details
  businessName: string;
  businessType: BusinessType;
  // Card 2: Account
  email: string;
  password: string;
  ownerName: string;
  // Card 3: Plan
  plan: 'monthly' | 'yearly';
  // Card 4: Services (pre-selected based on businessType)
  selectedServices: Array<{ id: string; name: string; price: number; duration: number; category: string }>;
  // Card 5: Staff
  staffMembers: Array<{ name: string; role: 'admin' | 'employee'; commission: number; username: string; password: string }>;
}

/**
 * Register a new business — creates auth user, tenant, subscription, and seed data
 */
export async function registerNewBusiness(data: SignUpData): Promise<{ success: boolean; error?: string; tenantId?: string; slug?: string }> {
  try {
    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.ownerName,
          business_name: data.businessName,
        }
      }
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Failed to create user account.');

    const userId = authData.user.id;

    // Generate a URL-safe slug from business name
    const slug = data.businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      + '-' + Math.random().toString(36).substring(2, 6);

    // 2. Create Tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        owner_id: userId,
        business_name: data.businessName,
        business_type: data.businessType,
        slug: slug,
        is_active: true,
      })
      .select()
      .single();

    if (tenantError) throw new Error(`Tenant creation failed: ${tenantError.message}`);

    const tenantId = tenant.id;

    // 3. Create Subscription (starts with 30-day free trial)
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);

    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        tenant_id: tenantId,
        plan: data.plan,
        status: 'trial',
        trial_start: new Date().toISOString(),
        trial_end: trialEnd.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEnd.toISOString(),
        price: PLAN_PRICES[data.plan],
      });

    if (subError) throw new Error(`Subscription creation failed: ${subError.message}`);

    // Hash passwords concurrently
    const ownerPassword = await hashPassword(data.password);
    
    // 4. Create Admin Staff (the owner)
    const { error: staffError } = await supabase
      .from('staff')
      .insert({
        id: 'st_owner_' + userId.substring(0, 8),
        tenant_id: tenantId,
        name: data.ownerName,
        role: 'admin',
        commission: 0,
        username: data.email.split('@')[0],
        password: ownerPassword,
        email: data.email,
      });

    if (staffError) console.error('Staff seed error:', staffError);

    // 5. Seed additional staff from wizard
    if (data.staffMembers.length > 0) {
      const staffRows = await Promise.all(
        data.staffMembers.map(async (s) => ({
          id: 'st_' + Math.random().toString(36).substr(2, 9),
          tenant_id: tenantId,
          name: s.name,
          role: s.role,
          commission: s.commission,
          username: s.username,
          password: await hashPassword(s.password),
          email: null,
        }))
      );

      const { error: extraStaffError } = await supabase.from('staff').insert(staffRows);
      if (extraStaffError) console.error('Extra staff seed error:', extraStaffError);
    }

    // 6. Seed selected services
    if (data.selectedServices.length > 0) {
      const serviceRows = data.selectedServices.map(s => ({
        id: s.id,
        tenant_id: tenantId,
        name: s.name,
        price: s.price,
        duration: s.duration,
        category: s.category,
      }));

      const { error: svcError } = await supabase.from('services').insert(serviceRows);
      if (svcError) console.error('Service seed error:', svcError);
    }

    // 7. Seed default settings
    const { error: settError } = await supabase
      .from('settings')
      .insert({
        id: 1,
        tenant_id: tenantId,
        data: {
          shopName: data.businessName,
          currency: '$',
          language: 'en',
          countryCode: '+1',
          taxRate: 0,
          taxType: 'excluded',
          whatsappEnabled: false,
          whatsappNumber: '',
          receiptFooter: 'Thank you for choosing us!',
          billingCycleDay: 1,
          deductExpensesFromCommission: false,
          loyaltyEnabled: false,
          pointsPerCurrency: 1,
          minPointsToRedeem: 100,
          promoCodes: [],
          bookingEnabled: false,
          bookingSlug: slug,
        }
      });

    if (settError) console.error('Settings seed error:', settError);

    return { success: true, tenantId, slug };

  } catch (err: any) {
    console.error('Registration Error:', err);
    return { success: false, error: err.message || 'Registration failed. Please try again.' };
  }
}

/**
 * Sign in an existing business owner
 */
export async function loginWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Get the current authenticated user's tenant
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    ownerId: data.owner_id,
    businessName: data.business_name,
    businessType: data.business_type,
    slug: data.slug,
    createdAt: data.created_at,
    logoUrl: data.logo_url,
    isActive: data.is_active,
  };
}

/**
 * Get the current tenant's subscription
 */
export async function getCurrentSubscription(tenantId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  // Auto-check if trial has expired
  const now = new Date();
  const trialEnd = new Date(data.trial_end);
  let status = data.status;

  if (status === 'trial' && now > trialEnd) {
    // Trial expired — update in DB
    status = 'expired';
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('id', data.id);
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    plan: data.plan,
    status,
    trialStart: data.trial_start,
    trialEnd: data.trial_end,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    price: data.price,
    createdAt: data.created_at,
  };
}

/**
 * Manually activate a subscription (Demo Mode)
 */
export async function demoActivateSubscription(tenantId: string, plan: 'monthly' | 'yearly'): Promise<boolean> {
  const price = plan === 'monthly' ? 20 : 200;
  
  // Update existing subscription to active
  const { error } = await supabase
    .from('subscriptions')
    .update({ 
      status: 'active',
      plan: plan,
      price: price,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + (plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('tenant_id', tenantId);

  return !error;
}

/**
 * Get the owner's staff record for a tenant
 */
export async function getOwnerStaff(tenantId: string): Promise<Staff | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('role', 'admin')
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    role: data.role as any,
    commission: typeof data.commission === 'string' ? parseFloat(data.commission) : (data.commission || 0),
    username: data.username,
    password: data.password,
    email: data.email,
  };
}
