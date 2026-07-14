
-- Marketers table
CREATE TABLE public.marketers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  referral_code text UNIQUE NOT NULL,
  commission_rate numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.marketers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage all marketers" ON public.marketers FOR ALL TO public USING (is_system_admin(auth.uid()));
CREATE POLICY "Marketers can view own record" ON public.marketers FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Marketer referrals table
CREATE TABLE public.marketer_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketer_id uuid REFERENCES public.marketers(id) ON DELETE CASCADE NOT NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  commission_amount numeric DEFAULT 0,
  commission_status text DEFAULT 'pending',
  commission_paid_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(marketer_id, business_id)
);

ALTER TABLE public.marketer_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage all referrals" ON public.marketer_referrals FOR ALL TO public USING (is_system_admin(auth.uid()));
CREATE POLICY "Marketers can view own referrals" ON public.marketer_referrals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.marketers m WHERE m.id = marketer_referrals.marketer_id AND m.user_id = auth.uid()));

-- Add referred_by_marketer column to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS referred_by_marketer_id uuid REFERENCES public.marketers(id) ON DELETE SET NULL;

-- Add unique constraint on subscriptions user_id if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_key') THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Allow system admins to manage all subscriptions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System admins can manage all subscriptions' AND tablename = 'subscriptions') THEN
    CREATE POLICY "System admins can manage all subscriptions" ON public.subscriptions FOR ALL TO public USING (is_system_admin(auth.uid()));
  END IF;
END $$;
