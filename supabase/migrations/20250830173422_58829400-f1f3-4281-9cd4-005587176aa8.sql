-- Enable real-time functionality for suppliers and expenses tables
-- Add tables to supabase_realtime publication for real-time updates

-- Enable replica identity for suppliers table
ALTER TABLE public.suppliers REPLICA IDENTITY FULL;

-- Enable replica identity for expenses table  
ALTER TABLE public.expenses REPLICA IDENTITY FULL;

-- Add suppliers table to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'suppliers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
  END IF;
END $$;

-- Add expenses table to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  END IF;
END $$;