import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = "https://lgstierfmiezdeqhwyap.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3RpZXJmbWllemRlcWh3eWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTQzMzgsImV4cCI6MjA3MDA5MDMzOH0.4yIqlsfe9N7glx8B2csBv1u9GdwOz1Ob4rLZQQa5ihM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
