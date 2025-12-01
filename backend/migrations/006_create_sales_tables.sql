-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE NULL,
    gender ENUM('male', 'female', 'other') NULL,
    loyalty_points INTEGER DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    last_visit DATETIME NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create sales table for POS transactions
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_number VARCHAR(50) UNIQUE NOT NULL, -- Sale receipt number
    store_id INTEGER NOT NULL,
    customer_id INTEGER NULL,
    cashier_id INTEGER NOT NULL, -- User who processed the sale
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    change_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    payment_status ENUM('pending', 'paid', 'partial', 'refunded') DEFAULT 'pending',
    sale_status ENUM('draft', 'completed', 'cancelled', 'refunded') DEFAULT 'draft',
    payment_method ENUM('cash', 'card', 'digital_wallet', 'credit', 'multiple') DEFAULT 'cash',
    notes TEXT,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (cashier_id) REFERENCES users(id)
);

-- Create sale items table
CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_variant_id INTEGER NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2) NOT NULL, -- (quantity * unit_price) - discount_amount
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);

-- Create sale payments table for handling multiple payment methods
CREATE TABLE IF NOT EXISTS sale_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    payment_method ENUM('cash', 'card', 'digital_wallet', 'credit') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    reference_number VARCHAR(100), -- Card transaction ID, e-wallet ref, etc.
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- Insert sample customer
INSERT INTO customers (name, email, phone, address) VALUES 
('Walk-in Customer', NULL, NULL, NULL);