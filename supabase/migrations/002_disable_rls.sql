-- Disable RLS on all tables
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE merchants DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE losses DISABLE ROW LEVEL SECURITY;

-- Grant access to anon and authenticated roles
GRANT ALL ON products TO anon, authenticated;
GRANT ALL ON inventory_movements TO anon, authenticated;
GRANT ALL ON merchants TO anon, authenticated;
GRANT ALL ON invoices TO anon, authenticated;
GRANT ALL ON invoice_items TO anon, authenticated;
GRANT ALL ON payments TO anon, authenticated;
GRANT ALL ON losses TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
