-- ==============================================================================
-- TRIMTIME SAAS — COMPLETE UNIFIED DATABASE SCHEMA & MIGRATION (PRODUCTION READY)
-- ==============================================================================
-- This script contains the COMPLETE database schema for TrimTime POS & Business Management.
-- It can be executed on a brand new Supabase project or re-run on an existing project.
--
-- PREREQUISITES in Supabase Dashboard (Auth section):
--   1. Authentication → Providers → Email: ENABLED
--   2. Authentication → Providers → Email → "Confirm email": UNCHECKED (for instant signups)
-- ==============================================================================

-- ==========================================
-- 0. EXTENSIONS & CLEANUP
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop legacy functions & views if existing
DROP FUNCTION IF EXISTS authenticate_staff_secure(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS get_public_shop_data(text) CASCADE;
DROP FUNCTION IF EXISTS create_public_booking(text, text, uuid, jsonb, timestamptz, timestamptz, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS complete_sale_transaction(jsonb, jsonb, text, numeric, numeric) CASCADE;
DROP FUNCTION IF EXISTS get_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- Drop tables in proper dependency order for clean re-runs
DROP TABLE IF EXISTS stock_transfers       CASCADE;
DROP TABLE IF EXISTS purchase_orders      CASCADE;
DROP TABLE IF EXISTS gift_cards           CASCADE;
DROP TABLE IF EXISTS loyalty_tiers        CASCADE;
DROP TABLE IF EXISTS resources            CASCADE;
DROP TABLE IF EXISTS webhook_events       CASCADE;
DROP TABLE IF EXISTS loyalty_transactions CASCADE;
DROP TABLE IF EXISTS staff_availability   CASCADE;
DROP TABLE IF EXISTS appointments         CASCADE;
DROP TABLE IF EXISTS stock_logs           CASCADE;
DROP TABLE IF EXISTS advance_payments     CASCADE;
DROP TABLE IF EXISTS sales                CASCADE;
DROP TABLE IF EXISTS expenses             CASCADE;
DROP TABLE IF EXISTS product_inventory    CASCADE;
DROP TABLE IF EXISTS products             CASCADE;
DROP TABLE IF EXISTS services             CASCADE;
DROP TABLE IF EXISTS suppliers            CASCADE;
DROP TABLE IF EXISTS staff                CASCADE;
DROP TABLE IF EXISTS customers            CASCADE;
DROP TABLE IF EXISTS settings             CASCADE;
DROP TABLE IF EXISTS subscriptions        CASCADE;
DROP TABLE IF EXISTS branches             CASCADE;
DROP TABLE IF EXISTS tenants              CASCADE;


-- ==========================================
-- 1. SHARED UTILITY TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ==========================================
-- 2. SAAS CORE TENANCY & SUBSCRIPTIONS
-- ==========================================

-- 2a. Tenants (Each registered business)
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
CREATE INDEX idx_tenants_slug     ON tenants(lower(slug)) WHERE slug IS NOT NULL;
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2b. Branches (Multiple locations per tenant)
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

-- 2c. Subscriptions (Plan, trial and billing state per tenant)
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
-- 3. CORE POS & BUSINESS DATA TABLES
-- ==========================================

-- 3a. Staff Members (Employees & Admins)
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
  permissions         jsonb       NOT NULL DEFAULT '{"canViewFinance":true,"canApplyDiscounts":true,"canExportData":true,"canEditInventory":true,"canManageStaff":true}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, tenant_id)
);
CREATE INDEX idx_staff_tenant   ON staff(tenant_id);
CREATE INDEX idx_staff_username ON staff(tenant_id, lower(username));

-- 3b. Services Catalog
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

-- 3c. Products Catalog
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

-- 3d. Product Inventory (Branch-level stock quantities)
CREATE TABLE product_inventory (
  product_id  text        NOT NULL,
  branch_id   uuid        NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stock       numeric     NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, branch_id)
);
CREATE INDEX idx_product_inventory_tenant ON product_inventory(tenant_id);
CREATE INDEX idx_product_inventory_branch ON product_inventory(branch_id);

-- 3e. Customers & Loyalty Ledger
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

