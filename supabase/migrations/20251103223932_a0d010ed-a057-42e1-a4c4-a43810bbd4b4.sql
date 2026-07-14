-- Create NGOs table
CREATE TABLE IF NOT EXISTS public.ngos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create NGO members table (tracks who belongs to which NGO and their role)
CREATE TABLE IF NOT EXISTS public.ngo_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES public.ngos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ngo_id, user_id)
);

-- Add NGO relationship to businesses
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS ngo_id UUID REFERENCES public.ngos(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngo_members ENABLE ROW LEVEL SECURITY;

-- Add triggers for updated_at
CREATE TRIGGER update_ngos_updated_at
BEFORE UPDATE ON public.ngos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ngo_members_updated_at
BEFORE UPDATE ON public.ngo_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();