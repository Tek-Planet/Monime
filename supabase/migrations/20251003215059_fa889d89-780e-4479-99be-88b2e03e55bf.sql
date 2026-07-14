-- Drop the problematic policy
DROP POLICY IF EXISTS "Organization members can view their business" ON public.businesses;

-- Create a security definer function to check if user is a member of a business
CREATE OR REPLACE FUNCTION public.is_business_member(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND business_id = _business_id
      AND is_active = true
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Organization members can view their business"
ON public.businesses
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id OR public.is_business_member(auth.uid(), id)
);