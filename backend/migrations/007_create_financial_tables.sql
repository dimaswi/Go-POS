-- Create financial accounts table for chart of accounts
CREATE TABLE IF NOT EXISTS financial_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- Account code (1000, 2000, etc.)
    type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
    subtype VARCHAR(50), -- current_asset, fixed_asset, etc.
    parent_id INTEGER NULL, -- For sub-accounts
    balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES financial_accounts(id)
);

-- Create journal entries table for double-entry bookkeeping
CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    total_debit DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(15,2) NOT NULL DEFAULT 0,
    entry_date DATE NOT NULL,
    reference_type ENUM('sale', 'purchase', 'payment', 'adjustment', 'transfer') NULL,
    reference_id INTEGER NULL, -- Related transaction ID
    created_by INTEGER NOT NULL,
    status ENUM('draft', 'posted') DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create journal entry lines table
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES financial_accounts(id)
);

-- Insert basic chart of accounts
INSERT INTO financial_accounts (name, code, type, subtype, description) VALUES 
-- Assets
('Cash', '1001', 'asset', 'current_asset', 'Cash on hand'),
('Bank Account', '1002', 'asset', 'current_asset', 'Bank deposits'),
('Accounts Receivable', '1003', 'asset', 'current_asset', 'Money owed by customers'),
('Inventory', '1004', 'asset', 'current_asset', 'Product inventory'),
('Equipment', '1501', 'asset', 'fixed_asset', 'Store equipment'),

-- Liabilities
('Accounts Payable', '2001', 'liability', 'current_liability', 'Money owed to suppliers'),
('Sales Tax Payable', '2002', 'liability', 'current_liability', 'Tax collected from sales'),
('Long-term Debt', '2501', 'liability', 'long_term_liability', 'Long-term loans'),

-- Equity
('Owner Equity', '3001', 'equity', 'owner_equity', 'Owner investment'),
('Retained Earnings', '3002', 'equity', 'retained_earnings', 'Accumulated profits'),

-- Revenue
('Sales Revenue', '4001', 'revenue', 'operating_revenue', 'Revenue from sales'),
('Other Revenue', '4002', 'revenue', 'other_revenue', 'Other income'),

-- Expenses
('Cost of Goods Sold', '5001', 'expense', 'cost_of_sales', 'Cost of products sold'),
('Rent Expense', '6001', 'expense', 'operating_expense', 'Store rent'),
('Utilities Expense', '6002', 'expense', 'operating_expense', 'Utilities'),
('Salaries Expense', '6003', 'expense', 'operating_expense', 'Employee salaries'),
('Marketing Expense', '6004', 'expense', 'operating_expense', 'Marketing and advertising');