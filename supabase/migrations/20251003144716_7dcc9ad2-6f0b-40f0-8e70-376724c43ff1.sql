-- Function to handle invited user signup
CREATE OR REPLACE FUNCTION public.handle_invited_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  invitation_rec RECORD;
BEGIN
  -- Check if there's a pending invitation for this email
  SELECT id, business_id, accessible_pages, invited_by
  INTO invitation_rec
  FROM public.organization_invitations
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;

  IF FOUND THEN
    -- Add user to organization_members
    INSERT INTO public.organization_members (
      business_id,
      user_id,
      email,
      accessible_pages,
      invited_by,
      role
    ) VALUES (
      invitation_rec.business_id,
      NEW.id,
      NEW.email,
      invitation_rec.accessible_pages,
      invitation_rec.invited_by,
      'member'
    );

    -- Mark invitation as accepted
    UPDATE public.organization_invitations
    SET status = 'accepted'
    WHERE id = invitation_rec.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger that fires after a user signs up
CREATE TRIGGER on_invited_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invited_user_signup();