-- 3f. Sales & Transactions
CREATE TABLE sales (
  id                text        NOT NULL,
  tenant_id         uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  timestamp         timestamptz NOT NULL DEFAULT now(),
  items             jsonb       NOT NULL DEFAULT '[]'::jsonb,
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

-- 3g. Expenses
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

-- 3h. Settings (One row per tenant)
CREATE TABLE settings (
  tenant_id                 uuid        PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  data                      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  deposit_mode              text        DEFAULT 'none',
  deposit_payment_provider  text        DEFAULT 'stripe',
  deposit_api_key           text,
  deposit_amount            numeric     DEFAULT 0.00,
  custom_whatsapp_api_key   text
);

-- 3i. Advance Payments to Staff
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

-- 3j. Suppliers
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

-- 3k. Stock Audit Logs
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

-- 3l. Appointments & Online Bookings
CREATE TABLE appointments (
  id                uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id       text,
  staff_id          text        NOT NULL,
  service_ids       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  start_time        timestamptz NOT NULL,
  end_time          timestamptz NOT NULL,
  status            text        NOT NULL DEFAULT 'unconfirmed'
                      CHECK (status IN ('unconfirmed','pending','confirmed','completed','cancelled','no_show')),
  notes             text,
  customer_name     text,
  customer_phone    text,
  customer_email    text,
  branch_id         uuid        REFERENCES branches(id) ON DELETE SET NULL,
  resource_id       uuid,
  reminder_sent_24h boolean     NOT NULL DEFAULT false,
  reminder_sent_2h  boolean     NOT NULL DEFAULT false,
  deposit_paid      boolean     NOT NULL DEFAULT false,
  deposit_amount    numeric     NOT NULL DEFAULT 0.00,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_tenant     ON appointments(tenant_id);
CREATE INDEX idx_appointments_start_time ON appointments(tenant_id, start_time);
CREATE INDEX idx_appointments_staff      ON appointments(tenant_id, staff_id);
CREATE INDEX idx_appointments_status     ON appointments(tenant_id, status);
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3m. Staff Working Hours Availability
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

-- 3n. Loyalty Ledger Transactions
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

-- 3o. Webhook Events Ledger (Creem Webhook Idempotency)
CREATE TABLE webhook_events (
  id          text        PRIMARY KEY,
  provider    text        NOT NULL DEFAULT 'creem',
  event_type  text        NOT NULL,
  tenant_id   uuid        REFERENCES tenants(id) ON DELETE SET NULL,
  payload     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3p. Salon / Barbershop Station Resources
CREATE TABLE resources (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id   uuid        REFERENCES branches(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  type        text        NOT NULL DEFAULT 'station',
  is_active   boolean     NOT NULL DEFAULT true
);
CREATE INDEX idx_resources_tenant ON resources(tenant_id);

-- 3q. Purchase Orders
CREATE TABLE purchase_orders (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id   text,
  supplier_name text        NOT NULL,
  status        text        NOT NULL DEFAULT 'draft',
  items         jsonb       NOT NULL DEFAULT '[]'::jsonb,
  total_cost    numeric     NOT NULL DEFAULT 0.00,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_purchase_orders_tenant ON purchase_orders(tenant_id);

-- 3r. Stock Transfers between Branches
CREATE TABLE stock_transfers (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  from_branch_id uuid        REFERENCES branches(id) ON DELETE CASCADE,
  to_branch_id   uuid        REFERENCES branches(id) ON DELETE CASCADE,
  product_id     text        NOT NULL,
  product_name   text        NOT NULL,
  quantity       integer     NOT NULL DEFAULT 1,
  status         text        NOT NULL DEFAULT 'requested',
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_transfers_tenant ON stock_transfers(tenant_id);

-- 3s. Gift Cards
CREATE TABLE gift_cards (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code            text        NOT NULL UNIQUE,
  initial_balance numeric     NOT NULL DEFAULT 0.00,
  current_balance numeric     NOT NULL DEFAULT 0.00,
  is_redeemed     boolean     NOT NULL DEFAULT false,
  expiry_date     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gift_cards_tenant ON gift_cards(tenant_id);

-- 3t. Loyalty Tiers
CREATE TABLE loyalty_tiers (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  min_annual_spend numeric     NOT NULL DEFAULT 0.00,
  multiplier       numeric     NOT NULL DEFAULT 1.00
);
CREATE INDEX idx_loyalty_tiers_tenant ON loyalty_tiers(tenant_id);


-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) HELPER & POLICIES
-- ==========================================

CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM tenants WHERE owner_id = auth.uid() LIMIT 1;
$$;

-- Enable RLS across all tables
ALTER TABLE tenants              ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff                ENABLE ROW LEVEL SECURITY;
ALTER TABLE services             ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales                ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability   ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources            ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards           ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers        ENABLE ROW LEVEL SECURITY;

-- Tenants Policies
CREATE POLICY "tenants_select" ON tenants FOR SELECT USING (owner_id = auth.uid() OR id = get_user_tenant_id() OR is_active = true);
CREATE POLICY "tenants_insert" ON tenants FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "tenants_update" ON tenants FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "tenants_delete" ON tenants FOR DELETE USING (owner_id = auth.uid());

-- Tenant-Owned Tables Policies (Owner full access only)
CREATE POLICY "branches_select"           ON branches           FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "branches_write"            ON branches           FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "subscriptions_select"      ON subscriptions      FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "subscriptions_write"       ON subscriptions      FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "staff_select"              ON staff              FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "staff_write"               ON staff              FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "services_select"           ON services           FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "services_write"            ON services           FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "products_select"           ON products           FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "products_write"            ON products           FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "product_inventory_select"  ON product_inventory  FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "product_inventory_write"   ON product_inventory   FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "customers_select"          ON customers          FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "customers_write"           ON customers          FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "sales_select"              ON sales              FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "sales_write"               ON sales              FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "expenses_select"           ON expenses           FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "expenses_write"            ON expenses           FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "settings_select"           ON settings           FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "settings_write"            ON settings           FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "advance_payments_select"   ON advance_payments   FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "advance_payments_write"    ON advance_payments    FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "suppliers_select"          ON suppliers          FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "suppliers_write"           ON suppliers           FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "stock_logs_select"         ON stock_logs         FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "stock_logs_write"          ON stock_logs          FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "appointments_select"       ON appointments       FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "appointments_write"        ON appointments        FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "staff_availability_select" ON staff_availability FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "staff_availability_write"  ON staff_availability  FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "loyalty_select"            ON loyalty_transactions FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "loyalty_write"             ON loyalty_transactions  FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "resources_select"          ON resources          FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "resources_write"           ON resources           FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "purchase_orders_select"    ON purchase_orders    FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "purchase_orders_write"     ON purchase_orders     FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "stock_transfers_select"    ON stock_transfers    FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "stock_transfers_write"     ON stock_transfers     FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "gift_cards_select"         ON gift_cards         FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "gift_cards_write"          ON gift_cards          FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "loyalty_tiers_select"      ON loyalty_tiers      FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "loyalty_tiers_write"       ON loyalty_tiers       FOR ALL    USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());


-- ==========================================
-- 5. SECURE SERVER-SIDE RPC FUNCTIONS (SECURITY DEFINER)
-- ==========================================

-- 5a. Authenticate Staff Member (Server-side bcrypt validation via pgcrypto)
CREATE OR REPLACE FUNCTION authenticate_staff_secure(
  p_slug text,
  p_username text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  v_staff record;
BEGIN
  -- 1. Resolve active tenant by slug
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = lower(trim(p_slug)) AND is_active = true;
  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shop not found');
  END IF;

  -- 2. Find matching staff record
  SELECT id, name, role, commission, commission_services, commission_products, 
         base_salary, username, password, email, branch_id, tenant_id, permissions
  INTO v_staff
  FROM staff
  WHERE tenant_id = v_tenant_id AND lower(username) = lower(trim(p_username))
  LIMIT 1;

  IF v_staff IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid username or password');
  END IF;

  -- 3. Verify bcrypt password hash on server
  IF crypt(p_password, v_staff.password) != v_staff.password THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid username or password');
  END IF;

  -- 4. Return sanitized staff profile WITHOUT password hash
  RETURN jsonb_build_object(
    'success', true,
    'staff', jsonb_build_object(
      'id', v_staff.id,
      'tenant_id', v_staff.tenant_id,
      'name', v_staff.name,
      'role', v_staff.role,
      'username', v_staff.username,
      'email', v_staff.email,
      'branch_id', v_staff.branch_id,
      'commission', v_staff.commission,
      'commission_services', v_staff.commission_services,
      'commission_products', v_staff.commission_products,
      'base_salary', v_staff.base_salary,
      'permissions', v_staff.permissions
    )
  );
END;
$$;


-- 5b. Get Sanitized Public Shop Data (For public booking & staff portal)
CREATE OR REPLACE FUNCTION get_public_shop_data(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant record;
  v_services jsonb;
  v_branches jsonb;
  v_staff jsonb;
  v_availability jsonb;
  v_settings jsonb;
BEGIN
  -- 1. Fetch active tenant
  SELECT id, business_name, business_type, slug, logo_url
  INTO v_tenant
  FROM tenants
  WHERE slug = lower(trim(p_slug)) AND is_active = true;

  IF v_tenant IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shop not found');
  END IF;

  -- 2. Fetch public services (exclude internal cost data)
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'name', name, 'nameUr', name_ur, 'price', price, 'duration', duration, 'category', category
  )), '[]'::jsonb) INTO v_services FROM services WHERE tenant_id = v_tenant.id;

  -- 3. Fetch active branches
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'name', name, 'address', address, 'phone', phone, 'isActive', is_active
  )), '[]'::jsonb) INTO v_branches FROM branches WHERE tenant_id = v_tenant.id AND is_active = true;

  -- 4. Fetch public staff list (ONLY id, name, branch_id — NO salaries, commissions, passwords, emails)
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'name', name, 'branchId', branch_id
  )), '[]'::jsonb) INTO v_staff FROM staff WHERE tenant_id = v_tenant.id;

  -- 5. Fetch staff availability
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'staffId', staff_id, 'dayOfWeek', day_of_week, 'startTime', start_time, 'endTime', end_time
  )), '[]'::jsonb) INTO v_availability FROM staff_availability WHERE tenant_id = v_tenant.id;

  -- 6. Fetch booking-relevant settings (strip secret API keys)
  SELECT jsonb_build_object(
    'shopName', coalesce(data->>'shopName', v_tenant.business_name),
    'currency', coalesce(data->>'currency', '$'),
    'bookingEnabled', coalesce((data->>'bookingEnabled')::boolean, true),
    'businessHours', data->'businessHours',
    'depositRequired', coalesce((data->>'depositRequired')::boolean, false),
    'depositAmount', coalesce((data->>'depositAmount')::numeric, 0)
  ) INTO v_settings FROM settings WHERE tenant_id = v_tenant.id;

  RETURN jsonb_build_object(
    'success', true,
    'tenant', row_to_json(v_tenant),
    'services', v_services,
    'branches', v_branches,
    'staff', v_staff,
    'availability', v_availability,
    'settings', v_settings
  );
