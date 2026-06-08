export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role_id: number;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Brand {
  id: number;
  name: string;
  description?: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  barcode: string;
  size: string;
  color: string;
  price: number;
  image_url?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  category_id: number;
  brand_id: number;
  category: Category;
  brand: Brand;
  variants: ProductVariant[];
  created_at: string;
}

export interface Warehouse {
  id: number;
  name: string;
  location?: string;
  created_at: string;
}

export interface Inventory {
  id: number;
  warehouse_id: number;
  variant_id: number;
  quantity: number;
  min_stock_level: number;
  warehouse: Warehouse;
  variant: ProductVariant & { product?: { name: string } };
}

export interface InventoryTransaction {
  id: number;
  transaction_type: 'INCOMING' | 'OUTGOING' | 'TRANSFER' | 'ADJUSTMENT';
  variant_id: number;
  quantity: number;
  from_warehouse_id?: number;
  to_warehouse_id?: number;
  user_id: number;
  remarks?: string;
  created_at: string;
  variant: ProductVariant & { product?: { name: string } };
  user?: User;
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
}

export interface Customer {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  variant_id: number;
  quantity: number;
  unit_price: number;
  variant: ProductVariant & { product?: { name: string } };
}

export interface Order {
  id: number;
  customer_id: number;
  seller_id: number;
  total_amount: number;
  status: string;
  created_at: string;
  customer: Customer;
  seller: User;
  items: OrderItem[];
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  details?: string;
  created_at: string;
  user?: User;
}

export interface DashboardStats {
  total_products: number;
  total_stock: number;
  low_stock_products: number;
  todays_sales: number;
  monthly_revenue: number;
  inventory_value: number;
  recent_transactions: InventoryTransaction[];
  recent_orders: Order[];
}
