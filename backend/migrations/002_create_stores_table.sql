-- Create stores table for multi-store support
CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- Store code for easy identification
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    manager_id INTEGER,
    status ENUM('active', 'inactive') DEFAULT 'active',
    opening_hours JSON, -- Store opening hours
    settings JSON, -- Store-specific settings (tax rates, receipt format, etc.)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Insert default store
INSERT INTO stores (name, code, address, phone, email, status) 
VALUES ('Main Store', 'MAIN', 'Jalan Utama No. 1', '021-1234567', 'main@store.com', 'active');