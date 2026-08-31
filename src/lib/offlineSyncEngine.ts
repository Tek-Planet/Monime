import { supabase } from '@/integrations/supabase/client';
import { 
  offlineDb, 
  type LocalInventoryItem, 
  type LocalCustomer, 
  type LocalSupplier, 
  type LocalSale, 
  type LocalSaleItem, 
  type LocalExpense, 
  type OutboxAction 
} from './offlineDb';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// -------------------------------------------------------------
// Read Cache Syncing (Remote -> Local)
// -------------------------------------------------------------

export async function cacheInventoryItems(items: LocalInventoryItem[]): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    await offlineDb.inventory.bulkPut(items);
    await offlineDb.meta.put({ key: 'inventory_last_cached', value: new Date().toISOString(), updated_at: new Date().toISOString() });
  } catch (err) {
    console.warn('Failed to cache inventory items in Dexie:', err);
  }
}

export async function cacheCustomers(items: LocalCustomer[]): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    await offlineDb.customers.bulkPut(items);
    await offlineDb.meta.put({ key: 'customers_last_cached', value: new Date().toISOString(), updated_at: new Date().toISOString() });
  } catch (err) {
    console.warn('Failed to cache customers in Dexie:', err);
  }
}

export async function cacheSuppliers(items: LocalSupplier[]): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    await offlineDb.suppliers.bulkPut(items);
  } catch (err) {
    console.warn('Failed to cache suppliers in Dexie:', err);
  }
}

export async function cacheSales(items: LocalSale[]): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    await offlineDb.sales.bulkPut(items.map(s => ({ ...s, synced: true, is_offline: false })));
  } catch (err) {
    console.warn('Failed to cache sales in Dexie:', err);
  }
}

export async function cacheExpenses(items: LocalExpense[]): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    await offlineDb.expenses.bulkPut(items.map(e => ({ ...e, synced: true, is_offline: false })));
  } catch (err) {
    console.warn('Failed to cache expenses in Dexie:', err);
  }
}

// -------------------------------------------------------------
// Offline Queue Operations (Local Write -> Outbox)
// -------------------------------------------------------------

