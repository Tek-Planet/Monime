-- Create sale_items table to track individual items sold in each sale
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.inventory(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0.00,
  total_price NUMERIC NOT NULL DEFAULT 0.00,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sale_items
CREATE POLICY "Users can view their own sale items"
  ON public.sale_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sale items"
  ON public.sale_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sale items"
  ON public.sale_items FOR DELETE
  USING (auth.uid() = user_id);

-- NGO admin access policy
CREATE POLICY "NGO admins can view sale items in their NGO businesses"
  ON public.sale_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = sale_items.business_id
    AND b.ngo_id = user_ngo_id(auth.uid())
    AND is_ngo_admin(auth.uid(), b.ngo_id)
  ));

-- System admin access policy
CREATE POLICY "System admins can view all sale items"
  ON public.sale_items FOR SELECT
  USING (is_system_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX idx_sale_items_business_id ON public.sale_items(business_id);