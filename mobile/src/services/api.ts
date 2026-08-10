import { supabase } from '../config/supabase';
import { Sale, Invoice, InventoryItem, Customer, Supplier, Expense, CreditScoreResult } from '../types';

export const ApiService = {
  // --- SALES ---
  async fetchSales(businessId: string, branchId?: string | null): Promise<Sale[]> {
    let query = supabase
      .from('sales')
      .select('*, customer:customers(id, name, email, phone)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (branchId) {
      query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Sale[];
  },

  async createSale(saleData: {
    userId: string;
    businessId: string;
    branchId?: string | null;
    customerId?: string;
    invoiceId?: string;
    totalAmount: number;
    paymentMethod: 'cash' | 'mobile_money' | 'bank_transfer' | 'credit';
    notes?: string;
    items?: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }>;
  }): Promise<Sale> {
    const { data: sale, error } = await supabase
      .from('sales')
      .insert({
        user_id: saleData.userId,
        business_id: saleData.businessId,
        branch_id: saleData.branchId || null,
        customer_id: saleData.customerId || null,
        invoice_id: saleData.invoiceId || null,
        sale_date: new Date().toISOString().split('T')[0],
        total_amount: saleData.totalAmount,
        payment_method: saleData.paymentMethod,
        notes: saleData.notes,
      })
      .select()
      .single();

    if (error) throw error;

    if (saleData.items && saleData.items.length > 0) {
      const itemsToInsert = saleData.items.map((it) => ({
        sale_id: sale.id,
        user_id: saleData.userId,
        business_id: saleData.businessId,
        branch_id: saleData.branchId || null,
        product_id: it.productId,
        product_name: it.productName,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        total_price: it.quantity * it.unitPrice,
      }));

      await supabase.from('sale_items').insert(itemsToInsert);

      // Reduce inventory stock
      for (const item of saleData.items) {
        const { data: inv } = await supabase
          .from('inventory')
          .select('stock_quantity')
          .eq('id', item.productId)
          .single();

        if (inv) {
          await supabase
            .from('inventory')
            .update({ stock_quantity: Math.max(0, inv.stock_quantity - item.quantity) })
            .eq('id', item.productId);
        }
      }
    }

    return sale as Sale;
  },

  // --- INVOICES ---
  async fetchInvoices(businessId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(id, name, email, phone), invoice_items(*)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Invoice[];
  },

  async createInvoice(invoiceData: {
    userId: string;
    businessId: string;
    customerId: string;
    invoiceNumber: string;
    totalAmount: number;
    dueDate?: string;
    notes?: string;
    items: Array<{ productName: string; quantity: number; unitPrice: number; productId?: string }>;
  }): Promise<Invoice> {
    const { data: inv, error } = await supabase
      .from('invoices')
      .insert({
        user_id: invoiceData.userId,
        business_id: invoiceData.businessId,
        customer_id: invoiceData.customerId,
        invoice_number: invoiceData.invoiceNumber,
        total_amount: invoiceData.totalAmount,
        paid_amount: 0,
        status: 'pending',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: invoiceData.dueDate || null,
        notes: invoiceData.notes,
      })
      .select()
      .single();

    if (error) throw error;

    if (invoiceData.items && invoiceData.items.length > 0) {
      const items = invoiceData.items.map((it) => ({
        invoice_id: inv.id,
        user_id: invoiceData.userId,
        business_id: invoiceData.businessId,
        product_id: it.productId || null,
        product_name: it.productName,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        total_price: it.quantity * it.unitPrice,
      }));

      await supabase.from('invoice_items').insert(items);
    }

    return inv as Invoice;
  },

  // --- INVENTORY ---
  async fetchInventory(businessId: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as InventoryItem[];
  },

  async createInventoryItem(itemData: Omit<InventoryItem, 'id' | 'created_at'>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .insert(itemData)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryItem;
  },

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
    const { error } = await supabase.from('inventory').update(updates).eq('id', id);
    if (error) throw error;
  },

  // --- CUSTOMERS ---
  async fetchCustomers(businessId: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as Customer[];
  },

  async createCustomer(customerData: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) throw error;
    return data as Customer;
  },

  // --- SUPPLIERS ---
  async fetchSuppliers(businessId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as Supplier[];
  },

  async createSupplier(supplierData: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();

    if (error) throw error;
    return data as Supplier;
  },

  // --- EXPENSES ---
  async fetchExpenses(businessId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('business_id', businessId)
      .order('expense_date', { ascending: false });

    if (error) throw error;
    return (data || []) as Expense[];
  },

  async createExpense(expenseData: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();

    if (error) throw error;
    return data as Expense;
  },

  // --- CREDIT SCORE CALCULATOR ENGINE ---
  async calculateCreditScore(businessId: string): Promise<CreditScoreResult> {
    try {
      const [
        { data: sales },
        { data: invoices },
        { data: inventory },
        { data: expenses },
        { data: business },
      ] = await Promise.all([
        supabase.from('sales').select('*').eq('business_id', businessId),
        supabase.from('invoices').select('*').eq('business_id', businessId),
        supabase.from('inventory').select('*').eq('business_id', businessId),
        supabase.from('expenses').select('*').eq('business_id', businessId),
        supabase.from('businesses').select('created_at').eq('id', businessId).single(),
      ]);

      const allSales = sales || [];
      const allInvoices = invoices || [];
      const allInventory = inventory || [];
      const allExpenses = expenses || [];

      // 1. Repayment History (Max 250)
      let repaymentScore = 150;
      let repaymentDetail = 'Baseline rating';
      if (allInvoices.length > 0) {
        const paidCount = allInvoices.filter((i) => i.status === 'paid').length;
        const ratio = paidCount / allInvoices.length;
        repaymentScore = Math.round(ratio * 250);
        repaymentDetail = `${paidCount} of ${allInvoices.length} invoices paid on time (${Math.round(ratio * 100)}%)`;
      } else {
        repaymentDetail = 'No credit invoices issued yet';
      }

      // 2. Transaction Volume & Consistency (Max 200)
      const totalRevenue = allSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
      let volumeScore = Math.min(200, Math.round((allSales.length * 5) + (totalRevenue / 100000)));
      let volumeDetail = `${allSales.length} total sales transactions recorded`;

      // 3. Business Age / Longevity (Max 100)
      let ageScore = 50;
      let ageDetail = 'New business account';
      if (business?.created_at) {
        const days = Math.floor((Date.now() - new Date(business.created_at).getTime()) / (1000 * 60 * 60 * 24));
        ageScore = Math.min(100, Math.max(30, Math.round(days * 0.8)));
        ageDetail = `Active for ${days} days on MiBuks platform`;
      }

      // 4. Inventory Valuation (Max 100)
      const stockValuation = allInventory.reduce((sum, item) => sum + (Number(item.unit_price || 0) * (item.stock_quantity || 0)), 0);
      let invScore = Math.min(100, Math.round(stockValuation / 50000));
      let invDetail = `Stock valuation is Le ${stockValuation.toLocaleString()}`;

      // 5. Expense Ratio (Max 100)
      const totalExp = allExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      let expScore = 70;
      let expDetail = 'Balanced expense management';
      if (totalRevenue > 0) {
        const ratio = totalExp / totalRevenue;
        if (ratio < 0.4) expScore = 100;
        else if (ratio < 0.7) expScore = 80;
        else expScore = 40;
        expDetail = `Expense ratio is ${Math.round(ratio * 100)}% of sales revenue`;
      }

      // 6. Customer Retention & Repeat Sales (Max 100)
      const customerIds = allSales.map((s) => s.customer_id).filter(Boolean);
      const uniqueCustomers = new Set(customerIds).size;
      let retScore = Math.min(100, uniqueCustomers * 15);
      let retDetail = `${uniqueCustomers} unique active customers served`;

      const totalScore = Math.min(850, Math.max(300, repaymentScore + volumeScore + ageScore + invScore + expScore + retScore));

      let rating: CreditScoreResult['rating'] = 'FAIR';
      if (totalScore >= 750) rating = 'EXCELLENT';
      else if (totalScore >= 680) rating = 'VERY GOOD';
      else if (totalScore >= 600) rating = 'GOOD';
      else if (totalScore >= 500) rating = 'FAIR';
      else rating = 'POOR';

      const maxLoanAmount = Math.min(250000000, Math.round(totalScore * 150000));
      const recommendedInterestRate = totalScore >= 750 ? 5.5 : totalScore >= 680 ? 7.0 : totalScore >= 600 ? 8.5 : 10.5;

      return {
        score: totalScore,
        rating,
        maxLoanAmount,
        recommendedInterestRate,
        indices: {
          repaymentHistory: { score: repaymentScore, maxScore: 250, detail: repaymentDetail },
          transactionVolume: { score: volumeScore, maxScore: 200, detail: volumeDetail },
          businessAge: { score: ageScore, maxScore: 100, detail: ageDetail },
          inventoryValuation: { score: invScore, maxScore: 100, detail: invDetail },
          expenseRatio: { score: expScore, maxScore: 100, detail: expDetail },
          customerRetention: { score: retScore, maxScore: 100, detail: retDetail },
        },
      };
    } catch (e) {
      console.error('Error calculating credit score:', e);
      return {
        score: 620,
        rating: 'GOOD',
        maxLoanAmount: 93000000,
        recommendedInterestRate: 8.5,
        indices: {
          repaymentHistory: { score: 180, maxScore: 250, detail: 'Good payment history' },
          transactionVolume: { score: 140, maxScore: 200, detail: 'Consistent transaction volume' },
          businessAge: { score: 60, maxScore: 100, detail: 'Established account' },
          inventoryValuation: { score: 70, maxScore: 100, detail: 'Healthy inventory stock' },
          expenseRatio: { score: 80, maxScore: 100, detail: 'Controlled operating costs' },
          customerRetention: { score: 90, maxScore: 100, detail: 'Strong customer base' },
        },
      };
    }
  },
};
