
-- New signups start locked instead of getting a 3-month free trial
CREATE OR REPLACE FUNCTION public.create_subscription_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.subscriptions (user_id, status, plan_type, trial_start_date, trial_end_date)
  VALUES (NEW.user_id, 'locked', 'locked', now(), now())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Lock all current free-trial accounts so the new policy applies to everyone
UPDATE public.subscriptions
SET status = 'locked', plan_type = 'locked'
WHERE status = 'free_trial';
