-- Add RLS policies for admins to view expenses data

-- System admins can view all expenses
CREATE POLICY "System admins can view all expenses"
ON public.expenses
FOR SELECT
USING (public.is_system_admin(auth.uid()));

-- NGO admins can view expenses from businesses in their NGO
CREATE POLICY "NGO admins can view their NGO's expenses"
ON public.expenses
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = expenses.business_id
      AND public.is_ngo_admin(auth.uid(), b.ngo_id)
  )
);