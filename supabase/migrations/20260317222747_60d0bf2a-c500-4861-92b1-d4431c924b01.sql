
-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'free_trial',
  plan_type TEXT NOT NULL DEFAULT 'free_trial',
  trial_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trial_end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '3 months'),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (is_system_admin(auth.uid()));

CREATE POLICY "System admins can update all subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (is_system_admin(auth.uid()));

-- Business members can view their owner's subscription
CREATE POLICY "Business members can view owner subscription"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.businesses b ON b.id = om.business_id
      WHERE om.user_id = auth.uid()
        AND om.is_active = true
        AND b.owner_id = subscriptions.user_id
    )
  );

-- Promo codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 30,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage promo codes"
  ON public.promo_codes FOR ALL
  USING (is_system_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active promo codes by code"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Promo code redemptions table
CREATE TABLE public.promo_code_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  access_granted_until TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(promo_code_id, user_id)
);

ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own redemptions"
  ON public.promo_code_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own redemptions"
  ON public.promo_code_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System admins can view all redemptions"
  ON public.promo_code_redemptions FOR SELECT
  USING (is_system_admin(auth.uid()));

-- Trigger to auto-create subscription on profile creation
CREATE OR REPLACE FUNCTION public.create_subscription_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, status, plan_type, trial_start_date, trial_end_date)
  VALUES (NEW.user_id, 'free_trial', 'free_trial', now(), now() + interval '3 months')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_create_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_subscription_on_signup();

-- Function to check if a user has premium access
CREATE OR REPLACE FUNCTION public.has_premium_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
    AND (
      -- Active paid subscription
      (status = 'active' AND current_period_end > now())
      OR
      -- Still in free trial
      (status = 'free_trial' AND trial_end_date > now())
    )
  )
  OR EXISTS (
    -- Has active promo code redemption
    SELECT 1 FROM public.promo_code_redemptions
    WHERE user_id = _user_id
    AND access_granted_until > now()
  )
  OR
  -- Is system admin or NGO admin
  is_system_admin(_user_id)
  OR EXISTS (
    SELECT 1 FROM public.ngo_members
    WHERE user_id = _user_id AND is_active = true AND role = 'admin'
  );
$$;

-- Update timestamps trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
