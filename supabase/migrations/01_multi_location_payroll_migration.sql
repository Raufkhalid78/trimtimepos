-- ==========================================
-- TRIMTIME SAAS — MULTI-LOCATION & ADVANCED PAYROLL MIGRATION
-- ==========================================

-- 1. Create Branches Table
CREATE TABLE IF NOT EXISTS branches (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  address     text,
  phone       text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_branches_tenant ON branches(tenant_id);

-- Enable RLS for Branches
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_select" ON branches FOR SELECT USING (true);
CREATE POLICY "branches_all" ON branches FOR ALL 
  USING (tenant_id = get_user_tenant_id()) 
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 2. Create Product Inventory Table (Branch-specific stock levels)
CREATE TABLE IF NOT EXISTS product_inventory (
  product_id  text        NOT NULL,
  branch_id   uuid        NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stock       numeric     NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_product_inventory_tenant ON product_inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_branch ON product_inventory(branch_id);

-- Enable RLS for Product Inventory
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_inventory_select" ON product_inventory FOR SELECT 
  USING (tenant_id = get_user_tenant_id() OR EXISTS (
    SELECT 1 FROM tenants WHERE tenants.id = product_inventory.tenant_id AND tenants.is_active = true
  ));
CREATE POLICY "product_inventory_all" ON product_inventory FOR ALL 
  USING (tenant_id = get_user_tenant_id()) 
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 3. Add Columns to Core Tables (Conditional Additions)
DO $$
BEGIN
  -- Add branch_id to staff
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'branch_id') THEN
    ALTER TABLE staff ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
  END IF;

  -- Add commission_services to staff
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'commission_services') THEN
    ALTER TABLE staff ADD COLUMN commission_services numeric NOT NULL DEFAULT 0;
  END IF;

  -- Add commission_products to staff
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'commission_products') THEN
    ALTER TABLE staff ADD COLUMN commission_products numeric NOT NULL DEFAULT 0;
  END IF;

  -- Add branch_id to sales
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'branch_id') THEN
    ALTER TABLE sales ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
  END IF;

  -- Add branch_id to appointments
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'branch_id') THEN
    ALTER TABLE appointments ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
  END IF;

  -- Add branch_id to expenses
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'branch_id') THEN
    ALTER TABLE expenses ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Backward-Compatible Seeding Script
DO $$
DECLARE
    t_rec RECORD;
    b_id uuid;
    p_rec RECORD;
BEGIN
    FOR t_rec IN SELECT id FROM tenants LOOP
        -- Only create a Main Branch if no branch exists for this tenant
        IF NOT EXISTS (SELECT 1 FROM branches WHERE tenant_id = t_rec.id) THEN
            INSERT INTO branches (tenant_id, name, address, phone, is_active)
            VALUES (t_rec.id, 'Main Branch', 'Default Address', '', true)
            RETURNING id INTO b_id;

            -- Link existing staff
            UPDATE staff
            SET branch_id = b_id
            WHERE tenant_id = t_rec.id;

            -- Link existing sales
            UPDATE sales
            SET branch_id = b_id
            WHERE tenant_id = t_rec.id;

            -- Link existing appointments
            UPDATE appointments
            SET branch_id = b_id
            WHERE tenant_id = t_rec.id;

            -- Link existing expenses
            UPDATE expenses
            SET branch_id = b_id
            WHERE tenant_id = t_rec.id;

            -- Seed branch-specific inventory from products stock column
            FOR p_rec IN SELECT id, stock FROM products WHERE tenant_id = t_rec.id LOOP
                INSERT INTO product_inventory (product_id, branch_id, tenant_id, stock)
                VALUES (p_rec.id, b_id, t_rec.id, p_rec.stock)
                ON CONFLICT (product_id, branch_id) DO NOTHING;
            END LOOP;
        END IF;
    END LOOP;
    
    -- Sync staff commission_services and commission_products with their current flat commission
    UPDATE staff
    SET commission_services = commission,
        commission_products = commission
    WHERE commission_services = 0 AND commission_products = 0;
END $$;
