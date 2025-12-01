-- Create suppliers table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    contact VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    tax_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster searches
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_suppliers_status ON suppliers(status);

-- Update purchase_orders table to add supplier relation
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL;

-- Create index for supplier_id
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);