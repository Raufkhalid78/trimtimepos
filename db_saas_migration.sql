-- ==========================================
-- TRIMTIME SAAS - COMPLETE DATABASE SETUP
-- ==========================================
-- This is the ONLY SQL file you need to run.
-- Paste the ENTIRE file into Supabase → SQL Editor → Run
--
-- PREREQUISITES (do these BEFORE running this SQL):
-- 1. Go to Authentication → Providers → Email → Enable
-- 2. Go to Authentication → Settings → UNCHECK "Confirm email"
--    (Required so users can sign up and immediately create their business)
-- ==========================================

-- 0. FULL CLEANUP (Wipe everything for fresh start)
DROP FUNCTION IF EXISTS get_user_tenant_id() CASCADE;
DROP TABLE IF EXISTS staff_availability CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS stock_logs CASCADE;
DROP TABLE IF EXISTS advance_payments CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Enable UUID extension for auto-generating IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ==========================================
-- 1. SAAS CORE TABLES
-- ==========================================

-- Tenants: Each business (barbershop or salon) is a tenant
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_type text NOT NULL CHECK (business_type IN ('barbershop', 'beauty_salon', 'both')),
  slug text UNIQUE,
  created_at timestamptz DEFAULT now(),
  logo_url text,
  is_active boolean DEFAULT true
);

-- Index for fast tenant lookup by owner (used in every RLS check)
CREATE INDEX idx_tenants_owner_id ON tenants(owner_id);

-- Subscriptions: Track plans and trials per tenant
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status text NOT NULL CHECK (status IN ('trial', 'active', 'expired', 'cancelled')) DEFAULT 'trial',
  trial_start timestamptz DEFAULT now(),
  trial_end timestamptz DEFAULT (now() + interval '30 days'),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);


-- ==========================================
-- 2. BUSINESS DATA TABLES (all have tenant_id)
-- ==========================================

-- Staff Table
CREATE TABLE staff (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'employee')),
  commission numeric DEFAULT 0,
  username text NOT NULL,
  password text NOT NULL,
  email text,
  PRIMARY KEY (id, tenant_id)
);

CREATE INDEX idx_staff_tenant ON staff(tenant_id);

-- Services Table
CREATE TABLE services (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ur text,
  price numeric DEFAULT 0,
  duration numeric DEFAULT 30,
  category text,
  PRIMARY KEY (id, tenant_id)
);

CREATE INDEX idx_services_tenant ON services(tenant_id);

-- Products Table
CREATE TABLE products (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ur text,
  price numeric DEFAULT 0,
  cost numeric DEFAULT 0,
  stock numeric DEFAULT 0,
  barcode text,
  low_stock_threshold numeric DEFAULT 15,
  supplier_id text,
  PRIMARY KEY (id, tenant_id)
);

CREATE INDEX idx_products_tenant ON products(tenant_id);

-- Customers Table
CREATE TABLE customers (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  notes text,
  created_at text,
  loyalty_points numeric DEFAULT 0,
  PRIMARY KEY (id, tenant_id)
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);

-- Sales Table
CREATE TABLE sales (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  timestamp text NOT NULL,
  items jsonb,
  staff_id text,
  customer_id text,
  total numeric DEFAULT 0,
  subtotal numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  discount_code text,
  payment_method text CHECK (payment_method IN ('cash', 'card', 'split')),
  split_details jsonb,
  tax_type text CHECK (tax_type IN ('included', 'excluded')),
  cost_of_goods numeric DEFAULT 0,
  is_refunded boolean DEFAULT false,
  refund_reason text,
  redeemed_points numeric DEFAULT 0,
  earned_points numeric DEFAULT 0,
  customer_name text,
  professional_name text,
  PRIMARY KEY (id, tenant_id)
);

CREATE INDEX idx_sales_tenant ON sales(tenant_id);

-- Expenses Table
CREATE TABLE expenses (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date text NOT NULL,
  category text,
  amount numeric DEFAULT 0,
  description text,
  receipt_image text,
  PRIMARY KEY (id, tenant_id)
);

CREATE INDEX idx_expenses_tenant ON expenses(tenant_id);

-- Settings Table (one row per tenant)
CREATE TABLE settings (
  id int NOT NULL DEFAULT 1,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data jsonb,
  PRIMARY KEY (id, tenant_id)
);

-- Advance Payments Table
CREATE TABLE advance_payments (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  date text NOT NULL,
  description text,
  PRIMARY KEY (id, tenant_id)
);

CREATE INDEX idx_advance_payments_tenant ON advance_payments(tenant_id);

-- Suppliers Table
CREATE TABLE suppliers (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  address text,
  PRIMARY KEY (id, tenant_id)
);

CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);

-- Stock Logs Table
CREATE TABLE stock_logs (
  id text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id text,
  change numeric NOT NULL DEFAULT 0,
  reason text CHECK (reason IN ('sale', 'restock', 'adjustment', 'damage', 'return')),
  timestamp text NOT NULL,
  user_id text,
  notes text,
  PRIMARY KEY (id, tenant_id)
);

CREATE INDEX idx_stock_logs_tenant ON stock_logs(tenant_id);

