export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role?: string;
}

export interface Business {
  id: string;
  business_name: string;
  business_type?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency?: string;
  user_id: string;
}

export interface Branch {
  id: string;
  business_id: string;
  name: string;
  location?: string;
  is_main?: boolean;
}

export interface Sale {
  id: string;
  user_id: string;
  business_id: string;
  branch_id?: string;
  customer_id?: string;
  invoice_id?: string;
  sale_date: string;
  total_amount: number;
  payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'credit';
  notes?: string;
  created_at: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
}

export interface SaleItem {
  id?: string;
  sale_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  business_id: string;
  branch_id?: string;
  total_amount: number;
  paid_amount: number;
  status: 'draft' | 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  invoice_date: string;
  due_date?: string;
  notes?: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  invoice_items?: InvoiceItem[];
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface InventoryItem {
  id: string;
  business_id: string;
  branch_id?: string;
  name: string;
  sku?: string;
  category?: string;
  stock_quantity: number;
  unit_price: number;
  cost_price?: number;
  min_stock_level?: number;
  is_active: boolean;
  created_at?: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  business_type?: string;
  credit_limit?: number;
  current_balance?: number;
  created_at?: string;
}

export interface Supplier {
  id: string;
  business_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at?: string;
}

export interface Expense {
  id: string;
  business_id: string;
  branch_id?: string;
  category: string;
  amount: number;
  description?: string;
  expense_date: string;
  payment_method?: string;
  created_at?: string;
}

export interface CreditScoreResult {
  score: number;
  rating: 'EXCELLENT' | 'VERY GOOD' | 'GOOD' | 'FAIR' | 'POOR';
  maxLoanAmount: number;
  recommendedInterestRate: number;
  indices: {
    repaymentHistory: { score: number; maxScore: number; detail: string };
    transactionVolume: { score: number; maxScore: number; detail: string };
    businessAge: { score: number; maxScore: number; detail: string };
    inventoryValuation: { score: number; maxScore: number; detail: string };
    expenseRatio: { score: number; maxScore: number; detail: string };
    customerRetention: { score: number; maxScore: number; detail: string };
  };
}