END;
$$;


-- 5c. Create Public Booking (Server-validated tenant, staff, branch & interval)
CREATE OR REPLACE FUNCTION create_public_booking(
  p_slug text,
  p_staff_id text,
  p_branch_id uuid,
  p_service_ids jsonb,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  v_appointment_id uuid;
BEGIN
  -- 1. Validate tenant (by slug or direct tenant ID string fallback)
  SELECT id INTO v_tenant_id FROM tenants 
  WHERE (slug = lower(trim(p_slug)) OR id::text = p_slug) AND is_active = true
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid shop');
  END IF;

  -- 2. Validate staff belongs to tenant
  IF p_staff_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM staff WHERE tenant_id = v_tenant_id AND id = p_staff_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid staff member');
  END IF;

  -- 3. Validate branch belongs to tenant
  IF p_branch_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM branches WHERE tenant_id = v_tenant_id AND id = p_branch_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid branch');
  END IF;

  -- 4. Validate time range
  IF p_start_time >= p_end_time OR p_start_time < now() - interval '10 minutes' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid appointment time');
  END IF;

  -- 5. Insert unconfirmed appointment
  INSERT INTO appointments (
    id, tenant_id, staff_id, branch_id, service_ids, start_time, end_time,
    status, customer_name, customer_phone, customer_email, notes
  ) VALUES (
    gen_random_uuid(), v_tenant_id, p_staff_id, p_branch_id, p_service_ids, p_start_time, p_end_time,
    'unconfirmed', p_customer_name, p_customer_phone, p_customer_email, p_notes
  ) RETURNING id INTO v_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_appointment_id
  );
