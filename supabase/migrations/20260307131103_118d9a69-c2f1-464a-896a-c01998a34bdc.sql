-- Drop the trigger first (correct name), then the function
DROP TRIGGER IF EXISTS on_invited_user_signup ON auth.users;
DROP FUNCTION IF EXISTS public.handle_invited_user_signup();