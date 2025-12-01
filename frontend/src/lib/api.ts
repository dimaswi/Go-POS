import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Permission {
  id: number;
  name: string;
  module: string;
  category: string;
  description: string;
  actions: string; // JSON string containing array of actions
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions?: Permission[];
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  role_id?: number;
  role?: Role;
  store_id?: number;
  store?: Store;
}

export interface PurchaseOrder {
  id: number;
  purchase_number: string;
  supplier_id?: number;
  supplier?: Supplier;
  supplier_name: string;
  supplier_contact?: string;
  warehouse_id: number;
  warehouse?: Warehouse;
  status: 'draft' | 'pending' | 'partial' | 'received' | 'cancelled';
  order_date: string;
  expected_date?: string;
  received_date?: string;
  total_amount: number;
  notes?: string;
  created_by: number;
  created_by_user?: User;
  items?: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  product_id: number;
  product?: Product;
  product_variant_id?: number;
  product_variant?: ProductVariant;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
}

export interface StockTransfer {
  id: number;
  transfer_number: string;
  from_warehouse_id?: number;
  from_warehouse?: Warehouse;
  to_warehouse_id?: number;
  to_warehouse?: Warehouse;
  from_store_id?: number;
  from_store?: Store;
  to_store_id?: number;
  to_store?: Store;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  requested_by: number;
  requested_by_user?: User;
  approved_by?: number;
  approved_by_user?: User;
  shipped_at?: string;
  received_at?: string;
  notes?: string;
  items?: StockTransferItem[];
  created_at: string;
  updated_at: string;
}

export interface StockTransferItem {
  id: number;
  transfer_id: number;
  product_id: number;
  product?: Product;
  product_variant_id?: number;
  product_variant?: ProductVariant;
  quantity_requested: number;
  quantity_shipped: number;
  quantity_received: number;
  created_at: string;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address?: string;
  manager_id?: number;
  manager?: User;
  store_id?: number;
  store?: Store;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category_id?: number;
  category?: Category;
  unit?: string;
  cost_price: number;
  selling_price: number;
  min_stock: number;
  max_stock?: number;
  is_trackable: boolean;
  is_active: boolean;
  images?: any;
  attributes?: any;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  attributes?: any;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  created_at: string;
}

export interface Inventory {
  id: number;
  product_id: number;
  product?: Product;
  product_variant_id?: number;
  product_variant?: ProductVariant;
  warehouse_id: number;
  warehouse?: Warehouse;
  quantity: number;
  reserved_quantity: number;
  min_stock: number;
  max_stock: number;
  last_updated: string;
  created_at: string;
}

export interface StoreInventory {
  id: number;
  product_id: number;
  product?: Product;
  product_variant_id?: number;
  product_variant?: ProductVariant;
  store_id: number;
  store?: Store;
  quantity: number;
  reserved_quantity: number;
  min_stock: number;
  max_stock: number;
  last_updated: string;
  selling_price: number;
  created_at: string;
}

export interface Store {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_id?: number;
  manager?: User;
  status: 'active' | 'inactive';
  opening_hours?: any;
  settings?: any;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  code: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  status: 'active' | 'inactive';
  payment_terms?: string;
  credit_limit: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (data: LoginRequest) => 
    api.post<LoginResponse>('/auth/login', data),
  
  getProfile: () => 
    api.get<User>('/auth/profile'),
};

export const usersApi = {
  getAll: () => 
    api.get<{ data: User[] }>('/users'),
  
  getById: (id: number) => 
    api.get<{ data: User }>(`/users/${id}`),
  
  create: (data: any) => 
    api.post<{ data: User }>('/users', data),
  
  update: (id: number, data: any) => 
    api.put<{ data: User }>(`/users/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/users/${id}`),
};

export const rolesApi = {
  getAll: () => 
    api.get('/roles'),
  
  getById: (id: number) => 
    api.get(`/roles/${id}`),
  
  create: (data: any) => 
    api.post('/roles', data),
  
  update: (id: number, data: any) => 
    api.put(`/roles/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/roles/${id}`),
};

export const permissionsApi = {
  getAll: () => 
    api.get('/permissions'),
  
  getById: (id: number) => 
    api.get(`/permissions/${id}`),
  
  create: (data: any) => 
    api.post('/permissions', data),
  
  update: (id: number, data: any) => 
    api.put(`/permissions/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/permissions/${id}`),
};

export const settingsApi = {
  getAll: () => 
    api.get('/settings'),
  
  update: (data: Record<string, string>) => 
    api.put('/settings', data),
};

export const storesApi = {
  getAll: (params?: any) => 
    api.get<{ data: Store[] }>('/stores', { params }),
  
  getById: (id: number) => 
    api.get<{ data: Store }>(`/stores/${id}`),
  
  create: (data: any) => 
    api.post<{ data: Store }>('/stores', data),
  
  update: (id: number, data: any) => 
    api.put<{ data: Store }>(`/stores/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/stores/${id}`),
  
  getStats: (id: number) => 
    api.get(`/stores/${id}/stats`),
};