END;
$$;


-- 5d. Complete Sale Transaction (Atomic: Insert sale + Deduct branch stock + Update loyalty ledger)
CREATE OR REPLACE FUNCTION complete_sale_transaction(
  p_sale jsonb,
  p_items jsonb,
  p_customer_id text,
  p_earned_points numeric,
  p_redeemed_points numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  v_item record;
BEGIN
  v_tenant_id := (p_sale->>'tenant_id')::uuid;

  -- 1. Insert Sale record
  INSERT INTO sales (
    id, tenant_id, timestamp, items, staff_id, customer_id, customer_name,
    professional_name, branch_id, subtotal, discount, discount_code, tax,
    tax_type, total, tip, payment_method, split_details, cost_of_goods,
    earned_points, redeemed_points
  ) VALUES (
    p_sale->>'id', v_tenant_id, (p_sale->>'timestamp')::timestamptz,
    p_items, p_sale->>'staff_id', p_customer_id, p_sale->>'customer_name',
    p_sale->>'professional_name', (p_sale->>'branch_id')::uuid,
    (p_sale->>'subtotal')::numeric, (p_sale->>'discount')::numeric, p_sale->>'discount_code',
    (p_sale->>'tax')::numeric, p_sale->>'tax_type', (p_sale->>'total')::numeric,
    (p_sale->>'tip')::numeric, p_sale->>'payment_method', p_sale->'split_details',
    (p_sale->>'cost_of_goods')::numeric, p_earned_points, p_redeemed_points
  );

  -- 2. Deduct product inventory with row locks
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(id text, type text, quantity numeric)
  LOOP
    IF v_item.type = 'product' AND p_sale->>'branch_id' IS NOT NULL THEN
      UPDATE product_inventory
      SET stock = GREATEST(0, stock - v_item.quantity)
      WHERE product_id = v_item.id AND branch_id = (p_sale->>'branch_id')::uuid AND tenant_id = v_tenant_id;
    END IF;
  END LOOP;

  -- 3. Update customer loyalty points & record ledger entry
  IF p_customer_id IS NOT NULL THEN
    IF p_redeemed_points > 0 THEN
      UPDATE customers SET loyalty_points = GREATEST(0, loyalty_points - p_redeemed_points)
      WHERE id = p_customer_id AND tenant_id = v_tenant_id;

      INSERT INTO loyalty_transactions (tenant_id, customer_id, points, type, sale_id, notes)
      VALUES (v_tenant_id, p_customer_id, -p_redeemed_points, 'redeem', p_sale->>'id', 'Redeemed on sale');
    END IF;

    IF p_earned_points > 0 THEN
      UPDATE customers SET loyalty_points = loyalty_points + p_earned_points
      WHERE id = p_customer_id AND tenant_id = v_tenant_id;

      INSERT INTO loyalty_transactions (tenant_id, customer_id, points, type, sale_id, notes)
      VALUES (v_tenant_id, p_customer_id, p_earned_points, 'earn', p_sale->>'id', 'Earned from sale');
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ==========================================
-- 6. GRANT FULL PERMISSIONS TO SUPABASE ROLES
-- ==========================================
-- In Supabase, table-level grants MUST be explicitly granted to authenticated and anon roles
-- so that Row Level Security (RLS) policies are evaluated instead of throwing "permission denied" (42501).

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;


-- ==========================================
-- 7. REALTIME SUBSCRIPTIONS (IDEMPOTENT)
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'sales'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sales;
  END IF;
END $$;


-- ==========================================
-- 8. VERIFICATION SUMMARY QUERY
-- ==========================================
SELECT
  t.table_name,
  COUNT(c.column_name) AS column_count
FROM information_schema.tables t
JOIN information_schema.columns c
  ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
  AND t.table_type   = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;