-- First, clean up duplicate businesses, keeping only the most recent one per owner
DELETE FROM public.businesses
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at DESC) as rn
    FROM public.businesses
  ) t
  WHERE rn > 1
);

-- Now add the unique constraint to prevent future duplicates
ALTER TABLE public.businesses
ADD CONSTRAINT businesses_owner_id_unique UNIQUE (owner_id);