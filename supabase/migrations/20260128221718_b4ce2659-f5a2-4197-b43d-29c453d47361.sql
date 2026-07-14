-- =============================================
-- BRANCHES FEATURE - DATABASE MIGRATION
-- =============================================

-- 1. Create branches table
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  branch_name TEXT NOT NULL,
  branch_code TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_headquarters BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add unique constraint for branch_code within a business
CREATE UNIQUE INDEX idx_branches_business_code ON public.branches(business_id, branch_code) WHERE branch_code IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX idx_branches_business_id ON public.branches(business_id);

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- 2. Add branch_id to transactional tables (all nullable for backward compatibility)
ALTER TABLE public.inventory ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.customers ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.sales ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.sale_items ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.expenses ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.invoice_items ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.suppliers ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.credit_transactions ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- 3. Add branch assignment to organization_members (NULL = HQ/all-access)
ALTER TABLE public.organization_members ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- 4. Add indexes for branch_id columns for better query performance
CREATE INDEX idx_inventory_branch ON public.inventory(branch_id);
CREATE INDEX idx_customers_branch ON public.customers(branch_id);
CREATE INDEX idx_sales_branch ON public.sales(branch_id);
CREATE INDEX idx_sale_items_branch ON public.sale_items(branch_id);
CREATE INDEX idx_expenses_branch ON public.expenses(branch_id);
CREATE INDEX idx_invoices_branch ON public.invoices(branch_id);
CREATE INDEX idx_suppliers_branch ON public.suppliers(branch_id);
CREATE INDEX idx_credit_transactions_branch ON public.credit_transactions(branch_id);
CREATE INDEX idx_org_members_branch ON public.organization_members(branch_id);

-- 5. Create helper function to check if user has access to a branch
CREATE OR REPLACE FUNCTION public.user_has_branch_access(_user_id UUID, _branch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Branch is NULL (legacy data) - allow access
    _branch_id IS NULL
    OR
    -- User is the business owner
    EXISTS (
      SELECT 1 FROM public.branches br
      JOIN public.businesses b ON b.id = br.business_id
      WHERE br.id = _branch_id AND b.owner_id = _user_id
    )
    OR
    -- User is HQ staff (no branch assignment) for this business
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.branches br ON br.business_id = om.business_id
      WHERE br.id = _branch_id 
        AND om.user_id = _user_id 
        AND om.is_active = true 
        AND om.branch_id IS NULL
    )
    OR
    -- User is assigned to this specific branch
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.branch_id = _branch_id 
        AND om.user_id = _user_id 
        AND om.is_active = true
    );
$$;

-- 6. Create function to get user's branch ID (for branch-specific staff)
CREATE OR REPLACE FUNCTION public.user_branch_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id
  FROM public.organization_members
  WHERE user_id = _user_id
    AND is_active = true
  LIMIT 1;
$$;

-- 7. RLS Policies for branches table

-- Owners can manage their business branches
CREATE POLICY "Business owners can manage branches"
ON public.branches FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- HQ members can view all branches of their business
CREATE POLICY "HQ members can view all branches"
ON public.branches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.business_id = branches.business_id
    AND om.user_id = auth.uid()
    AND om.is_active = true
    AND om.branch_id IS NULL
  )
);

-- Branch members can view their assigned branch
CREATE POLICY "Branch members can view their branch"
ON public.branches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.branch_id = branches.id
    AND om.user_id = auth.uid()
    AND om.is_active = true
  )
);

-- System admins can view all branches
CREATE POLICY "System admins can view all branches"
ON public.branches FOR SELECT
USING (is_system_admin(auth.uid()));

-- NGO admins can view branches of businesses in their NGO
CREATE POLICY "NGO admins can view branches in their NGO"
ON public.branches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = branches.business_id
    AND b.ngo_id = user_ngo_id(auth.uid())
    AND is_ngo_admin(auth.uid(), b.ngo_id)
  )
);

-- 8. Add trigger for updated_at on branches
CREATE TRIGGER update_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();