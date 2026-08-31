import Dexie, { type Table } from 'dexie';

export interface LocalInventoryItem {
  id: string;
  business_id?: string;
  branch_id?: string | null;
  name: string;
  category?: string | null;
  unit_price: number;
  cost_price?: number | null;
  stock_quantity: number;
  min_stock_level?: number | null;
  supplier?: string | null;
  location?: string | null;
  is_active?: boolean;
  updated_at?: string;
}

export interface LocalCustomer {
  id: string;
  business_id?: string;
  branch_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  created_at?: string;
}

export interface LocalSupplier {
  id: string;
  business_id?: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

export interface LocalSale {
  id: string;
  user_id?: string;
  business_id: string;
  branch_id?: string | null;
  customer_id?: string | null;
  invoice_id?: string | null;
  sale_date: string;
  total_amount: number;
  payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'credit';
  notes?: string | null;
  created_at: string;
  is_offline?: boolean;
  synced?: boolean;
}

export interface LocalSaleItem {
  id: string;
  sale_id: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  user_id?: string;
  business_id?: string;
  branch_id?: string | null;
}

export interface LocalExpense {
  id: string;
  user_id?: string;
  business_id: string;
  branch_id?: string | null;
  supplier_id?: string | null;
  description: string;
  amount: number;
  payment_method: string;
  category?: string | null;
  expense_date: string;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  is_offline?: boolean;
  synced?: boolean;
}

export interface OutboxAction {
  queue_id?: number;
  id: string;
  entity_type: 'sale' | 'expense' | 'customer' | 'inventory_stock';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  items_payload?: any[];
  created_at: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  retry_count: number;
  last_error?: string;
}

export interface LocalMeta {
  key: string;
  value: any;
  updated_at: string;
}

export class MibuksOfflineDB extends Dexie {
  inventory!: Table<LocalInventoryItem, string>;
  customers!: Table<LocalCustomer, string>;
  suppliers!: Table<LocalSupplier, string>;
  sales!: Table<LocalSale, string>;
  sale_items!: Table<LocalSaleItem, string>;
  expenses!: Table<LocalExpense, string>;
  outbox!: Table<OutboxAction, number>;
  meta!: Table<LocalMeta, string>;

  constructor() {
    super('MibuksOfflineDB');

    this.version(1).stores({
      inventory: 'id, business_id, branch_id, name, category, is_active, updated_at',
      customers: 'id, business_id, branch_id, name, phone',
      suppliers: 'id, business_id, name',
      sales: 'id, business_id, branch_id, customer_id, sale_date, created_at, is_offline, synced',
      sale_items: 'id, sale_id, product_id, product_name',
      expenses: 'id, business_id, branch_id, supplier_id, expense_date, created_at, is_offline, synced',
      outbox: '++queue_id, id, entity_type, action, status, created_at, retry_count',
      meta: 'key, updated_at',
    });
  }
}

export const offlineDb = new MibuksOfflineDB();