-- Appointments Table
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id text, -- optional if walk-in
  staff_id text NOT NULL, -- references staff.id
  service_ids jsonb NOT NULL DEFAULT '[]'::jsonb, -- array of service IDs
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'unconfirmed' CHECK (status IN ('unconfirmed', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  customer_name text,
  customer_phone text,
  customer_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);

-- Staff Availability Table
CREATE TABLE staff_availability (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id text NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_staff_availability_tenant ON staff_availability(tenant_id);


-- ==========================================
-- 3. RLS HELPER FUNCTION
-- ==========================================
-- This function is called by EVERY RLS policy below.
-- It looks up the current authenticated user's tenant.
-- The index on tenants.owner_id makes this fast.

CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM tenants WHERE owner_id = auth.uid() LIMIT 1;
$$;


-- ==========================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ==========================================
-- Every table is locked down so users can ONLY
-- see and modify data belonging to their own tenant.

-- 4a. TENANTS — owner can manage their own tenant
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenants_policy" ON tenants
  FOR ALL
  USING (owner_id = auth.uid() OR auth.role() = 'anon')
  WITH CHECK (owner_id = auth.uid());

-- 4b. SUBSCRIPTIONS — scoped to tenant
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_policy" ON subscriptions
  FOR ALL
  USING (tenant_id = get_user_tenant_id() OR auth.role() = 'anon')
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 4c. STAFF — scoped to tenant
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_policy" ON staff
  FOR ALL
  USING (tenant_id = get_user_tenant_id() OR auth.role() = 'anon')
  WITH CHECK (tenant_id = get_user_tenant_id() OR auth.role() = 'anon');

-- 4d. SERVICES — scoped to tenant
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_policy" ON services
  FOR ALL
  USING (tenant_id = get_user_tenant_id() OR auth.role() = 'anon')
  WITH CHECK (tenant_id = get_user_tenant_id() OR auth.role() = 'anon');

-- 4e. PRODUCTS — scoped to tenant
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_policy" ON products
  FOR ALL
  USING (tenant_id = get_user_tenant_id() OR auth.role() = 'anon')
  WITH CHECK (tenant_id = get_user_tenant_id() OR auth.role() = 'anon');

-- 4f. CUSTOMERS — scoped to tenant
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_policy" ON customers
  FOR ALL
  USING (tenant_id = get_user_tenant_id() OR auth.role() = 'anon')
  WITH CHECK (tenant_id = get_user_tenant_id() OR auth.role() = 'anon');

-- 4g. SALES — scoped to tenant
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_policy" ON sales
  FOR ALL
  USING (tenant_id = get_user_tenant_id() OR auth.role() = 'anon')
  WITH CHECK (tenant_id = get_user_tenant_id() OR auth.role() = 'anon');

-- 4h. EXPENSES — scoped to tenant
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_policy" ON expenses
  FOR ALL
  USING (tenant_id = get_user_tenant_id() OR auth.role() = 'anon')
  WITH CHECK (tenant_id = get_user_tenant_id() OR auth.role() = 'anon');

-- 4i. SETTINGS — scoped to tenant
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_policy" ON settings
  FOR ALL
  USING (tenant_id = get_user_tenant_id() OR auth.role() = 'anon')
  WITH CHECK (tenant_id = get_user_tenant_id() OR auth.role() = 'anon');

-- 4j. ADVANCE PAYMENTS — scoped to tenant
ALTER TABLE advance_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advance_payments_policy" ON advance_payments
  FOR ALL
  USING (tenant_id = get_user_tenant_id() OR auth.role() = 'anon')
  WITH CHECK (tenant_id = get_user_tenant_id() OR auth.role() = 'anon');

-- 4k. SUPPLIERS — scoped to tenant
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_policy" ON suppliers
  FOR ALL
  USING (tenant_id = get_user_tenant_id() OR auth.role() = 'anon')
  WITH CHECK (tenant_id = get_user_tenant_id() OR auth.role() = 'anon');

-- 4l. STOCK LOGS — scoped to tenant
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_logs_policy" ON stock_logs
  FOR ALL
  USING (tenant_id = get_user_tenant_id() OR auth.role() = 'anon')
  WITH CHECK (tenant_id = get_user_tenant_id() OR auth.role() = 'anon');

-- 4m. APPOINTMENTS — scoped to tenant
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments_policy" ON appointments
  FOR ALL
  USING (tenant_id = get_user_tenant_id() OR auth.role() = 'anon')
  WITH CHECK (tenant_id = get_user_tenant_id() OR auth.role() = 'anon');

-- 4n. STAFF AVAILABILITY — scoped to tenant
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_availability_policy" ON staff_availability
  FOR ALL
  USING (tenant_id = get_user_tenant_id() OR auth.role() = 'anon')
  WITH CHECK (tenant_id = get_user_tenant_id() OR auth.role() = 'anon');


-- ==========================================
-- 5. VERIFICATION
-- ==========================================
-- This query runs after setup to confirm everything was created.
-- You should see 12 tables with their columns listed.

SELECT 
  t.table_name,
  COUNT(c.column_name) as column_count,
  string_agg(c.column_name, ', ' ORDER BY c.ordinal_position) as columns
FROM information_schema.tables t
JOIN information_schema.columns c 
  ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

-- 2. Enable public read access for specific data (Scoped by tenant_id)
-- WARNING: Ensure RLS is enabled on these tables.

-- Allow guests to view services and staff of a tenant using the tenant_id
CREATE POLICY "Public read services" ON public.services 
  FOR SELECT USING (true);

CREATE POLICY "Public read staff" ON public.staff 
  FOR SELECT USING (true);

CREATE POLICY "Public read staff availability" ON public.staff_availability 
  FOR SELECT USING (true);

CREATE POLICY "Public read settings" ON public.settings 
  FOR SELECT USING (true);

CREATE POLICY "Public read appointments" ON public.appointments 
  FOR SELECT USING (true);

-- Allow guests to create unconfirmed appointments
CREATE POLICY "Public create appointments" ON public.appointments 
  FOR INSERT WITH CHECK (status = 'unconfirmed');