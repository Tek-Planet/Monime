-- Allow System Admins to view all business data (customers, inventory, suppliers, invoices, credit_transactions, invoice_items)

CREATE POLICY "System admins can view all customers"
  ON public.customers FOR SELECT
  USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can view all inventory"
  ON public.inventory FOR SELECT
  USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can view all suppliers"
  ON public.suppliers FOR SELECT
  USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can view all invoices"
  ON public.invoices FOR SELECT
  USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can view all credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can view all invoice items"
  ON public.invoice_items FOR SELECT
  USING (public.is_system_admin(auth.uid()));
