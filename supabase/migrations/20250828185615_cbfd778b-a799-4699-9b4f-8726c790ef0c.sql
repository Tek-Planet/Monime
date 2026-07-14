-- Add missing foreign key for expenses -> suppliers to enable embedded selects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_supplier_id_fkey'
  ) THEN
    ALTER TABLE public.expenses
    ADD CONSTRAINT expenses_supplier_id_fkey
    FOREIGN KEY (supplier_id)
    REFERENCES public.suppliers(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Helpful index for lookups/joins
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON public.expenses(supplier_id);
