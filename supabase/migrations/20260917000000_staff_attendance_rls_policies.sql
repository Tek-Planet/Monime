-- Create staff_attendance table if it does not exist
CREATE TABLE IF NOT EXISTS public.staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    branch_id UUID,
    user_id UUID NOT NULL,
    staff_name TEXT NOT NULL,
    staff_email TEXT,
    staff_role TEXT DEFAULT 'staff',
    clock_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    clock_out_time TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'on_duty',
    clock_in_device_info TEXT,
    clock_out_notes TEXT,
    total_minutes INTEGER,
    break_start_time TIMESTAMP WITH TIME ZONE,
    break_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_staff_attendance_business_id ON public.staff_attendance(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_user_id ON public.staff_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_clock_in_time ON public.staff_attendance(clock_in_time DESC);

-- Select policy: User themselves, business members, and business owners can view attendance
DROP POLICY IF EXISTS "Users and business members can view staff attendance" ON public.staff_attendance;
CREATE POLICY "Users and business members can view staff attendance"
ON public.staff_attendance FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR is_business_member(auth.uid(), business_id)
  OR EXISTS (SELECT 1 FROM businesses WHERE id = staff_attendance.business_id AND owner_id = auth.uid())
  OR is_system_admin(auth.uid())
);

-- Insert policy: User themselves, business members, and business owners can insert attendance records
DROP POLICY IF EXISTS "Users can clock in attendance" ON public.staff_attendance;
CREATE POLICY "Users can clock in attendance"
ON public.staff_attendance FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR is_business_member(auth.uid(), business_id)
  OR EXISTS (SELECT 1 FROM businesses WHERE id = staff_attendance.business_id AND owner_id = auth.uid())
  OR is_system_admin(auth.uid())
);

-- Update policy: User themselves, business members, and business owners can update attendance
DROP POLICY IF EXISTS "Users can update staff attendance" ON public.staff_attendance;
CREATE POLICY "Users can update staff attendance"
ON public.staff_attendance FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR is_business_member(auth.uid(), business_id)
  OR EXISTS (SELECT 1 FROM businesses WHERE id = staff_attendance.business_id AND owner_id = auth.uid())
  OR is_system_admin(auth.uid())
);

-- Delete policy: Business owners and admins can delete attendance
DROP POLICY IF EXISTS "Business owners can delete staff attendance" ON public.staff_attendance;
CREATE POLICY "Business owners can delete staff attendance"
ON public.staff_attendance FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = staff_attendance.business_id AND owner_id = auth.uid())
  OR is_system_admin(auth.uid())
);
