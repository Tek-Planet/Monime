-- Create function to prevent organization members from creating businesses
CREATE OR REPLACE FUNCTION public.prevent_member_business_creation()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = NEW.owner_id 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Organization members cannot create businesses. Please contact your organization owner.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to check before business insert
CREATE TRIGGER check_member_before_business_insert
BEFORE INSERT ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.prevent_member_business_creation();