-- Migration: Create discounts and sales settings tables
-- Created at: 2024-01-01

-- Discounts table
CREATE TABLE IF NOT EXISTS discounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- percentage, fixed
    discount_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    min_purchase DECIMAL(15,2) DEFAULT 0,
    max_discount DECIMAL(15,2) DEFAULT 0, -- 0 = unlimited
    applicable_to VARCHAR(50) DEFAULT 'all', -- all, member, specific_customer
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    applicable_items VARCHAR(50) DEFAULT 'all', -- all, category, product
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    usage_limit INTEGER DEFAULT 0, -- 0 = unlimited
    usage_count INTEGER DEFAULT 0,
    usage_per_customer INTEGER DEFAULT 0, -- 0 = unlimited
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Discount usage tracking
CREATE TABLE IF NOT EXISTS discount_usages (
    id SERIAL PRIMARY KEY,
    discount_id INTEGER NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales settings table
CREATE TABLE IF NOT EXISTS sales_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    setting_type VARCHAR(20) DEFAULT 'text', -- text, number, boolean, json
    setting_group VARCHAR(50) DEFAULT 'general', -- general, tax, discount, payment, receipt
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Insert default sales settings
INSERT INTO sales_settings (key, value, description, setting_type, setting_group) VALUES
    ('tax_enabled', 'true', 'Enable tax calculation', 'boolean', 'tax'),
    ('tax_rate', '11', 'Default tax rate percentage (PPN)', 'number', 'tax'),
    ('tax_name', 'PPN', 'Tax name displayed on receipt', 'text', 'tax'),
    ('tax_inclusive', 'false', 'Tax included in product price', 'boolean', 'tax'),
    ('default_discount_enabled', 'false', 'Enable default discount for all sales', 'boolean', 'discount'),
    ('default_discount_type', 'percentage', 'Default discount type', 'text', 'discount'),
    ('default_discount_value', '0', 'Default discount value', 'number', 'discount'),
    ('member_discount_enabled', 'true', 'Enable automatic discount for members', 'boolean', 'discount'),
    ('member_discount_value', '5', 'Member discount percentage', 'number', 'discount'),
    ('loyalty_points_enabled', 'true', 'Enable loyalty points system', 'boolean', 'general'),
    ('loyalty_points_per_amount', '1000', 'Spend amount to earn 1 point', 'number', 'general'),
    ('loyalty_points_value', '100', 'Value of 1 loyalty point in currency', 'number', 'general'),
    ('receipt_header', 'Terima Kasih Atas Kunjungan Anda', 'Receipt header text', 'text', 'receipt'),
    ('receipt_footer', 'Barang yang sudah dibeli tidak dapat dikembalikan', 'Receipt footer text', 'text', 'receipt'),
    ('receipt_show_tax', 'true', 'Show tax on receipt', 'boolean', 'receipt'),
    ('payment_methods', '["cash","card","digital_wallet"]', 'Enabled payment methods', 'json', 'payment'),
    ('allow_partial_payment', 'false', 'Allow partial payment', 'boolean', 'payment'),
    ('allow_credit_sale', 'false', 'Allow credit sale for members', 'boolean', 'payment')
ON CONFLICT (key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(is_active);
CREATE INDEX IF NOT EXISTS idx_discounts_dates ON discounts(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_discount_usages_discount ON discount_usages(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_usages_customer ON discount_usages(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_settings_group ON sales_settings(setting_group);
