-- ==========================================
-- TRIMTIME SAAS — COMPLETE DATABASE SETUP (v2)
-- Updated: 2026-05-22
-- ==========================================
-- DROP & RECREATE: safe to re-run on a fresh project.
-- For EXISTING databases, use the "MIGRATION ONLY" section at the bottom.
--
-- PREREQUISITES (do these BEFORE running):
--   1. Authentication → Providers → Email → Enable
--   2. Authentication → Settings → UNCHECK "Confirm email"
-- ==========================================


-- ==========================================
-- 0. CLEANUP (wipe everything — fresh start)
-- ==========================================
DROP FUNCTION IF EXISTS get_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
DROP TABLE IF EXISTS loyalty_transactions  CASCADE;
DROP TABLE IF EXISTS staff_availability    CASCADE;
DROP TABLE IF EXISTS appointments          CASCADE;
DROP TABLE IF EXISTS stock_logs            CASCADE;
DROP TABLE IF EXISTS advance_payments      CASCADE;
DROP TABLE IF EXISTS sales                 CASCADE;
DROP TABLE IF EXISTS expenses              CASCADE;
DROP TABLE IF EXISTS products              CASCADE;
DROP TABLE IF EXISTS services              CASCADE;
DROP TABLE IF EXISTS suppliers             CASCADE;
DROP TABLE IF EXISTS staff                 CASCADE;
DROP TABLE IF EXISTS customers             CASCADE;
DROP TABLE IF EXISTS settings              CASCADE;
DROP TABLE IF EXISTS subscriptions         CASCADE;
DROP TABLE IF EXISTS product_inventory     CASCADE;
DROP TABLE IF EXISTS branches              CASCADE;
DROP TABLE IF EXISTS tenants               CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ==========================================
-- 1. SHARED UTILITY FUNCTION
-- ==========================================
-- Auto-updates updated_at on any row that has that column.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ==========================================
-- 2. SAAS CORE TABLES
-- ==========================================

-- Tenants: each business is a tenant
CREATE TABLE tenants (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name   text        NOT NULL,
  business_type   text        NOT NULL CHECK (business_type IN ('barbershop', 'beauty_salon', 'both')),
  slug            text        UNIQUE,
  logo_url        text,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tenants_owner_id ON tenants(owner_id);
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Branches: multiple locations per tenant
CREATE TABLE branches (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  address         text,
  phone           text,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_branches_tenant ON branches(tenant_id);
CREATE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Subscriptions: plan and billing state per tenant
CREATE TABLE subscriptions (
  id                    uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan                  text        NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status                text        NOT NULL DEFAULT 'trial'
                          CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
  trial_start           timestamptz NOT NULL DEFAULT now(),
  trial_end             timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  current_period_start  timestamptz NOT NULL DEFAULT now(),
  current_period_end    timestamptz,
  price                 numeric     NOT NULL DEFAULT 0,
  add_on_packs          integer     NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);


-- ==========================================
-- 3. BUSINESS DATA TABLES
-- ==========================================

-- Staff
CREATE TABLE staff (
  id                  text        NOT NULL,
  tenant_id           uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                text        NOT NULL,
  role                text        NOT NULL CHECK (role IN ('admin', 'employee')),
  commission          numeric     NOT NULL DEFAULT 0,
  commission_services numeric     NOT NULL DEFAULT 0,
  commission_products numeric     NOT NULL DEFAULT 0,
  base_salary         numeric     NOT NULL DEFAULT 0,
  username            text        NOT NULL,
  password            text        NOT NULL,
  email               text,
  branch_id           uuid        REFERENCES branches(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, tenant_id)
);
CREATE INDEX idx_staff_tenant    ON staff(tenant_id);
CREATE INDEX idx_staff_username  ON staff(tenant_id, username);


-- Services
CREATE TABLE services (
  id          text        NOT NULL,
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  name_ur     text,
  price       numeric     NOT NULL DEFAULT 0,
  duration    numeric     NOT NULL DEFAULT 30,
  category    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, tenant_id)
);
CREATE INDEX idx_services_tenant ON services(tenant_id);


-- Products
CREATE TABLE products (
  id                   text        NOT NULL,
  tenant_id            uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                 text        NOT NULL,
  name_ur              text,
  price                numeric     NOT NULL DEFAULT 0,
  cost                 numeric     NOT NULL DEFAULT 0,
  stock                numeric     NOT NULL DEFAULT 0,
  barcode              text,
  low_stock_threshold  numeric     NOT NULL DEFAULT 15,
  supplier_id          text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, tenant_id)
);
CREATE INDEX idx_products_tenant  ON products(tenant_id);
CREATE INDEX idx_products_barcode ON products(tenant_id, barcode) WHERE barcode IS NOT NULL;


