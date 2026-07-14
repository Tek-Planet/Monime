-- Update businesses RLS to allow NGO admin and system admin access
DROP POLICY IF EXISTS "Users can view their own businesses" ON public.businesses;

CREATE POLICY "Business access for owners, members, NGO admins and system admins"
ON public.businesses
FOR SELECT
USING (
  auth.uid() = owner_id OR
  public.is_business_member(auth.uid(), id) OR
  (ngo_id IS NOT NULL AND public.is_ngo_admin(auth.uid(), ngo_id)) OR
  public.is_system_admin(auth.uid())
);

-- Update activity_logs RLS for system admins
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;

CREATE POLICY "System admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (public.is_system_admin(auth.uid()));

-- Allow NGO admins to view activity logs for their NGO's businesses
CREATE POLICY "NGO admins can view activity logs for their businesses"
ON public.activity_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = activity_logs.business_id
      AND b.ngo_id = public.user_ngo_id(auth.uid())
      AND public.is_ngo_admin(auth.uid(), b.ngo_id)
  )
);