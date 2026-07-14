-- Create security definer functions for NGO access checks
CREATE OR REPLACE FUNCTION public.is_system_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'system_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_ngo_admin(_user_id uuid, _ngo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ngo_members
    WHERE user_id = _user_id
      AND ngo_id = _ngo_id
      AND role = 'admin'
      AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.user_ngo_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ngo_id
  FROM public.ngo_members
  WHERE user_id = _user_id
    AND is_active = true
  LIMIT 1
$$;

-- RLS Policies for NGOs table
CREATE POLICY "System admins can manage all NGOs"
ON public.ngos
FOR ALL
USING (public.is_system_admin(auth.uid()));

CREATE POLICY "NGO admins can view their NGO"
ON public.ngos
FOR SELECT
USING (
  public.is_ngo_admin(auth.uid(), id) OR
  EXISTS (
    SELECT 1 FROM public.ngo_members
    WHERE ngo_id = ngos.id
      AND user_id = auth.uid()
      AND is_active = true
  )
);

-- RLS Policies for NGO members table
CREATE POLICY "System admins can manage all NGO members"
ON public.ngo_members
FOR ALL
USING (public.is_system_admin(auth.uid()));

CREATE POLICY "NGO admins can manage their NGO members"
ON public.ngo_members
FOR ALL
USING (public.is_ngo_admin(auth.uid(), ngo_id));

CREATE POLICY "Members can view their own membership"
ON public.ngo_members
FOR SELECT
USING (user_id = auth.uid());