-- Product Inventory: branch-specific stock levels
CREATE TABLE product_inventory (
  product_id  text        NOT NULL,
  branch_id   uuid        NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stock       numeric     NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, branch_id)
);
CREATE INDEX idx_product_inventory_tenant ON product_inventory(tenant_id);
CREATE INDEX idx_product_inventory_branch ON product_inventory(branch_id);


-- Customers
-- FIX: created_at is now timestamptz (was text).
-- NEW: preferences column and no_show_count column.
CREATE TABLE customers (
  id             text        NOT NULL,
  tenant_id      uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  phone          text,
  email          text,
  notes          text,
  preferences    text,
  loyalty_points numeric     NOT NULL DEFAULT 0,
  no_show_count  integer     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, tenant_id)
);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_phone  ON customers(tenant_id, phone) WHERE phone IS NOT NULL;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Sales
-- FIX: timestamp is now timestamptz (was text).
CREATE TABLE sales (
  id                text        NOT NULL,
  tenant_id         uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  timestamp         timestamptz NOT NULL DEFAULT now(),
  items             jsonb       NOT NULL DEFAULT '[]',
  staff_id          text,
  customer_id       text,
  total             numeric     NOT NULL DEFAULT 0,
  subtotal          numeric     NOT NULL DEFAULT 0,
  tax               numeric     NOT NULL DEFAULT 0,
  discount          numeric     NOT NULL DEFAULT 0,
  discount_code     text,
  payment_method    text        CHECK (payment_method IN ('cash', 'card', 'split')),
  split_details     jsonb,
  tax_type          text        CHECK (tax_type IN ('included', 'excluded')),
  cost_of_goods     numeric     NOT NULL DEFAULT 0,
  is_refunded       boolean     NOT NULL DEFAULT false,
  refund_reason     text,
  redeemed_points   numeric     NOT NULL DEFAULT 0,
  earned_points     numeric     NOT NULL DEFAULT 0,
  tip               numeric     NOT NULL DEFAULT 0,
  customer_name     text,
  professional_name text,
  branch_id         uuid        REFERENCES branches(id) ON DELETE SET NULL,
  PRIMARY KEY (id, tenant_id)
);
CREATE INDEX idx_sales_tenant    ON sales(tenant_id);
CREATE INDEX idx_sales_timestamp ON sales(tenant_id, timestamp DESC);
CREATE INDEX idx_sales_staff     ON sales(tenant_id, staff_id);
CREATE INDEX idx_sales_customer  ON sales(tenant_id, customer_id);


-- Expenses
-- FIX: date is now date type (was text).
CREATE TABLE expenses (
  id            text        NOT NULL,
  tenant_id     uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date          date        NOT NULL,
  category      text,
  amount        numeric     NOT NULL DEFAULT 0,
  description   text,
  receipt_image text,
  branch_id     uuid        REFERENCES branches(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, tenant_id)
);
CREATE INDEX idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX idx_expenses_date   ON expenses(tenant_id, date DESC);


-- Settings (one row per tenant, JSONB blob)
CREATE TABLE settings (
  tenant_id   uuid    PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  data        jsonb   NOT NULL DEFAULT '{}'
);


-- Advance Payments
-- FIX: date is now date type (was text).
CREATE TABLE advance_payments (
  id          text        NOT NULL,
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id    text        NOT NULL,
  amount      numeric     NOT NULL DEFAULT 0,
  date        date        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, tenant_id)
);
CREATE INDEX idx_advance_payments_tenant ON advance_payments(tenant_id);
CREATE INDEX idx_advance_payments_staff  ON advance_payments(tenant_id, staff_id);


-- Suppliers
CREATE TABLE suppliers (
  id           text        NOT NULL,
  tenant_id    uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  contact_name text,
  phone        text,
  email        text,
  address      text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, tenant_id)
);
CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);


-- Stock Logs
-- FIX: timestamp is now timestamptz (was text).
CREATE TABLE stock_logs (
  id          text        NOT NULL,
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id  text,
  change      numeric     NOT NULL DEFAULT 0,
  reason      text        CHECK (reason IN ('sale', 'restock', 'adjustment', 'damage', 'return')),
  timestamp   timestamptz NOT NULL DEFAULT now(),
  user_id     text,
  notes       text,
  PRIMARY KEY (id, tenant_id)
);
CREATE INDEX idx_stock_logs_tenant    ON stock_logs(tenant_id);
CREATE INDEX idx_stock_logs_product   ON stock_logs(tenant_id, product_id);
CREATE INDEX idx_stock_logs_timestamp ON stock_logs(tenant_id, timestamp DESC);


