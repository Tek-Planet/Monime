-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "System admins can update all businesses" ON public.businesses;
DROP POLICY IF EXISTS "NGO admins can manage ngo assignment" ON public.businesses;

-- Allow system admins to update any business (needed to link/unlink NGOs from the UI)
CREATE POLICY "System admins can update all businesses"
ON public.businesses
FOR UPDATE
USING (is_system_admin(auth.uid()));

-- Allow NGO admins to assign or unassign businesses to their own NGO only.
-- This policy lets them:
--  - Assign an unassigned business (ngo_id IS NULL) to their NGO
--  - Update businesses already linked to their NGO (e.g., unassign)
-- It prevents assigning to other NGOs.
CREATE POLICY "NGO admins can manage ngo assignment"
ON public.businesses
FOR UPDATE
USING (
  is_ngo_admin(auth.uid(), user_ngo_id(auth.uid()))
  AND (ngo_id IS NULL OR ngo_id = user_ngo_id(auth.uid()))
);