// Suppliers API
export const suppliersApi = {
  getAll: (params?: any) => 
    api.get<{ data: Supplier[] }>('/suppliers', { params }),
  
  getById: (id: number) => 
    api.get<{ data: Supplier }>(`/suppliers/${id}`),
  
  create: (data: any) => 
    api.post<{ data: Supplier }>('/suppliers', data),
  
  update: (id: number, data: any) => 
    api.put<{ data: Supplier }>(`/suppliers/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/suppliers/${id}`),
};

// Products API
export const productsApi = {
  getAll: (params?: any) => 
    api.get('/products', { params }),
  
  getById: (id: number) => 
    api.get(`/products/${id}`),
  
  create: (data: any) => 
    api.post('/products', data),
  
  update: (id: number, data: any) => 
    api.put(`/products/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/products/${id}`),
};

// Categories API
export const categoriesApi = {
  getAll: (params?: any) => 
    api.get('/categories', { params }),
  
  getById: (id: number) => 
    api.get(`/categories/${id}`),
  
  create: (data: any) => 
    api.post('/categories', data),
  
  update: (id: number, data: any) => 
    api.put(`/categories/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/categories/${id}`),
};

// Warehouses API
export const warehousesApi = {
  getAll: (params?: any) => 
    api.get('/warehouses', { params }),
  
  getById: (id: number) => 
    api.get(`/warehouses/${id}`),
  
  create: (data: any) => 
    api.post('/warehouses', data),
  
  update: (id: number, data: any) => 
    api.put(`/warehouses/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/warehouses/${id}`),
  
  getInventory: (id: number, params?: any) => 
    api.get(`/warehouses/${id}/inventory`, { params }),
};

// Inventory API
export const inventoryApi = {
  getWarehouseInventory: (params?: any) => 
    api.get('/inventory', { params }),
  
  getWarehouseInventoryById: (id: number) => 
    api.get(`/inventory/${id}`),
  
  updateWarehouseInventory: (id: number, data: any) => 
    api.put(`/inventory/${id}`, data),
  
  getStoreInventory: (params?: any) => 
    api.get('/store-inventory', { params }),
  
  getStoreInventoryById: (id: number) => 
    api.get(`/store-inventory/${id}`),
  
  updateStoreInventory: (id: number, data: any) => 
    api.put(`/store-inventory/${id}`, data),
  
  adjustWarehouse: (data: any) => 
    api.post('/inventory/adjust', data),
  
  adjustStore: (data: any) => 
    api.post('/store-inventory/adjust', data),
  
  getTransactions: (params?: any) => 
    api.get('/inventory/transactions', { params }),
};

