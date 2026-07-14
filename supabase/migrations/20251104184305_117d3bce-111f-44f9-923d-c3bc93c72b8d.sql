-- Add RLS policies to allow admins to view all profiles
CREATE POLICY "System admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_system_admin(auth.uid()));

-- Add RLS policy to allow NGO admins to view profiles of users in their NGO
CREATE POLICY "NGO admins can view profiles in their NGO"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.businesses b
    INNER JOIN public.organization_members om ON om.business_id = b.id
    WHERE om.user_id = profiles.user_id
      AND b.ngo_id = user_ngo_id(auth.uid())
      AND is_ngo_admin(auth.uid(), b.ngo_id)
  )
);