-- Drop the old constraint and add one matching the application values
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;

ALTER TABLE public.sales ADD CONSTRAINT sales_payment_method_check 
CHECK (payment_method = ANY (ARRAY['cash'::text, 'mobile_money'::text, 'bank_transfer'::text, 'credit'::text]));