// Storage Location
export interface StorageLocation {
  id: number;
  code: string;
  name: string;
  type: 'warehouse' | 'store';
  location_type: string;
  warehouse_id?: number;
  warehouse?: Warehouse;
  store_id?: number;
  store?: Store;
  parent_id?: number;
  parent?: StorageLocation;
  description?: string;
  capacity?: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const storageLocationsApi = {
  getAll: (params?: any) => 
    api.get<{ data: StorageLocation[], pagination: any }>('/storage-locations', { params }),
  
  getById: (id: number) => 
    api.get<{ data: StorageLocation }>(`/storage-locations/${id}`),
  
  getByWarehouse: (warehouseId: number) => 
    api.get<{ data: StorageLocation[] }>(`/storage-locations/warehouse/${warehouseId}`),
  
  getByStore: (storeId: number) => 
    api.get<{ data: StorageLocation[] }>(`/storage-locations/store/${storeId}`),
  
  getAllActive: () => 
    api.get<{ data: StorageLocation[] }>('/storage-locations/active'),
  
  getTypes: (type?: string) => 
    api.get('/storage-locations/types', { params: { type } }),
  
  getProductsByLocation: (id: number) => 
    api.get(`/storage-locations/${id}/products`),
  
  create: (data: any) => 
    api.post<{ data: StorageLocation }>('/storage-locations', data),
  
  update: (id: number, data: any) => 
    api.put<{ data: StorageLocation }>(`/storage-locations/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/storage-locations/${id}`),
};

// Purchase Orders API
export const purchaseOrdersApi = {
  getAll: (params?: any) => 
    api.get('/purchase-orders', { params }),
  
  getById: (id: number) => 
    api.get(`/purchase-orders/${id}`),
  
  create: (data: any) => 
    api.post('/purchase-orders', data),

  update: (id: number, data: any) => 
    api.put(`/purchase-orders/${id}`, data),
  
  receive: (id: number, data: any) => 
    api.post(`/purchase-orders/${id}/receive`, data),
};

// Stock Transfers API
export const stockTransfersApi = {
  getAll: (params?: any) => 
    api.get('/stock-transfers', { params }),
  
  getById: (id: number) => 
    api.get(`/stock-transfers/${id}`),
  
  create: (data: any) => 
    api.post('/stock-transfers', data),

  update: (id: number, data: any) => 
    api.put(`/stock-transfers/${id}`, data),
  
  execute: (id: number) => 
    api.post(`/stock-transfers/${id}/execute`, {}),
};

// Customers API
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  is_member: boolean;
  loyalty_points: number;
  total_spent: number;
  last_visit?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export const customersApi = {
  getAll: (params?: any) => 
    api.get<{ data: Customer[], pagination: any }>('/customers', { params }),
  
  getById: (id: number) => 
    api.get<{ data: Customer }>(`/customers/${id}`),
  
  create: (data: any) => 
    api.post<{ data: Customer }>('/customers', data),
  
  update: (id: number, data: any) => 
    api.put<{ data: Customer }>(`/customers/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/customers/${id}`),
  
  getStats: (id: number) => 
    api.get(`/customers/${id}/stats`),
};

// Sales API
export interface Sale {
  id: number;
  sale_number: string;
  store_id: number;
  store?: Store;
  customer_id?: number;
  customer?: Customer;
  cashier_id: number;
  cashier?: User;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  sale_status: 'draft' | 'completed' | 'cancelled' | 'refunded';
  payment_method: 'cash' | 'card' | 'digital_wallet' | 'credit' | 'multiple';
  notes?: string;
  items?: SaleItem[];
  payments?: SalePayment[];
  sale_date: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product?: Product;
  product_variant_id?: number;
  product_variant?: ProductVariant;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
  created_at: string;
}

export interface SalePayment {
  id: number;
  sale_id: number;
  payment_method: 'cash' | 'card' | 'digital_wallet' | 'credit';
  amount: number;
  reference_number?: string;
  status: 'pending' | 'completed' | 'failed';
  processed_at: string;
  created_at: string;
}

export const salesApi = {
  getAll: (params?: any) => 
    api.get<{ data: Sale[], pagination: any }>('/sales', { params }),
  
  getById: (id: number) => 
    api.get<{ data: Sale }>(`/sales/${id}`),
  
  create: (data: any) => 
    api.post<{ data: Sale }>('/sales', data),
  
  update: (id: number, data: any) => 
    api.put<{ data: Sale }>(`/sales/${id}`, data),
  
  getStats: (params?: any) => 
    api.get('/sales/stats', { params }),
};

// Discounts API
export interface Discount {
  id: number;
  name: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount: number;
  applicable_to: 'all' | 'member' | 'specific_customer';
  customer_id?: number;
  customer?: Customer;
  applicable_items: 'all' | 'category' | 'product';
  category_id?: number;
  product_id?: number;
  usage_limit: number;
  usage_count: number;
  usage_per_customer: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  store_id?: number;
  store?: Store;
  created_by: number;
  created_by_user?: User;
  created_at: string;
  updated_at: string;
}

export const discountsApi = {
  getAll: (params?: any) => 
    api.get<{ data: Discount[], pagination: any }>('/discounts', { params }),
  
  getById: (id: number) => 
    api.get<{ data: Discount }>(`/discounts/${id}`),
  
  getActive: (params?: any) => 
    api.get<{ data: Discount[] }>('/discounts/active', { params }),
  
  validate: (params: { code: string; customer_id?: string; store_id?: string; amount?: string }) => 
    api.get<{ valid: boolean; discount: Discount; discount_amount: number }>('/discounts/validate', { params }),
  
  create: (data: any) => 
    api.post<{ data: Discount }>('/discounts', data),
  
  update: (id: number, data: any) => 
    api.put<{ data: Discount }>(`/discounts/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/discounts/${id}`),
};

// Sales Settings API
export const salesSettingsApi = {
  getAll: (group?: string) => 
    api.get('/sales-settings', { params: { group } }),
  
  getGrouped: () => 
    api.get('/sales-settings/grouped'),
  
  getTax: () => 
    api.get('/sales-settings/tax'),
  
  getDiscount: () => 
    api.get('/sales-settings/discount'),
  
  getReceipt: () => 
    api.get('/sales-settings/receipt'),
  
  getPayment: () => 
    api.get('/sales-settings/payment'),
  
  update: (data: { key: string; value: string; group: string }[]) => 
    api.put('/sales-settings', { settings: data }),
};

// AI Chat API
export interface AIChatRequest {
  message: string;
  store_id?: number;
}

export interface AIChatResponse {
  response: string;
  data?: Record<string, any>;
  intent?: string;
}

export const aiChatApi = {
  send: (data: AIChatRequest) =>
    api.post<AIChatResponse>('/ai/chat', data),
};
