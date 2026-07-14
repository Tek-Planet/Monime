-- Add SELECT policies for organization members to access business data

-- Sales: Allow organization members to view business sales
CREATE POLICY "Organization members can view business sales"
ON public.sales
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
);

-- Sale Items: Allow organization members to view business sale items
CREATE POLICY "Organization members can view business sale items"
ON public.sale_items
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
);

-- Expenses: Allow organization members to view business expenses
CREATE POLICY "Organization members can view business expenses"
ON public.expenses
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
);

-- Customers: Allow organization members to view business customers
CREATE POLICY "Organization members can view business customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
);

-- Inventory: Allow organization members to view business inventory
CREATE POLICY "Organization members can view business inventory"
ON public.inventory
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
);

-- Invoices: Allow organization members to view business invoices
CREATE POLICY "Organization members can view business invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
);

-- Invoice Items: Allow organization members to view invoice items
CREATE POLICY "Organization members can view business invoice items"
ON public.invoice_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_items.invoice_id
    AND (i.user_id = auth.uid() OR is_business_member(auth.uid(), i.business_id))
  )
);

-- Suppliers: Allow organization members to view business suppliers
CREATE POLICY "Organization members can view business suppliers"
ON public.suppliers
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
);

-- Credit Transactions: Allow organization members to view business credit transactions
CREATE POLICY "Organization members can view business credit transactions"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR is_business_member(auth.uid(), business_id)
);