-- Add index on profiles.email for efficient user lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);