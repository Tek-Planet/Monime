-- First, clean up duplicate profiles, keeping only the most recent one per user
DELETE FROM public.profiles
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM public.profiles
  ) t
  WHERE rn > 1
);

-- Now add the unique constraint to prevent future duplicates
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);