-- Appointments
-- 'no_show' status added to support missed-appointment workflow.
CREATE TABLE appointments (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id     text,
  staff_id        text        NOT NULL,
  service_ids     jsonb       NOT NULL DEFAULT '[]',
  start_time      timestamptz NOT NULL,
  end_time        timestamptz NOT NULL,
  status          text        NOT NULL DEFAULT 'unconfirmed'
                    CHECK (status IN ('unconfirmed','pending','confirmed','completed','cancelled','no_show')),
  notes           text,
  customer_name   text,
  customer_phone  text,
  customer_email  text,
  branch_id       uuid        REFERENCES branches(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_tenant     ON appointments(tenant_id);
CREATE INDEX idx_appointments_start_time ON appointments(tenant_id, start_time);
CREATE INDEX idx_appointments_staff      ON appointments(tenant_id, staff_id);
CREATE INDEX idx_appointments_status     ON appointments(tenant_id, status);
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Staff Availability
-- FIX: UNIQUE constraint prevents duplicate entries per staff per day.
CREATE TABLE staff_availability (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id    text        NOT NULL,
  day_of_week int         NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  time        NOT NULL,
  end_time    time        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, staff_id, day_of_week)
);
CREATE INDEX idx_staff_availability_tenant ON staff_availability(tenant_id);
CREATE INDEX idx_staff_availability_staff  ON staff_availability(tenant_id, staff_id);


-- Loyalty Transactions (NEW — audit ledger)
-- Full history of every point change. Balance stored on customers.loyalty_points for fast reads.
CREATE TABLE loyalty_transactions (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id   text        NOT NULL,
  points        numeric     NOT NULL,
  type          text        NOT NULL CHECK (type IN ('earn', 'redeem', 'adjustment')),
  sale_id       text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_loyalty_tenant   ON loyalty_transactions(tenant_id);
CREATE INDEX idx_loyalty_customer ON loyalty_transactions(tenant_id, customer_id);


-- ==========================================
-- 4. RLS HELPER FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM tenants WHERE owner_id = auth.uid() LIMIT 1;
$$;


-- ==========================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ==========================================

-- 5a. TENANTS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenants_select" ON tenants FOR SELECT USING (true);
CREATE POLICY "tenants_insert" ON tenants FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "tenants_update" ON tenants FOR UPDATE
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "tenants_delete" ON tenants FOR DELETE USING (owner_id = auth.uid());


-- Branches RLS Policies
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branches_select" ON branches FOR SELECT USING (true);
CREATE POLICY "branches_write" ON branches FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());


-- Product Inventory RLS Policies
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_inventory_select" ON product_inventory FOR SELECT
  USING (tenant_id = get_user_tenant_id() OR EXISTS (
    SELECT 1 FROM tenants WHERE tenants.id = product_inventory.tenant_id AND tenants.is_active = true
  ));
CREATE POLICY "product_inventory_write" ON product_inventory FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 5b. SUBSCRIPTIONS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "subscriptions_write" ON subscriptions FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 5c. STAFF (anon can read for staff login + public booking)
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_select" ON staff FOR SELECT USING (true);
CREATE POLICY "staff_write" ON staff FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 5d. SERVICES (anon can read for public booking)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_select" ON services FOR SELECT USING (true);
CREATE POLICY "services_write" ON services FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 5e. PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select" ON products FOR SELECT
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "products_write" ON products FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 5f. CUSTOMERS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_select" ON customers FOR SELECT
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "customers_write" ON customers FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 5g. SALES
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_select" ON sales FOR SELECT
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "sales_write" ON sales FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 5h. EXPENSES
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_select" ON expenses FOR SELECT
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "expenses_write" ON expenses FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 5i. SETTINGS (anon can read for public booking)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_write" ON settings FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 5j. ADVANCE PAYMENTS
ALTER TABLE advance_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advance_payments_select" ON advance_payments FOR SELECT
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "advance_payments_write" ON advance_payments FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 5k. SUPPLIERS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "suppliers_write" ON suppliers FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 5l. STOCK LOGS
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_logs_select" ON stock_logs FOR SELECT
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "stock_logs_write" ON stock_logs FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 5m. APPOINTMENTS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments_select" ON appointments FOR SELECT USING (true);
CREATE POLICY "appointments_auth_write" ON appointments FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());
-- Public (anon) can only INSERT new unconfirmed bookings
CREATE POLICY "appointments_public_insert" ON appointments FOR INSERT
  WITH CHECK (status = 'unconfirmed');

-- 5n. STAFF AVAILABILITY (anon can read for public booking)
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_availability_select" ON staff_availability FOR SELECT USING (true);
CREATE POLICY "staff_availability_write" ON staff_availability FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 5o. LOYALTY TRANSACTIONS
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_select" ON loyalty_transactions FOR SELECT
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "loyalty_write" ON loyalty_transactions FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());


-- ==========================================
-- 6. REALTIME PUBLICATION
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;


-- ==========================================
-- 7. VERIFICATION QUERY
-- ==========================================
SELECT
  t.table_name,
  COUNT(c.column_name)                                         AS column_count,
  string_agg(c.column_name, ', ' ORDER BY c.ordinal_position) AS columns
FROM information_schema.tables t
JOIN information_schema.columns c
  ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
  AND t.table_type   = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;