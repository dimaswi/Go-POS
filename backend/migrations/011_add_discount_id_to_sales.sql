-- Add discount_id column to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_id INTEGER REFERENCES discounts(id);

-- Create discount_usages table to track per-customer, per-sale discount usage
CREATE TABLE IF NOT EXISTS discount_usages (
    id SERIAL PRIMARY KEY,
    discount_id INTEGER NOT NULL REFERENCES discounts(id),
    customer_id INTEGER REFERENCES customers(id),
    sale_id INTEGER NOT NULL REFERENCES sales(id),
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_discount_usages_discount_id ON discount_usages(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_usages_customer_id ON discount_usages(customer_id);
CREATE INDEX IF NOT EXISTS idx_discount_usages_sale_id ON discount_usages(sale_id);

-- Add loyalty_min_purchase setting if not exists
INSERT INTO settings (key, value, created_at, updated_at)
VALUES ('loyalty_min_purchase', '10000', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
