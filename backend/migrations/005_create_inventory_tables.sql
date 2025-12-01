-- Create inventory table for tracking stock levels across warehouses
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    product_variant_id INTEGER NULL, -- For variant products
    warehouse_id INTEGER NOT NULL,
    quantity DECIMAL(10,3) DEFAULT 0,
    reserved_quantity DECIMAL(10,3) DEFAULT 0, -- Reserved for pending orders
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    UNIQUE(product_id, product_variant_id, warehouse_id)
);

-- Create inventory transactions table for tracking stock movements
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    product_variant_id INTEGER NULL,
    warehouse_id INTEGER NOT NULL,
    transaction_type ENUM('in', 'out', 'transfer', 'adjustment') NOT NULL,
    quantity DECIMAL(10,3) NOT NULL, -- Positive for in, negative for out
    unit_cost DECIMAL(15,2) DEFAULT 0,
    reference_type ENUM('purchase', 'sale', 'transfer', 'adjustment', 'return') NOT NULL,
    reference_id INTEGER, -- ID of related transaction (sale_id, purchase_id, etc.)
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create stock transfers table for moving inventory between warehouses
CREATE TABLE IF NOT EXISTS stock_transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    from_warehouse_id INTEGER NOT NULL,
    to_warehouse_id INTEGER NOT NULL,
    status ENUM('pending', 'in_transit', 'completed', 'cancelled') DEFAULT 'pending',
    requested_by INTEGER NOT NULL,
    approved_by INTEGER NULL,
    shipped_at DATETIME NULL,
    received_at DATETIME NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Create stock transfer items table
CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_variant_id INTEGER NULL,
    quantity_requested DECIMAL(10,3) NOT NULL,
    quantity_shipped DECIMAL(10,3) DEFAULT 0,
    quantity_received DECIMAL(10,3) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);