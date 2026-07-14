-- Make profile-documents bucket public for profile photos
UPDATE storage.buckets 
SET public = true 
WHERE name = 'profile-documents';

-- Create storage policies for profile-documents bucket
CREATE POLICY "Users can view their own profile documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own profile documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-documents' AND auth.uid()::text = (storage.foldername(name))[1]);