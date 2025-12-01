-- Migration untuk Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    purchase_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_contact TEXT,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'received', 'cancelled')),
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_date TIMESTAMP,
    received_date TIMESTAMP,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_variant_id INTEGER REFERENCES product_variants(id),
    quantity_ordered DECIMAL(10,2) NOT NULL CHECK (quantity_ordered > 0),
    quantity_received DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
    unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
    total_cost DECIMAL(15,2) NOT NULL CHECK (total_cost >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration untuk Stock Transfers
CREATE TABLE IF NOT EXISTS stock_transfers (
    id SERIAL PRIMARY KEY,
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    from_warehouse_id INTEGER REFERENCES warehouses(id),
    from_store_id INTEGER REFERENCES stores(id),
    to_warehouse_id INTEGER REFERENCES warehouses(id),
    to_store_id INTEGER REFERENCES stores(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'completed', 'cancelled')),
    requested_by INTEGER NOT NULL REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    shipped_at TIMESTAMP,
    received_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id SERIAL PRIMARY KEY,
    transfer_id INTEGER NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_variant_id INTEGER REFERENCES product_variants(id),
    quantity_requested DECIMAL(10,3) NOT NULL CHECK (quantity_requested > 0),
    quantity_shipped DECIMAL(10,3) NOT NULL DEFAULT 0,
    quantity_received DECIMAL(10,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_warehouse_id ON purchase_orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by ON purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON purchase_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_stock_transfers_from_warehouse ON stock_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_from_store ON stock_transfers(from_store_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_to_warehouse ON stock_transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_to_store ON stock_transfers(to_store_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_requested_by ON stock_transfers(requested_by);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_transfer_id ON stock_transfer_items(stock_transfer_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_product_id ON stock_transfer_items(product_id);