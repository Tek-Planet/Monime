
CREATE TABLE public.app_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL CHECK (platform IN ('android','ios')),
  latest_version text NOT NULL,
  min_version text NOT NULL,
  release_notes text,
  android_package_id text,
  ios_app_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform)
);

GRANT SELECT ON public.app_versions TO anon;
GRANT SELECT ON public.app_versions TO authenticated;
GRANT ALL ON public.app_versions TO service_role;

ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app versions"
ON public.app_versions FOR SELECT
USING (true);

CREATE POLICY "System admins can manage app versions"
ON public.app_versions FOR ALL
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE TRIGGER update_app_versions_updated_at
BEFORE UPDATE ON public.app_versions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_versions (platform, latest_version, min_version, release_notes, android_package_id, ios_app_id)
VALUES
  ('android', '1.0.0', '1.0.0', 'Initial release', 'com.tekplanet.mibuks', NULL),
  ('ios', '1.0.0', '1.0.0', 'Initial release', NULL, NULL);
