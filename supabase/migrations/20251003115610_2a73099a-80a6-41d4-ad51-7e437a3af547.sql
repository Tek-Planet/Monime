-- Add email and display name to organization_members for better UX
ALTER TABLE public.organization_members
ADD COLUMN email TEXT,
ADD COLUMN display_name TEXT;

-- Update existing members with their email from auth.users
-- This will be populated when they accept invitations going forward