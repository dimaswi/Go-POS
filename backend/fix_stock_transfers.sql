-- Drop existing tables and recreate
DROP TABLE IF EXISTS stock_transfer_items CASCADE;
DROP TABLE IF EXISTS stock_transfers CASCADE;

-- Create stock_transfers with correct structure
CREATE TABLE stock_transfers (
    id SERIAL PRIMARY KEY,
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    from_warehouse_id INTEGER REFERENCES warehouses(id),
    from_store_id INTEGER REFERENCES stores(id),
    to_warehouse_id INTEGER REFERENCES warehouses(id),
    to_store_id INTEGER REFERENCES stores(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_by INTEGER NOT NULL REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    shipped_at TIMESTAMP,
    received_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_transfer_items
CREATE TABLE stock_transfer_items (
    id SERIAL PRIMARY KEY,
    transfer_id INTEGER NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_variant_id INTEGER REFERENCES product_variants(id),
    quantity_requested DECIMAL(10,3) NOT NULL,
    quantity_shipped DECIMAL(10,3) NOT NULL DEFAULT 0,
    quantity_received DECIMAL(10,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_stock_transfers_from_warehouse ON stock_transfers(from_warehouse_id);
CREATE INDEX idx_stock_transfers_from_store ON stock_transfers(from_store_id);
CREATE INDEX idx_stock_transfers_to_warehouse ON stock_transfers(to_warehouse_id);
CREATE INDEX idx_stock_transfers_to_store ON stock_transfers(to_store_id);
CREATE INDEX idx_stock_transfers_status ON stock_transfers(status);
