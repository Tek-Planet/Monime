-- Add foreign key constraints with CASCADE delete to ensure cleanup
-- when a user is deleted from auth.users

-- First, add foreign key constraint to profiles table
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key constraint to businesses table
ALTER TABLE public.businesses
DROP CONSTRAINT IF EXISTS businesses_owner_id_fkey;

ALTER TABLE public.businesses
ADD CONSTRAINT businesses_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add similar cascading deletes for other user-related tables
ALTER TABLE public.customers
DROP CONSTRAINT IF EXISTS customers_user_id_fkey;

ALTER TABLE public.customers
ADD CONSTRAINT customers_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.suppliers
DROP CONSTRAINT IF EXISTS suppliers_user_id_fkey;

ALTER TABLE public.suppliers
ADD CONSTRAINT suppliers_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.inventory
DROP CONSTRAINT IF EXISTS inventory_user_id_fkey;

ALTER TABLE public.inventory
ADD CONSTRAINT inventory_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_user_id_fkey;

ALTER TABLE public.products
ADD CONSTRAINT products_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.invoices
DROP CONSTRAINT IF EXISTS invoices_user_id_fkey;

ALTER TABLE public.invoices
ADD CONSTRAINT invoices_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.sales
DROP CONSTRAINT IF EXISTS sales_user_id_fkey;

ALTER TABLE public.sales
ADD CONSTRAINT sales_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.expenses
DROP CONSTRAINT IF EXISTS expenses_user_id_fkey;

ALTER TABLE public.expenses
ADD CONSTRAINT expenses_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.loan_applications
DROP CONSTRAINT IF EXISTS loan_applications_user_id_fkey;

ALTER TABLE public.loan_applications
ADD CONSTRAINT loan_applications_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.loan_repayments
DROP CONSTRAINT IF EXISTS loan_repayments_user_id_fkey;

ALTER TABLE public.loan_repayments
ADD CONSTRAINT loan_repayments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.loan_disbursements
DROP CONSTRAINT IF EXISTS loan_disbursements_user_id_fkey;

ALTER TABLE public.loan_disbursements
ADD CONSTRAINT loan_disbursements_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.credit_transactions
DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;

ALTER TABLE public.credit_transactions
ADD CONSTRAINT credit_transactions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.supplier_payments
DROP CONSTRAINT IF EXISTS supplier_payments_user_id_fkey;

ALTER TABLE public.supplier_payments
ADD CONSTRAINT supplier_payments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.profile_documents
DROP CONSTRAINT IF EXISTS profile_documents_user_id_fkey;

ALTER TABLE public.profile_documents
ADD CONSTRAINT profile_documents_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.business_documents
DROP CONSTRAINT IF EXISTS business_documents_user_id_fkey;

ALTER TABLE public.business_documents
ADD CONSTRAINT business_documents_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;