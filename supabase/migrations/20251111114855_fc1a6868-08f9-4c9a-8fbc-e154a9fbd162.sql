-- Allow NGO admins to view profiles of business owners in their NGO
CREATE POLICY "NGO admins can view business owner profiles in their NGO"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.owner_id = profiles.user_id
    AND b.ngo_id = user_ngo_id(auth.uid())
    AND is_ngo_admin(auth.uid(), b.ngo_id)
  )
);