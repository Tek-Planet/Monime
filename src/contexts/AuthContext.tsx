import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, setRememberMe } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  signInWithPhone: (phone: string) => Promise<{ error: any }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: any }>;
  phoneSignUp: (phone: string, password: string) => Promise<{ error: any }>;
  phoneSignIn: (phone: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      // Only clear user on explicit sign-out to prevent race conditions
      // where TOKEN_REFRESHED or INITIAL_SESSION fires with a null session
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      if (session) {
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string, rememberMe = true) => {
    // Set storage preference BEFORE signing in so the session token
    // is persisted in the correct storage.
    setRememberMe(rememberMe);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Don't clear remember-me preference — it's a device-level setting
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=reset`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  // Sends OTP via MSG91 (replaces Twilio-based Supabase phone auth).
  const signInWithPhone = async (phone: string) => {
    const { data, error } = await supabase.functions.invoke("msg91-send-otp", {
      body: { phone },
    });
    if (error) return { error };
    if (data?.error) return { error: { message: data.error } };
    return { error: null };
  };

  // Verifies OTP via MSG91, then signs in with the ephemeral password
  // returned by the edge function.
  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.functions.invoke("msg91-verify-otp", {
      body: { phone, otp: token },
    });
    if (error) return { error };
    if (data?.error) return { error: { message: data.error } };

    const digits = String(phone).replace(/[^\d]/g, "");
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      phone: digits,
      password: data.password,
    });
    return { error: signInErr };
  };

  // Phone signup with password. Uses MSG91 send/verify (bypassed for now) and
  // persists the user's chosen password so they can sign in with it later.
  const phoneSignUp = async (phone: string, password: string) => {
    const digits = String(phone).replace(/[^\d]/g, "");
    const { error: sendErr } = await supabase.functions.invoke("msg91-send-otp", {
      body: { phone: digits },
    });
    if (sendErr) return { error: sendErr };

    const { data, error } = await supabase.functions.invoke("msg91-verify-otp", {
      body: { phone: digits, otp: "000000", password },
    });
    if (error) return { error };
    if (data?.error) return { error: { message: data.error } };

    setRememberMe(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      phone: digits,
      password,
    });
    return { error: signInErr };
  };

  // Phone signin with the password the user set at signup. No OTP round-trip.
  const phoneSignIn = async (phone: string, password: string, rememberMe = true) => {
    const digits = String(phone).replace(/[^\d]/g, "");
    setRememberMe(rememberMe);
    const { error } = await supabase.auth.signInWithPassword({
      phone: digits,
      password,
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    signInWithPhone,
    verifyPhoneOtp,
    phoneSignUp,
    phoneSignIn,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
