-- Allow organization members to view the business they're part of
CREATE POLICY "Organization members can view their business"
ON public.businesses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_members.business_id = businesses.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = true
  )
);