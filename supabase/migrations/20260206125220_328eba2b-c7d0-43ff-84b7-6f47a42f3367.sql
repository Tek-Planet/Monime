-- Add branches_enabled flag to businesses table
ALTER TABLE public.businesses 
ADD COLUMN branches_enabled boolean NOT NULL DEFAULT false;

-- Comment for clarity
COMMENT ON COLUMN public.businesses.branches_enabled IS 'When true, multi-branch functionality is enabled. When false, branch selector is hidden and all data is treated as single-location.';