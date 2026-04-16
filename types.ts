
// ==========================================
// SaaS / Multi-Tenant Types
// ==========================================

export type BusinessType = 'barbershop' | 'beauty_salon' | 'both';

export interface Tenant {
  id: string;
  ownerId: string;
  businessName: string;
  businessType: BusinessType;
  slug: string; // URL slug for public booking
  createdAt: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  tenantId: string;
  plan: 'monthly' | 'yearly';
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trialStart: string;
  trialEnd: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  price: number;
  createdAt: string;
}

export const PLAN_PRICES = {
  monthly: 20,
  yearly: 200,
} as const;

export type SaaSView = 'landing' | 'signup' | 'login' | 'app';

// ==========================================
// App View Enum
// ==========================================

export enum View {
  DASHBOARD = 'DASHBOARD',
  POS = 'POS',
  FINANCE = 'FINANCE',
  INVENTORY = 'INVENTORY',
  STAFF = 'STAFF',
  CUSTOMERS = 'CUSTOMERS',
  SETTINGS = 'SETTINGS',
  APPOINTMENTS = 'APPOINTMENTS'
}

export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
}

export type Language = 'en' | 'ur';

export interface ShopSettings {
  shopName: string;
  currency: string;
  language: Language;
  countryCode: string;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  receiptFooter: string;
  taxRate: number;
  taxType: 'included' | 'excluded';
  billingCycleDay: number; // 1-31
  promoCodes: DiscountCode[];
  deductExpensesFromCommission: boolean;
  loyaltyEnabled: boolean;
  pointsPerCurrency: number; // e.g. 1 point per $1
  minPointsToRedeem: number;
  // Online Booking
  bookingEnabled: boolean;
  bookingSlug: string;
}

export interface Service {
  id: string;
  name: string;
  nameUr?: string; // Added Urdu Name
  price: number;
  duration: number; // minutes
  category: string;
}

export interface Product {
  id: string;
  name: string;
  nameUr?: string;
  price: number;
  cost: number;
  stock: number;
  barcode?: string;
  lowStockThreshold?: number;
  supplierId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface StockLog {
  id: string;
  productId: string;
  change: number;
  reason: 'sale' | 'restock' | 'adjustment' | 'damage' | 'return';
  timestamp: string;
  userId: string;
  notes?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: UserRole;
  commission: number; // percentage
  username: string;
  password?: string;
  email?: string;
  isFallback?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
  loyaltyPoints: number;
  preferences?: string;
}

export type AppointmentStatus = 'unconfirmed' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  customerId?: string;
  staffId: string;
  serviceIds: string[];
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export interface StaffAvailability {
  id: string;
  staffId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  points: number;
  type: 'earn' | 'redeem' | 'adjustment';
  saleId?: string;
  timestamp: string;
}

export interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
}

export interface SaleItem {
  id: string;
  name: string;
  nameUr?: string; // Persist Urdu name in sale items
  price: number;
  type: 'service' | 'product';
  quantity: number;
}

export interface Sale {
  id: string;
  timestamp: string;
  items: SaleItem[];
  staffId: string;
  customerId?: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  discountCode?: string;
  paymentMethod: 'cash' | 'card' | 'split';
  splitDetails?: { cash: number; card: number };
  taxType: 'included' | 'excluded';
  isRefunded?: boolean;
  refundReason?: string;
  costOfGoods: number;
  redeemedPoints?: number;
  earnedPoints?: number;
  // Stored snapshots of names at time of sale
  staffName?: string;
  customerName?: string;
}

export interface Refund {
  id: string;
  saleId: string;
  timestamp: string;
  amount: number;
  reason: string;
  items: SaleItem[];
  staffId: string;
}

export interface CashDrawerSession {
  id: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  endingCash?: number;
  actualCash?: number;
  notes?: string;
  userId: string;
  status: 'open' | 'closed';
}

export interface HeldSale {
  id: string;
  timestamp: string;
  cart: SaleItem[];
  customerId?: string;
  staffId?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  receiptImage?: string; // Base64 string of the receipt
}

export interface AdvancePayment {
  id: string;
  staffId: string;
  date: string;
  amount: number;
  description: string;
}
