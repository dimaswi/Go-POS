-- Create warehouses table for multi-warehouse inventory
CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    manager_id INTEGER,
    store_id INTEGER, -- Link warehouse to store (optional)
    type ENUM('main', 'branch', 'virtual') DEFAULT 'main',
    status ENUM('active', 'inactive') DEFAULT 'active',
    capacity_info JSON, -- Storage capacity information
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- Insert default warehouse
INSERT INTO warehouses (name, code, address, type, status) 
VALUES ('Main Warehouse', 'WH001', 'Jalan Gudang No. 1', 'main', 'active');