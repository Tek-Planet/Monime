-- Allow NGO admins to view loan applications for businesses in their NGO
CREATE POLICY "NGO admins can view loan applications in their NGO businesses"
ON loan_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = loan_applications.business_id
    AND b.ngo_id = user_ngo_id(auth.uid())
    AND is_ngo_admin(auth.uid(), b.ngo_id)
  )
);

-- Allow NGO admins to view loan disbursements for businesses in their NGO
CREATE POLICY "NGO admins can view loan disbursements in their NGO businesses"
ON loan_disbursements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = loan_disbursements.business_id
    AND b.ngo_id = user_ngo_id(auth.uid())
    AND is_ngo_admin(auth.uid(), b.ngo_id)
  )
);

-- Allow NGO admins to view loan repayments for businesses in their NGO
CREATE POLICY "NGO admins can view loan repayments in their NGO businesses"
ON loan_repayments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = loan_repayments.business_id
    AND b.ngo_id = user_ngo_id(auth.uid())
    AND is_ngo_admin(auth.uid(), b.ngo_id)
  )
);

-- Allow NGO admins to view credit transactions for businesses in their NGO
CREATE POLICY "NGO admins can view credit transactions in their NGO businesses"
ON credit_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = credit_transactions.business_id
    AND b.ngo_id = user_ngo_id(auth.uid())
    AND is_ngo_admin(auth.uid(), b.ngo_id)
  )
);