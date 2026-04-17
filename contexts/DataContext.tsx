import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { notificationService } from '../services/notificationService';
import { format } from 'date-fns';
import { 
  Service, Product, Staff, Expense, Customer, Sale, 
  AdvancePayment, Supplier, StockLog, ShopSettings, 
  Appointment, StaffAvailability, AppointmentStatus
} from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { ensureHashed } from '../services/passwordService';

interface DataContextType {
  services: Service[];
  products: Product[];
  staff: Staff[];
  expenses: Expense[];
  customers: Customer[];
  sales: Sale[];
  advancePayments: AdvancePayment[];
  suppliers: Supplier[];
  stockLogs: StockLog[];
  appointments: Appointment[];
  staffAvailability: StaffAvailability[];
  settings: ShopSettings;
  loading: boolean;
  
  fetchData: (isSilent?: boolean) => Promise<void>;
  fetchPublicTenantBySlug: (slug: string) => Promise<any>;
  
  // CRUD Handlers
  updateServices: (updated: Service[]) => Promise<void>;
  updateProducts: (updated: Product[]) => Promise<void>;
  updateStaff: (updated: Staff[]) => Promise<void>;
  updateCustomers: (updated: Customer[]) => Promise<void>;
  updateSettings: (updated: ShopSettings) => Promise<void>;
  updateSuppliers: (updated: Supplier[]) => Promise<void>;
  updateAppointments: (updated: Appointment[]) => Promise<void>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  updateStaffAvailability: (staffId: string, updated: StaffAvailability[]) => Promise<void>;
  addStockLog: (log: StockLog) => Promise<void>;
  completeSale: (sale: Sale) => Promise<boolean>;
  deleteSales: (ids: string[]) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addAdvance: (advance: AdvancePayment) => Promise<void>;
  deleteAdvance: (id: string) => Promise<void>;
  publicCreateAppointment: (appointment: Omit<Appointment, 'id'>, tenantId: string) => Promise<boolean>;
  testNotification: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentTenant, currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [advancePayments, setAdvancePayments] = useState<AdvancePayment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staffAvailability, setStaffAvailability] = useState<StaffAvailability[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);

  const tenantId = currentTenant?.id;

  const fetchData = useCallback(async (isSilent = false) => {
    if (!currentTenant) return;
    if (!isSilent) setLoading(true);
    const tid = currentTenant.id;
    
    try {
      const [sv, pr, st, ex, cu, sa, se, ap, sup, sl, appts, avail] = await Promise.all([
        supabase.from('services').select('*').eq('tenant_id', tid),
        supabase.from('products').select('*').eq('tenant_id', tid),
        supabase.from('staff').select('*').eq('tenant_id', tid),
        supabase.from('expenses').select('*').eq('tenant_id', tid),
        supabase.from('customers').select('*').eq('tenant_id', tid),
        supabase.from('sales').select('*').eq('tenant_id', tid),
        supabase.from('settings').select('*').eq('tenant_id', tid).single(),
        supabase.from('advance_payments').select('*').eq('tenant_id', tid),
        supabase.from('suppliers').select('*').eq('tenant_id', tid),
        supabase.from('stock_logs').select('*').eq('tenant_id', tid),
        supabase.from('appointments').select('*').eq('tenant_id', tid),
        supabase.from('staff_availability').select('*').eq('tenant_id', tid)
      ]);

      if (sv.data) setServices(sv.data.map((s: any) => ({ ...s, nameUr: s.name_ur })));
      if (pr.data) {
        const fetchedProducts = pr.data.map((p: any) => ({ 
          ...p, 
          lowStockThreshold: p.low_stock_threshold,
          nameUr: p.name_ur,
          supplierId: p.supplier_id 
        }));
        setProducts(fetchedProducts);
        
        // Low stock notification
        const lowStockItems = fetchedProducts.filter((p: any) => p.stock <= (p.lowStockThreshold || 5));
        if (lowStockItems.length > 0) {
          notificationService.show('⚠️ Low Stock Alert', {
            body: `${lowStockItems.length} items need restocking soon.`,
            tag: 'low-stock-alert'
          });
        }
      }
      if (st.data) setStaff(st.data.map((s: any) => ({ ...s, commission: typeof s.commission === 'string' ? parseFloat(s.commission) : (s.commission || 0) })));
      if (ex.data) setExpenses(ex.data.map((e: any) => ({ ...e, receiptImage: e.receipt_image })));
      if (cu.data) setCustomers(cu.data.map((c: any) => ({ ...c, createdAt: c.created_at })));
      
      if (sa.data) {
        setSales(sa.data.map((s: any) => ({
          ...s,
          items: (typeof s.items === 'string' ? JSON.parse(s.items) : s.items) || [],
          staffName: s.professional_name,
          customerName: s.customer_name,
          staffId: s.staff_id,
          customerId: s.customer_id,
          discountCode: s.discount_code,
          taxType: s.tax_type
        })));
      }

      if (ap.data) setAdvancePayments(ap.data.map((a: any) => ({ ...a, staffId: a.staff_id })));
      if (sup.data) setSuppliers(sup.data.map((s: any) => ({ ...s, contactName: s.contact_name })));
      if (sl.data) setStockLogs(sl.data.map((l: any) => ({ ...l, productId: l.product_id, userId: l.user_id })));
      
      if (appts.data) {
        setAppointments(appts.data.map((a: any) => ({
          ...a,
          staffId: a.staff_id,
          customerId: a.customer_id,
          serviceIds: (typeof a.service_ids === 'string' ? JSON.parse(a.service_ids) : a.service_ids) || [],
          startTime: a.start_time,
          endTime: a.end_time,
          customerName: a.customer_name,
          customerPhone: a.customer_phone
        })));
      }

      if (avail.data) {
        setStaffAvailability(avail.data.map((a: any) => ({
          ...a,
          staffId: a.staff_id,
          dayOfWeek: a.day_of_week,
          startTime: a.start_time,
          endTime: a.end_time
        })));
      }

      if (se.data?.data) setSettings({ ...DEFAULT_SETTINGS, ...se.data.data });

    } catch (err) {
      console.error('Data loading error:', err);
      showToast('Error loading shop data', 'error');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [currentTenant, showToast]);

  const fetchPublicTenantBySlug = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      // 1. Fetch Tenant by Slug
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (tenantError || !tenantData) {
        setLoading(false);
        return false;
      }

      const publicTenantId = tenantData.id;

      // 2. Fetch all public data for this tenant
      const [sv, st, se, avail] = await Promise.all([
        supabase.from('services').select('*').eq('tenant_id', publicTenantId),
        supabase.from('staff').select('*').eq('tenant_id', publicTenantId),
        supabase.from('settings').select('*').eq('tenant_id', publicTenantId).single(),
        supabase.from('staff_availability').select('*').eq('tenant_id', publicTenantId)
      ]);

      if (sv.data) setServices(sv.data.map((s: any) => ({ ...s, nameUr: s.name_ur })));
      if (st.data) setStaff(st.data.map((s: any) => ({ ...s, commission: typeof s.commission === 'string' ? parseFloat(s.commission) : (s.commission || 0) })));
      
      if (se.data?.data) {
        const fetchedSettings = { ...DEFAULT_SETTINGS, ...se.data.data };
        setSettings(fetchedSettings);
        
        // If booking is disabled for this shop, stop here
        if (!fetchedSettings.bookingEnabled) {
          setLoading(false);
          return null;
        }
      }

      if (avail.data) {
        setStaffAvailability(avail.data.map((a: any) => ({
          ...a,
          staffId: a.staff_id,
          dayOfWeek: a.day_of_week,
          startTime: a.start_time,
          endTime: a.end_time
        })));
      }

      // We also need to fetch existing appointments to check for conflicts (only future ones)
      const { data: apptsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', publicTenantId)
        .gte('start_time', new Date().toISOString());

      if (apptsData) {
        setAppointments(apptsData.map((a: any) => ({
          ...a,
          staffId: a.staff_id,
          customerId: a.customer_id,
          serviceIds: (typeof a.service_ids === 'string' ? JSON.parse(a.service_ids) : a.service_ids) || [],
          startTime: a.start_time,
          endTime: a.end_time,
          customerName: a.customer_name,
          customerPhone: a.customer_phone
        })));
      }

      setLoading(false);
      return tenantData;

    } catch (err) {
      console.error('Data loading error:', err);
      showToast('Error loading shop data', 'error');
      setLoading(false);
      return null;
    }
  }, [showToast]);

  const updateServices = async (updated: Service[]) => {
    if (!tenantId) return;
    const currentIds = new Set(services.map(i => i.id));
    const newIds = new Set(updated.map(i => i.id));
    const toDelete = Array.from(currentIds).filter(id => !newIds.has(id));
    setServices(updated);
    try {
      if (toDelete.length) await supabase.from('services').delete().in('id', toDelete);
      if (updated.length) {
        const rows = updated.map(s => ({ id: s.id, tenant_id: tenantId, name: s.name, name_ur: s.nameUr, price: s.price, duration: s.duration, category: s.category }));
        const { error } = await supabase.from('services').upsert(rows);
        if (error) throw error;
      }
    } catch (e) { showToast("Failed to sync services", "error"); }
  };

  const updateProducts = async (updated: Product[]) => {
    if (!tenantId) return;
    const currentIds = new Set(products.map(i => i.id));
    const newIds = new Set(updated.map(i => i.id));
    const toDelete = Array.from(currentIds).filter(id => !newIds.has(id));
    setProducts(updated);
    try {
      if (toDelete.length) await supabase.from('products').delete().in('id', toDelete);
      if (updated.length) {
        const rows = updated.map(p => ({ id: p.id, tenant_id: tenantId, name: p.name, name_ur: p.nameUr, price: p.price, cost: p.cost, stock: p.stock, barcode: p.barcode || null, low_stock_threshold: p.lowStockThreshold || 15 }));
        const { error } = await supabase.from('products').upsert(rows);
        if (error) throw error;
      }
    } catch (e) { showToast("Failed to sync products", "error"); }
  };

  const updateStaff = async (updated: Staff[]) => {
    if (!tenantId) return;
    const currentIds = new Set(staff.map(i => i.id));
    const newIds = new Set(updated.map(i => i.id));
    const toDelete = Array.from(currentIds).filter(id => !newIds.has(id));
    setStaff(updated);
    try {
      if (toDelete.length) await supabase.from('staff').delete().in('id', toDelete);
      if (updated.length) {
        const rows = await Promise.all(updated.map(async s => ({ id: s.id, tenant_id: tenantId, name: s.name, role: s.role, commission: s.commission, username: s.username, password: await ensureHashed(s.password || ''), email: s.email })));
        const { error } = await supabase.from('staff').upsert(rows);
        if (error) throw error;
      }
    } catch (e) { showToast("Failed to sync staff", "error"); }
  };

  const updateCustomers = async (updated: Customer[]) => {
    if (!tenantId) return;
    const currentIds = new Set(customers.map(i => i.id));
    const newIds = new Set(updated.map(i => i.id));
    const toDelete = Array.from(currentIds).filter(id => !newIds.has(id));
    setCustomers(updated);
    try {
      if (toDelete.length) await supabase.from('customers').delete().in('id', toDelete);
      if (updated.length) {
        const rows = updated.map(c => ({ id: c.id, tenant_id: tenantId, name: c.name, phone: c.phone, email: c.email, notes: c.notes, created_at: c.createdAt, loyalty_points: c.loyaltyPoints || 0 }));
        const { error } = await supabase.from('customers').upsert(rows);
        if (error) throw error;
      }
    } catch (e) { showToast("Failed to sync customers", "error"); }
  };

  const updateSettings = async (updated: ShopSettings) => {
    if (!tenantId) return;
    setSettings(updated);
    try {
      const { error } = await supabase.from('settings').upsert({ id: 1, tenant_id: tenantId, data: updated });
      if (error) throw error;
    } catch (e) { showToast("Failed to save settings", "error"); }
  };

  const updateSuppliers = async (updated: Supplier[]) => {
    if (!tenantId) return;
    const currentIds = new Set(suppliers.map(i => i.id));
    const newIds = new Set(updated.map(i => i.id));
    const toDelete = Array.from(currentIds).filter(id => !newIds.has(id));
    setSuppliers(updated);
    try {
      if (toDelete.length) await supabase.from('suppliers').delete().in('id', toDelete);
      if (updated.length) {
        const rows = updated.map(s => ({ id: s.id, tenant_id: tenantId, name: s.name, contact_name: s.contactName, phone: s.phone, email: s.email, address: s.address }));
        const { error } = await supabase.from('suppliers').upsert(rows);
        if (error) throw error;
      }
    } catch (e) { showToast("Failed to sync suppliers", "error"); }
  };

  const updateAppointments = async (updated: Appointment[]) => {
    if (!tenantId) return;
    const currentIds = new Set(appointments.map(i => i.id));
    const newIds = new Set(updated.map(i => i.id));
    const toDelete = Array.from(currentIds).filter(id => !newIds.has(id));
    setAppointments(updated);
    try {
      if (toDelete.length) await supabase.from('appointments').delete().in('id', toDelete);
      if (updated.length) {
        const rows = updated.map(a => ({ 
          id: a.id, 
          tenant_id: tenantId, 
          staff_id: a.staffId, 
          customer_id: a.customerId || null, 
          service_ids: JSON.stringify(a.serviceIds), 
          start_time: a.startTime, 
          end_time: a.endTime, 
          status: a.status, 
          notes: a.notes || null, 
          customer_name: a.customerName || null, 
          customer_phone: a.customerPhone || null,
          customer_email: a.customerEmail || null
        }));
        const { error } = await supabase.from('appointments').upsert(rows);
        if (error) throw error;
      }
    } catch (e) { showToast("Failed to sync appointments", "error"); }
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      showToast("Failed to update status", "error");
      // Optionally roll back state if needed, but usually we prefer showing error
    }
  };

  const updateStaffAvailability = async (staffId: string, updated: StaffAvailability[]) => {
    if (!tenantId) return;
    setStaffAvailability(prev => {
      const filtered = prev.filter(a => a.staffId !== staffId);
      return [...filtered, ...updated];
    });
    try {
      await supabase.from('staff_availability').delete().eq('staff_id', staffId);
      if (updated.length) {
        const rows = updated.map(a => ({ tenant_id: tenantId, staff_id: a.staffId, day_of_week: a.dayOfWeek, start_time: a.startTime, end_time: a.endTime }));
        const { error } = await supabase.from('staff_availability').insert(rows);
        if (error) throw error;
      }
      showToast("Availability updated", "success");
    } catch (e) { showToast("Failed to sync availability", "error"); }
  };

  const addStockLog = async (log: StockLog) => {
    if (!tenantId) return;
    setStockLogs(prev => [log, ...prev]);
    try {
      const { error } = await supabase.from('stock_logs').insert({ id: log.id, tenant_id: tenantId, product_id: log.productId, change: log.change, reason: log.reason, timestamp: log.timestamp, user_id: log.userId, notes: log.notes });
      if (error) throw error;
    } catch (e) { console.error(e); }
  };

  const completeSale = async (sale: Sale) => {
    if (!tenantId) return false;
    const isRefund = sale.isRefunded;
    if (isRefund) setSales(prev => prev.map(s => s.id === sale.id ? sale : s));
    else setSales(prev => [...prev, sale]);

    try {
      const { error } = await supabase.from('sales').upsert({ id: sale.id, tenant_id: tenantId, timestamp: sale.timestamp, items: sale.items, staff_id: sale.staffId, customer_id: sale.customerId, total: sale.total, subtotal: sale.subtotal, tax: sale.tax, discount: sale.discount, discount_code: sale.discountCode, payment_method: sale.paymentMethod, split_details: sale.splitDetails || null, tax_type: sale.taxType, cost_of_goods: sale.costOfGoods, is_refunded: sale.isRefunded || false, refund_reason: sale.refundReason || null, redeemed_points: sale.redeemedPoints || 0, earned_points: sale.earnedPoints || 0, customer_name: sale.customerName, professional_name: sale.staffName });
      if (error) throw error;

      if (sale.customerId && !isRefund) {
        const customer = customers.find(c => c.id === sale.customerId);
        if (customer) {
          const newPoints = Math.max(0, (customer.loyaltyPoints || 0) - (sale.redeemedPoints || 0) + (sale.earnedPoints || 0));
          setCustomers(prev => prev.map(c => c.id === sale.customerId ? { ...c, loyaltyPoints: newPoints } : c));
          await supabase.from('customers').update({ loyalty_points: newPoints }).eq('id', sale.customerId);
        }
      }

      // Update Stock Levels
      const newProducts = [...products];
      sale.items.forEach(item => {
        if (item.type === 'product') {
          const idx = newProducts.findIndex(p => p.id === item.id);
          if (idx > -1) {
            const stockChange = isRefund ? item.quantity : -item.quantity;
            newProducts[idx].stock = Math.max(0, newProducts[idx].stock + stockChange);
            addStockLog({ id: 'sl' + Math.random().toString(36).substr(2, 9), productId: item.id, change: stockChange, reason: isRefund ? 'return' : 'sale', timestamp: new Date().toISOString(), userId: currentUser?.id || 'system', notes: isRefund ? `Refund Sale #${sale.id}` : `Sale #${sale.id}` });
          }
        }
      });
      updateProducts(newProducts);
      return true;
    } catch (e) { showToast("Failed to sync sale", "error"); return false; }
  };

  const deleteSales = async (ids: string[]) => {
    setSales(prev => prev.filter(s => !ids.includes(s.id)));
    try { await supabase.from('sales').delete().in('id', ids); } catch (e) { showToast("Failed to delete sales", "error"); }
  };

  const addExpense = async (expense: Expense) => {
    if (!tenantId) return;
    setExpenses(prev => [...prev, expense]);
    try { await supabase.from('expenses').insert({ id: expense.id, tenant_id: tenantId, date: expense.date, category: expense.category, amount: expense.amount, description: expense.description || '', receipt_image: expense.receiptImage || null }); } catch (e) { showToast("Failed to save expense", "error"); }
  };

  const deleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    try { await supabase.from('expenses').delete().eq('id', id); } catch (e) { showToast("Failed to delete expense", "error"); }
  };

  const addAdvance = async (advance: AdvancePayment) => {
    if (!tenantId) return;
    setAdvancePayments(prev => [...prev, advance]);
    try { await supabase.from('advance_payments').insert({ id: advance.id, tenant_id: tenantId, staff_id: advance.staffId, amount: advance.amount, date: advance.date, description: advance.description || '' }); } catch (e) { showToast("Failed to save advance", "error"); }
  };

  const deleteAdvance = async (id: string) => {
    setAdvancePayments(prev => prev.filter(a => a.id !== id));
    try { await supabase.from('advance_payments').delete().eq('id', id); } catch (e) { showToast("Failed to delete advance", "error"); }
  };

  const publicCreateAppointment = async (appointment: Omit<Appointment, 'id'>, targetTenantId: string) => {
    try {
      const { data, error } = await supabase.from('appointments').insert({
        tenant_id: targetTenantId,
        staff_id: appointment.staffId,
        customer_id: appointment.customerId || null,
        service_ids: JSON.stringify(appointment.serviceIds),
        start_time: appointment.startTime,
        end_time: appointment.endTime,
        status: 'unconfirmed',
        notes: appointment.notes || null,
        customer_name: appointment.customerName || null,
        customer_phone: appointment.customerPhone || null,
        customer_email: appointment.customerEmail || null
      }).select();

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Public booking error:', e);
      return false;
    }
  };

  const testNotification = useCallback(() => {
    notificationService.test();
  }, []);

  useEffect(() => {
    if (currentTenant) fetchData(true);
  }, [currentTenant, fetchData]);

  useEffect(() => {
    if (!currentTenant) return;

    const channel = supabase
      .channel(`tenant_updates_${currentTenant.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments',
          filter: `tenant_id=eq.${currentTenant.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newApp = payload.new;
            notificationService.show('📅 New Booking!', {
              body: `${newApp.customer_name || 'Guest'} booked for ${format(new Date(newApp.start_time), 'MMM d, h:mm a')}`,
              tag: `new-app-${newApp.id}`
            });
            // Update local state without full refresh if possible, or just call fetchData(true)
            fetchData(true);
          } else if (payload.eventType === 'UPDATE') {
            const oldApp = payload.old;
            const newApp = payload.new;
            
            if (oldApp.status !== newApp.status) {
              notificationService.show('🔔 Booking Updated', {
                body: `Booking for ${newApp.customer_name || 'Guest'} is now ${newApp.status.toUpperCase()}`,
                tag: `update-app-${newApp.id}`
              });
            }
            fetchData(true);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime: Subscribed to appointments updates for tenant:', currentTenant.id);
        } else if (status === 'CLOSED') {
          console.log('⚠️ Realtime: Subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime: Subscription error for tenant:', currentTenant.id);
          showToast('Realtime sync error. Please refresh.', 'error');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Realtime: Subscription timed out');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentTenant, fetchData]);

  return (
    <DataContext.Provider value={{
      services, products, staff, expenses, customers, sales, 
      advancePayments, suppliers, stockLogs, appointments, staffAvailability, settings, 
      loading, fetchData, fetchPublicTenantBySlug,
      updateServices, updateProducts, updateStaff, updateCustomers, updateSettings, updateSuppliers, updateAppointments, updateAppointmentStatus, updateStaffAvailability,
      addStockLog, completeSale, deleteSales, addExpense, deleteExpense, addAdvance, deleteAdvance, publicCreateAppointment,
      testNotification
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
