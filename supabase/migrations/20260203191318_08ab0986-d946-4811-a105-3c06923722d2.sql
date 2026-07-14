-- Add latitude and longitude columns to businesses table
ALTER TABLE public.businesses
ADD COLUMN latitude numeric(10, 7) NULL,
ADD COLUMN longitude numeric(10, 7) NULL;

-- Add index for geo queries
CREATE INDEX idx_businesses_location ON public.businesses (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;