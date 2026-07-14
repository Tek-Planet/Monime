-- Create loan products table
CREATE TABLE public.loan_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  min_amount NUMERIC NOT NULL DEFAULT 0,
  max_amount NUMERIC NOT NULL DEFAULT 0,
  interest_rate NUMERIC NOT NULL DEFAULT 0,
  term_months INTEGER NOT NULL DEFAULT 12,
  product_type TEXT NOT NULL DEFAULT 'inventory', -- 'inventory', 'working_capital', 'equipment'
  min_credit_score INTEGER DEFAULT 300,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan applications table
CREATE TABLE public.loan_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  loan_product_id UUID NOT NULL REFERENCES public.loan_products(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  application_number TEXT NOT NULL UNIQUE,
  requested_amount NUMERIC NOT NULL,
  approved_amount NUMERIC,
  interest_rate NUMERIC,
  term_months INTEGER,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'pre_qualified', 'approved', 'rejected', 'disbursed', 'completed'
  credit_score INTEGER,
  risk_assessment JSONB,
  items_to_restock JSONB, -- Array of items with quantities and prices
  application_data JSONB, -- Store form data
  approval_date TIMESTAMP WITH TIME ZONE,
  disbursement_date TIMESTAMP WITH TIME ZONE,
  repayment_start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan disbursements table
CREATE TABLE public.loan_disbursements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_application_id UUID NOT NULL REFERENCES public.loan_applications(id),
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  amount NUMERIC NOT NULL,
  disbursement_method TEXT NOT NULL DEFAULT 'supplier_direct', -- 'supplier_direct', 'bank_transfer'
  disbursement_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reference_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan repayments table
CREATE TABLE public.loan_repayments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_application_id UUID NOT NULL REFERENCES public.loan_applications(id),
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  principal_amount NUMERIC NOT NULL,
  interest_amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'partial'
  payment_method TEXT,
  reference_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.loan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;

-- RLS policies for loan_products (public read access)
CREATE POLICY "Anyone can view active loan products"
ON public.loan_products
FOR SELECT
USING (is_active = true);

-- RLS policies for loan_applications
CREATE POLICY "Users can create their own loan applications"
ON public.loan_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own loan applications"
ON public.loan_applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own loan applications"
ON public.loan_applications
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for loan_disbursements
CREATE POLICY "Users can view their own loan disbursements"
ON public.loan_disbursements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loan disbursements"
ON public.loan_disbursements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for loan_repayments
CREATE POLICY "Users can view their own loan repayments"
ON public.loan_repayments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own loan repayments"
ON public.loan_repayments
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_loan_applications_user_id ON public.loan_applications(user_id);
CREATE INDEX idx_loan_applications_status ON public.loan_applications(status);
CREATE INDEX idx_loan_applications_supplier_id ON public.loan_applications(supplier_id);
CREATE INDEX idx_loan_disbursements_loan_application_id ON public.loan_disbursements(loan_application_id);
CREATE INDEX idx_loan_repayments_loan_application_id ON public.loan_repayments(loan_application_id);
CREATE INDEX idx_loan_repayments_due_date ON public.loan_repayments(due_date);

-- Create trigger for updating updated_at columns
CREATE TRIGGER update_loan_products_updated_at
BEFORE UPDATE ON public.loan_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_applications_updated_at
BEFORE UPDATE ON public.loan_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_disbursements_updated_at
BEFORE UPDATE ON public.loan_disbursements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_repayments_updated_at
BEFORE UPDATE ON public.loan_repayments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample loan products
INSERT INTO public.loan_products (name, description, min_amount, max_amount, interest_rate, term_months, product_type, min_credit_score) VALUES
('Inventory Financing - Basic', 'Short-term financing for inventory restocking with verified suppliers', 50000, 500000, 15.0, 6, 'inventory', 400),
('Inventory Financing - Premium', 'Medium-term financing for larger inventory purchases', 500000, 2000000, 12.0, 12, 'inventory', 500),
('Working Capital Loan', 'General business working capital for operations', 100000, 1000000, 18.0, 9, 'working_capital', 350),
('Equipment Financing', 'Financing for business equipment and machinery', 200000, 5000000, 14.0, 24, 'equipment', 450);

-- Function to generate application numbers
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get current date in YYYYMMDD format
    new_number := 'LA' || to_char(now(), 'YYYYMMDD');
    
    -- Find the highest counter for today
    SELECT COALESCE(MAX(CAST(RIGHT(application_number, 4) AS INTEGER)), 0) + 1
    INTO counter
    FROM loan_applications
    WHERE application_number LIKE new_number || '%';
    
    -- Pad counter to 4 digits
    new_number := new_number || LPAD(counter::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;