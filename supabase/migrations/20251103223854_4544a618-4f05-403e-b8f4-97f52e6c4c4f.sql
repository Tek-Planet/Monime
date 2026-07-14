-- Step 1: Update app_role enum to include system_admin and ngo_admin
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'system_admin') THEN
    ALTER TYPE app_role ADD VALUE 'system_admin';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'ngo_admin') THEN
    ALTER TYPE app_role ADD VALUE 'ngo_admin';
  END IF;
END $$;