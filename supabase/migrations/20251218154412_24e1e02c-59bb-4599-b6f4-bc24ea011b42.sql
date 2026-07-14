-- Update RLS policies to include business owner check

-- Sales
DROP POLICY IF EXISTS "Organization members can view business sales" ON public.sales;
CREATE POLICY "Organization members can view business sales"
ON public.sales FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
  OR EXISTS (SELECT 1 FROM businesses WHERE id = sales.business_id AND owner_id = auth.uid())
);

-- Sale Items
DROP POLICY IF EXISTS "Organization members can view business sale items" ON public.sale_items;
CREATE POLICY "Organization members can view business sale items"
ON public.sale_items FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
  OR EXISTS (SELECT 1 FROM businesses WHERE id = sale_items.business_id AND owner_id = auth.uid())
);

-- Expenses
DROP POLICY IF EXISTS "Organization members can view business expenses" ON public.expenses;
CREATE POLICY "Organization members can view business expenses"
ON public.expenses FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
  OR EXISTS (SELECT 1 FROM businesses WHERE id = expenses.business_id AND owner_id = auth.uid())
);

-- Customers
DROP POLICY IF EXISTS "Organization members can view business customers" ON public.customers;
CREATE POLICY "Organization members can view business customers"
ON public.customers FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
  OR EXISTS (SELECT 1 FROM businesses WHERE id = customers.business_id AND owner_id = auth.uid())
);

-- Inventory
DROP POLICY IF EXISTS "Organization members can view business inventory" ON public.inventory;
CREATE POLICY "Organization members can view business inventory"
ON public.inventory FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
  OR EXISTS (SELECT 1 FROM businesses WHERE id = inventory.business_id AND owner_id = auth.uid())
);

-- Invoices
DROP POLICY IF EXISTS "Organization members can view business invoices" ON public.invoices;
CREATE POLICY "Organization members can view business invoices"
ON public.invoices FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
  OR EXISTS (SELECT 1 FROM businesses WHERE id = invoices.business_id AND owner_id = auth.uid())
);

-- Invoice Items
DROP POLICY IF EXISTS "Organization members can view business invoice items" ON public.invoice_items;
CREATE POLICY "Organization members can view business invoice items"
ON public.invoice_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND (
      i.user_id = auth.uid()
      OR is_business_member(auth.uid(), i.business_id)
      OR EXISTS (SELECT 1 FROM businesses WHERE id = i.business_id AND owner_id = auth.uid())
    )
  )
);

-- Suppliers
DROP POLICY IF EXISTS "Organization members can view business suppliers" ON public.suppliers;
CREATE POLICY "Organization members can view business suppliers"
ON public.suppliers FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
  OR EXISTS (SELECT 1 FROM businesses WHERE id = suppliers.business_id AND owner_id = auth.uid())
);

-- Credit Transactions
DROP POLICY IF EXISTS "Organization members can view business credit transactions" ON public.credit_transactions;
CREATE POLICY "Organization members can view business credit transactions"
ON public.credit_transactions FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
  OR EXISTS (SELECT 1 FROM businesses WHERE id = credit_transactions.business_id AND owner_id = auth.uid())
);