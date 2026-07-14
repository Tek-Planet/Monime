-- Add RLS policies for admins to view sales data

-- System admins can view all sales
CREATE POLICY "System admins can view all sales"
ON public.sales
FOR SELECT
USING (public.is_system_admin(auth.uid()));

-- NGO admins can view sales from businesses in their NGO
CREATE POLICY "NGO admins can view their NGO's sales"
ON public.sales
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = sales.business_id
      AND public.is_ngo_admin(auth.uid(), b.ngo_id)
  )
);