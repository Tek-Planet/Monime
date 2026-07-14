-- Create fund disbursements table
CREATE TABLE public.fund_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES public.ngos(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0.00,
  disbursement_type TEXT NOT NULL DEFAULT 'grant',
  purpose TEXT NOT NULL,
  disbursement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  repayment_start_date DATE,
  repayment_end_date DATE,
  repayment_frequency TEXT,
  interest_rate NUMERIC DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  disbursed_by UUID REFERENCES auth.users(id),
  disbursed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_disbursement_type CHECK (disbursement_type IN ('grant', 'loan', 'credit')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'disbursed', 'completed', 'cancelled')),
  CONSTRAINT valid_repayment_frequency CHECK (repayment_frequency IS NULL OR repayment_frequency IN ('weekly', 'monthly', 'quarterly', 'annually'))
);

-- Create fund repayments table
CREATE TABLE public.fund_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disbursement_id UUID NOT NULL REFERENCES public.fund_disbursements(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  amount_due NUMERIC NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC NOT NULL DEFAULT 0.00,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_repayment_status CHECK (status IN ('pending', 'paid', 'overdue', 'partial', 'waived'))
);

-- Create trigger to update updated_at
CREATE TRIGGER update_fund_disbursements_updated_at
BEFORE UPDATE ON public.fund_disbursements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fund_repayments_updated_at
BEFORE UPDATE ON public.fund_repayments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.fund_disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_repayments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fund_disbursements
CREATE POLICY "System admins can manage all disbursements"
ON public.fund_disbursements
FOR ALL
USING (public.is_system_admin(auth.uid()));

CREATE POLICY "NGO admins can manage their NGO's disbursements"
ON public.fund_disbursements
FOR ALL
USING (public.is_ngo_admin(auth.uid(), ngo_id));

CREATE POLICY "Business owners can view their disbursements"
ON public.fund_disbursements
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = fund_disbursements.business_id
      AND b.owner_id = auth.uid()
  )
);

-- RLS Policies for fund_repayments
CREATE POLICY "System admins can manage all repayments"
ON public.fund_repayments
FOR ALL
USING (public.is_system_admin(auth.uid()));

CREATE POLICY "NGO admins can manage repayments for their NGO's businesses"
ON public.fund_repayments
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.fund_disbursements fd
    WHERE fd.id = fund_repayments.disbursement_id
      AND public.is_ngo_admin(auth.uid(), fd.ngo_id)
  )
);

CREATE POLICY "Business owners can view and update their repayments"
ON public.fund_repayments
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = fund_repayments.business_id
      AND b.owner_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_fund_disbursements_ngo_id ON public.fund_disbursements(ngo_id);
CREATE INDEX idx_fund_disbursements_business_id ON public.fund_disbursements(business_id);
CREATE INDEX idx_fund_disbursements_status ON public.fund_disbursements(status);
CREATE INDEX idx_fund_repayments_disbursement_id ON public.fund_repayments(disbursement_id);
CREATE INDEX idx_fund_repayments_status ON public.fund_repayments(status);