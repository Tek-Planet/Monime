CREATE OR REPLACE FUNCTION public.link_business_to_marketer(_business_id uuid, _referral_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _marketer_id uuid;
  _owner uuid;
BEGIN
  SELECT owner_id INTO _owner FROM public.businesses WHERE id = _business_id;
  IF _owner IS NULL OR _owner <> auth.uid() THEN
    RETURN false;
  END IF;

  SELECT id INTO _marketer_id
  FROM public.marketers
  WHERE referral_code = _referral_code AND is_active = true
  LIMIT 1;

  IF _marketer_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.businesses
  SET referred_by_marketer_id = _marketer_id
  WHERE id = _business_id;

  INSERT INTO public.marketer_referrals (marketer_id, business_id)
  VALUES (_marketer_id, _business_id)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_business_to_marketer(uuid, text) TO authenticated;

-- Backfill the recent business that used MKT-YLZC48
DO $$
DECLARE
  _mid uuid;
BEGIN
  SELECT id INTO _mid FROM public.marketers WHERE referral_code = 'MKT-YLZC48' AND is_active = true;
  IF _mid IS NOT NULL THEN
    UPDATE public.businesses
    SET referred_by_marketer_id = _mid
    WHERE id = '28e30665-da08-4701-ada3-fa14838ecf1e' AND referred_by_marketer_id IS NULL;

    INSERT INTO public.marketer_referrals (marketer_id, business_id)
    VALUES (_mid, '28e30665-da08-4701-ada3-fa14838ecf1e')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;