-- Drop the existing status check constraint
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Add new constraint with 'partial' status included
ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'));