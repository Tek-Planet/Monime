
-- Backfill subscriptions for existing users who don't have one
INSERT INTO public.subscriptions (user_id, status, plan_type, trial_start_date, trial_end_date)
SELECT p.user_id, 
  CASE 
    WHEN p.created_at < now() - interval '3 months' THEN 'expired'
    ELSE 'free_trial'
  END,
  'free_trial',
  p.created_at,
  p.created_at + interval '3 months'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.user_id
);
