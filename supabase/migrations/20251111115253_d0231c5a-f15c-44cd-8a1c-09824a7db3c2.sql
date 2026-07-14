-- Allow NGO admins to view customers for businesses in their NGO
CREATE POLICY "NGO admins can view customers in their NGO businesses"
ON customers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = customers.business_id
    AND b.ngo_id = user_ngo_id(auth.uid())
    AND is_ngo_admin(auth.uid(), b.ngo_id)
  )
);

-- Allow NGO admins to view sales for businesses in their NGO
CREATE POLICY "NGO admins can view sales in their NGO businesses"
ON sales FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = sales.business_id
    AND b.ngo_id = user_ngo_id(auth.uid())
    AND is_ngo_admin(auth.uid(), b.ngo_id)
  )
);

-- Allow NGO admins to view expenses for businesses in their NGO
CREATE POLICY "NGO admins can view expenses in their NGO businesses"
ON expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = expenses.business_id
    AND b.ngo_id = user_ngo_id(auth.uid())
    AND is_ngo_admin(auth.uid(), b.ngo_id)
  )
);

-- Allow NGO admins to view invoices for businesses in their NGO
CREATE POLICY "NGO admins can view invoices in their NGO businesses"
ON invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = invoices.business_id
    AND b.ngo_id = user_ngo_id(auth.uid())
    AND is_ngo_admin(auth.uid(), b.ngo_id)
  )
);

-- Allow NGO admins to view inventory for businesses in their NGO
CREATE POLICY "NGO admins can view inventory in their NGO businesses"
ON inventory FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = inventory.business_id
    AND b.ngo_id = user_ngo_id(auth.uid())
    AND is_ngo_admin(auth.uid(), b.ngo_id)
  )
);

-- Allow NGO admins to view suppliers for businesses in their NGO
CREATE POLICY "NGO admins can view suppliers in their NGO businesses"
ON suppliers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = suppliers.business_id
    AND b.ngo_id = user_ngo_id(auth.uid())
    AND is_ngo_admin(auth.uid(), b.ngo_id)
  )
);