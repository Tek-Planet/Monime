ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pin_hash text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pin_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pin_lock_mode text NOT NULL DEFAULT 'every_open',
  ADD COLUMN IF NOT EXISTS pin_idle_timeout integer NOT NULL DEFAULT 5;