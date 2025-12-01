-- Create product categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER NULL, -- For subcategories
    image_url VARCHAR(500),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL, -- Stock Keeping Unit
    barcode VARCHAR(100) UNIQUE,
    category_id INTEGER,
    description TEXT,
    unit VARCHAR(50) DEFAULT 'pcs', -- Unit of measurement
    cost_price DECIMAL(15,2) DEFAULT 0,
    selling_price DECIMAL(15,2) DEFAULT 0,
    min_stock INTEGER DEFAULT 0, -- Minimum stock alert
    max_stock INTEGER DEFAULT NULL,
    is_trackable BOOLEAN DEFAULT true, -- Track inventory
    is_active BOOLEAN DEFAULT true,
    images JSON, -- Product images
    attributes JSON, -- Product attributes (size, color, etc.)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Create product variants table (for products with variants like size, color)
CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL, -- Variant name (Red, Large, etc.)
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    cost_price DECIMAL(15,2) DEFAULT 0,
    selling_price DECIMAL(15,2) DEFAULT 0,
    attributes JSON, -- Variant-specific attributes
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insert sample categories
INSERT INTO categories (name, code, description) VALUES 
('Food & Beverages', 'FNB', 'Food and beverage products'),
('Electronics', 'ELEC', 'Electronic products'),
('Clothing', 'CLOTH', 'Clothing and fashion items'),
('Health & Beauty', 'HB', 'Health and beauty products');