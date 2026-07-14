-- Add UPDATE policy for profile-documents storage bucket
CREATE POLICY "Users can update their own profile documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-documents' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'profile-documents' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Add UPDATE policy for business-documents storage bucket  
CREATE POLICY "Users can update their own business documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-documents' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'business-documents' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);