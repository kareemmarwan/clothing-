-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE movement_type AS ENUM ('import', 'sale', 'loss', 'return');
CREATE TYPE invoice_status AS ENUM ('paid', 'partial', 'unpaid');

-- Products table (الأصناف)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('رجالي', 'حريمي')),
  type TEXT NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  cost_price NUMERIC(10, 2) NOT NULL CHECK (cost_price >= 0),
  sale_price NUMERIC(10, 2) NOT NULL CHECK (sale_price >= 0),
  quantity_imported NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (quantity_imported >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory movements table (حركات المخزون)
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type movement_type NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchants table (التجار)
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table (فواتير التوزيع)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  remaining_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (remaining_amount >= 0),
  status invoice_status NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0)
);

-- Payments table (الدفعات)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'نقدي',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Losses table (الفاقد)
CREATE TABLE losses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL CHECK (reason IN ('تالف', 'عيب', 'مفقود')),
  cost_impact NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_merchants_name ON merchants(name);
CREATE INDEX idx_invoices_merchant_id ON invoices(merchant_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_merchant_id ON payments(merchant_id);
CREATE INDEX idx_losses_product_id ON losses(product_id);

-- Create view for product stock calculation
CREATE OR REPLACE VIEW product_stock_view AS
SELECT
  p.id,
  p.name,
  p.category,
  p.type,
  p.size,
  p.color,
  p.cost_price,
  p.sale_price,
  p.quantity_imported,
  COALESCE(SUM(CASE WHEN im.movement_type = 'import' THEN im.quantity ELSE 0 END), 0) AS total_imported,
  COALESCE(SUM(CASE WHEN im.movement_type = 'sale' THEN im.quantity ELSE 0 END), 0) AS total_sold,
  COALESCE(SUM(CASE WHEN im.movement_type = 'loss' THEN im.quantity ELSE 0 END), 0) AS total_lost,
  COALESCE(SUM(CASE WHEN im.movement_type = 'return' THEN im.quantity ELSE 0 END), 0) AS total_returned,
  p.quantity_imported
    - COALESCE(SUM(CASE WHEN im.movement_type = 'sale' THEN im.quantity ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN im.movement_type = 'loss' THEN im.quantity ELSE 0 END), 0)
    + COALESCE(SUM(CASE WHEN im.movement_type = 'return' THEN im.quantity ELSE 0 END), 0)
    AS remaining
FROM products p
LEFT JOIN inventory_movements im ON p.id = im.product_id
GROUP BY p.id, p.name, p.category, p.type, p.size, p.color, p.cost_price, p.sale_price, p.quantity_imported;

-- Function to update invoice amounts when payment is added
CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update paid_amount and remaining_amount
  UPDATE invoices
  SET
    paid_amount = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = NEW.invoice_id),
    remaining_amount = total_amount - (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = NEW.invoice_id),
    status = CASE
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = NEW.invoice_id) >= total_amount THEN 'paid'::invoice_status
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = NEW.invoice_id) > 0 THEN 'partial'::invoice_status
      ELSE 'unpaid'::invoice_status
    END
  WHERE id = NEW.invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment updates
CREATE TRIGGER trigger_update_invoice_on_payment
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_on_payment();

-- Function to create inventory movement when invoice is created
CREATE OR REPLACE FUNCTION create_sale_movements_on_invoice()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called from the application layer
  -- when creating invoice items
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- View for merchant debt summary
CREATE OR REPLACE VIEW merchant_debt_view AS
SELECT
  m.id AS merchant_id,
  m.name AS merchant_name,
  m.phone AS merchant_phone,
  COALESCE(SUM(i.total_amount), 0) AS total_invoices,
  COALESCE(SUM(i.paid_amount), 0) AS total_paid,
  COALESCE(SUM(i.remaining_amount), 0) AS total_debt
FROM merchants m
LEFT JOIN invoices i ON m.id = i.merchant_id
GROUP BY m.id, m.name, m.phone;

-- View for dashboard stats
CREATE OR REPLACE VIEW dashboard_stats_view AS
SELECT
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices) AS total_sales,
  (SELECT COUNT(*) FROM invoices) AS invoice_count,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices) - (SELECT COALESCE(SUM(cost_impact), 0) FROM losses) AS net_profit,
  (SELECT COALESCE(SUM(cost_impact), 0) FROM losses) AS loss_value;

-- View for top debtors
CREATE OR REPLACE VIEW top_debtors_view AS
SELECT
  m.id AS merchant_id,
  m.name AS merchant_name,
  COALESCE(SUM(i.remaining_amount), 0) AS total_debt
FROM merchants m
LEFT JOIN invoices i ON m.id = i.merchant_id
GROUP BY m.id, m.name
HAVING COALESCE(SUM(i.remaining_amount), 0) > 0
ORDER BY total_debt DESC
LIMIT 5;

-- View for top selling products
CREATE OR REPLACE VIEW top_products_view AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  COALESCE(SUM(ii.quantity), 0) AS total_sold
FROM products p
LEFT JOIN invoice_items ii ON p.id = ii.product_id
GROUP BY p.id, p.name
ORDER BY total_sold DESC
LIMIT 5;

-- View for sales over time (daily)
CREATE OR REPLACE VIEW sales_over_time_view AS
SELECT
  DATE(created_at) AS sale_date,
  SUM(total_amount) AS daily_amount
FROM invoices
GROUP BY DATE(created_at)
ORDER BY sale_date;

-- View for sales by category
CREATE OR REPLACE VIEW sales_by_category_view AS
SELECT
  p.category,
  COALESCE(SUM(ii.line_total), 0) AS category_amount
FROM products p
LEFT JOIN invoice_items ii ON p.id = ii.product_id
GROUP BY p.category;