export interface OfflineSaleInput {
  user_id: string;
  business_id: string;
  branch_id?: string | null;
  customer_id?: string | null;
  invoice_id?: string | null;
  sale_date?: string;
  total_amount: number;
  payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'credit';
  notes?: string | null;
  items?: Array<{
    product_id?: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
}

export async function recordOfflineSale(input: OfflineSaleInput): Promise<LocalSale> {
  const saleId = generateUUID();
  const now = new Date().toISOString();
  const saleDate = input.sale_date || now.split('T')[0];

  const localSale: LocalSale = {
    id: saleId,
    user_id: input.user_id,
    business_id: input.business_id,
    branch_id: input.branch_id || null,
    customer_id: input.customer_id || null,
    invoice_id: input.invoice_id || null,
    sale_date: saleDate,
    total_amount: input.total_amount,
    payment_method: input.payment_method,
    notes: input.notes || null,
    created_at: now,
    is_offline: true,
    synced: false,
  };

  const saleItems: LocalSaleItem[] = (input.items || []).map(item => ({
    id: generateUUID(),
    sale_id: saleId,
    product_id: item.product_id || null,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
    user_id: input.user_id,
    business_id: input.business_id,
    branch_id: input.branch_id || null,
  }));

  // Perform transactional write to local Dexie tables
  await offlineDb.transaction('rw', [offlineDb.sales, offlineDb.sale_items, offlineDb.inventory, offlineDb.outbox], async () => {
    // 1. Save local sale
    await offlineDb.sales.put(localSale);

    // 2. Save local sale items
    if (saleItems.length > 0) {
      await offlineDb.sale_items.bulkPut(saleItems);

      // 3. Deduct stock locally in Dexie inventory
      for (const item of saleItems) {
        if (item.product_id) {
          const invItem = await offlineDb.inventory.get(item.product_id);
          if (invItem) {
            const newQty = Math.max(0, (invItem.stock_quantity || 0) - item.quantity);
            await offlineDb.inventory.update(item.product_id, { stock_quantity: newQty });
          }
        }
      }
    }

    // 4. Enqueue into Outbox
    await offlineDb.outbox.add({
      id: saleId,
      entity_type: 'sale',
      action: 'INSERT',
      payload: localSale,
      items_payload: saleItems,
      created_at: now,
      status: 'pending',
      retry_count: 0,
    });
  });

  return localSale;
}

export interface OfflineExpenseInput {
  user_id: string;
  business_id: string;
  branch_id?: string | null;
  supplier_id?: string | null;
  description: string;
  amount: number;
  payment_method: string;
  category?: string | null;
  expense_date?: string;
  notes?: string | null;
}

export async function recordOfflineExpense(input: OfflineExpenseInput): Promise<LocalExpense> {
  const expenseId = generateUUID();
  const now = new Date().toISOString();
  const expenseDate = input.expense_date || now.split('T')[0];

  const localExpense: LocalExpense = {
    id: expenseId,
    user_id: input.user_id,
    business_id: input.business_id,
    branch_id: input.branch_id || null,
    supplier_id: input.supplier_id || null,
    description: input.description,
    amount: input.amount,
    payment_method: input.payment_method,
    category: input.category || null,
    expense_date: expenseDate,
    notes: input.notes || null,
    created_at: now,
    updated_at: now,
    is_offline: true,
    synced: false,
  };

  await offlineDb.transaction('rw', [offlineDb.expenses, offlineDb.outbox], async () => {
    await offlineDb.expenses.put(localExpense);

    await offlineDb.outbox.add({
      id: expenseId,
      entity_type: 'expense',
      action: 'INSERT',
      payload: localExpense,
      created_at: now,
      status: 'pending',
      retry_count: 0,
    });
  });

  return localExpense;
}

export interface OfflineCustomerInput {
  user_id: string;
  business_id: string;
  branch_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export async function recordOfflineCustomer(input: OfflineCustomerInput): Promise<LocalCustomer> {
  const customerId = generateUUID();
  const now = new Date().toISOString();

  const localCustomer: LocalCustomer = {
    id: customerId,
    business_id: input.business_id,
    branch_id: input.branch_id || null,
    name: input.name,
    email: input.email || null,
    phone: input.phone || null,
    created_at: now,
  };

  await offlineDb.transaction('rw', [offlineDb.customers, offlineDb.outbox], async () => {
    await offlineDb.customers.put(localCustomer);

    await offlineDb.outbox.add({
      id: customerId,
      entity_type: 'customer',
      action: 'INSERT',
      payload: {
        id: customerId,
        user_id: input.user_id,
        business_id: input.business_id,
        branch_id: input.branch_id || null,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
      },
      created_at: now,
      status: 'pending',
      retry_count: 0,
    });
  });

  return localCustomer;
}

// -------------------------------------------------------------
// Outbox Synchronization Engine (Local Outbox -> Supabase)
// -------------------------------------------------------------

export interface SyncResult {
  success: number;
  failed: number;
  total: number;
  errors: string[];
}

export async function processOutboxSync(): Promise<SyncResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: 0, failed: 0, total: 0, errors: ['Device is offline'] };
  }

  // Find all pending or failed outbox records
  const pendingActions = await offlineDb.outbox
    .where('status')
    .anyOf(['pending', 'failed'])
    .sortBy('queue_id');

  if (!pendingActions || pendingActions.length === 0) {
    return { success: 0, failed: 0, total: 0, errors: [] };
  }

  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const action of pendingActions) {
    if (!action.queue_id) continue;

    try {
      // Mark as syncing
      await offlineDb.outbox.update(action.queue_id, { status: 'syncing' });

      if (action.entity_type === 'customer' && action.action === 'INSERT') {
        const { error } = await supabase.from('customers').insert({
          id: action.payload.id,
          user_id: action.payload.user_id,
          business_id: action.payload.business_id,
          branch_id: action.payload.branch_id || null,
          name: action.payload.name,
          email: action.payload.email || null,
          phone: action.payload.phone || null,
        });

        if (error && error.code !== '23505') { // 23505 = unique constraint (already inserted)
          throw error;
        }

        // Successfully synced
        await offlineDb.outbox.delete(action.queue_id);
        successCount++;
      } else if (action.entity_type === 'sale' && action.action === 'INSERT') {
        const sale = action.payload as LocalSale;
        const items = (action.items_payload || []) as LocalSaleItem[];

        // 1. Insert sale into Supabase
        const { error: saleError } = await supabase.from('sales').insert({
          id: sale.id,
          user_id: sale.user_id || (await supabase.auth.getUser()).data.user?.id || '',
          business_id: sale.business_id,
          branch_id: sale.branch_id || null,
          customer_id: sale.customer_id || null,
          invoice_id: sale.invoice_id || null,
          sale_date: sale.sale_date,
          total_amount: sale.total_amount,
          payment_method: sale.payment_method,
          notes: sale.notes || null,
          created_at: sale.created_at,
        });

        if (saleError && saleError.code !== '23505') {
          throw saleError;
        }

        // 2. Insert sale items if any
        if (items && items.length > 0) {
          const formattedItems = items.map(item => ({
            id: item.id,
            sale_id: sale.id,
            product_id: item.product_id || null,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            user_id: item.user_id || sale.user_id || (supabase.auth.getUser() as any)?.data?.user?.id || '',
            business_id: item.business_id || sale.business_id,
            branch_id: item.branch_id || sale.branch_id || null,
          }));

          const { error: itemsError } = await supabase.from('sale_items').insert(formattedItems);
          if (itemsError && itemsError.code !== '23505') {
            console.error('Error syncing offline sale items:', itemsError);
          }

          // 3. Deduct remote inventory stock
          for (const item of items) {
            if (item.product_id) {
              const { data: invRow } = await supabase
                .from('inventory')
                .select('stock_quantity')
                .eq('id', item.product_id)
                .single();

              if (invRow) {
                await supabase
                  .from('inventory')
                  .update({
                    stock_quantity: Math.max(0, (invRow.stock_quantity || 0) - item.quantity),
                  })
                  .eq('id', item.product_id);
              }
            }
          }
        }

        // Mark local sale as synced
        await offlineDb.sales.update(sale.id, { synced: true, is_offline: false });
        await offlineDb.outbox.delete(action.queue_id);
        successCount++;
      } else if (action.entity_type === 'expense' && action.action === 'INSERT') {
        const expense = action.payload as LocalExpense;

        const { error: expenseError } = await supabase.from('expenses').insert({
          id: expense.id,
          user_id: expense.user_id || (await supabase.auth.getUser()).data.user?.id || '',
          business_id: expense.business_id,
          branch_id: expense.branch_id || null,
          supplier_id: expense.supplier_id || null,
          description: expense.description,
          amount: expense.amount,
          payment_method: expense.payment_method,
          category: expense.category || null,
          expense_date: expense.expense_date,
          notes: expense.notes || null,
          created_at: expense.created_at,
        });

        if (expenseError && expenseError.code !== '23505') {
          throw expenseError;
        }

        // Mark local expense as synced
        await offlineDb.expenses.update(expense.id, { synced: true, is_offline: false });
        await offlineDb.outbox.delete(action.queue_id);
        successCount++;
      } else {
        // Unknown or unhandled, remove to prevent queue blockage
        await offlineDb.outbox.delete(action.queue_id);
      }
    } catch (err: any) {
      console.error(`Sync error on queue item ${action.queue_id}:`, err);
      const errMsg = err?.message || 'Sync failed';
      errors.push(errMsg);
      failedCount++;

      await offlineDb.outbox.update(action.queue_id, {
        status: 'failed',
        retry_count: (action.retry_count || 0) + 1,
        last_error: errMsg,
      });
    }
  }

  await offlineDb.meta.put({
    key: 'last_sync_completed_at',
    value: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return {
    success: successCount,
    failed: failedCount,
    total: pendingActions.length,
    errors,
  };
}

export async function getPendingOutboxCount(): Promise<number> {
  try {
    return await offlineDb.outbox.where('status').anyOf(['pending', 'failed', 'syncing']).count();
  } catch {
    return 0;
  }
}
