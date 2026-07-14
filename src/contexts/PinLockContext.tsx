import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface PinLockContextType {
  isLocked: boolean;
  pinEnabled: boolean;
  pinLockMode: "every_open" | "idle_timeout";
  pinIdleTimeout: number;
  failedAttempts: number;
  maxAttempts: number;
  biometricEnabled: boolean;
  verifyPin: (pin: string) => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  removePin: () => Promise<void>;
  updateLockMode: (mode: "every_open" | "idle_timeout") => Promise<void>;
  updateIdleTimeout: (minutes: number) => Promise<void>;
  updateBiometricEnabled: (enabled: boolean) => Promise<void>;
  unlock: () => void;
  loading: boolean;
}

const PinLockContext = createContext<PinLockContextType | undefined>(undefined);

const MAX_ATTEMPTS = 5;

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function PinLockProvider({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [pinLockMode, setPinLockMode] = useState<"every_open" | "idle_timeout">("every_open");
  const [pinIdleTimeout, setPinIdleTimeout] = useState(5);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLockedOnMount = useRef(false);

  // Fetch PIN settings from profile
  useEffect(() => {
    const fetchPinSettings = async () => {
      if (!user) {
        setPinEnabled(false);
        setPinHash(null);
        setIsLocked(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("pin_hash, pin_enabled, pin_lock_mode, pin_idle_timeout, biometric_enabled")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching PIN settings:", error);
          setLoading(false);
          return;
        }

        if (data) {
          const enabled = data.pin_enabled ?? false;
          setPinEnabled(enabled);
          setPinHash(data.pin_hash ?? null);
          setPinLockMode((data.pin_lock_mode as "every_open" | "idle_timeout") ?? "every_open");
          setPinIdleTimeout(data.pin_idle_timeout ?? 5);
          setBiometricEnabled(data.biometric_enabled ?? false);

          // Lock on mount if PIN is enabled and mode is "every_open"
          if (enabled && data.pin_hash && !hasLockedOnMount.current) {
            if ((data.pin_lock_mode ?? "every_open") === "every_open") {
              setIsLocked(true);
            }
            hasLockedOnMount.current = true;
          }
        }
      } catch (err) {
        console.error("PIN settings fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPinSettings();
  }, [user]);

  // Visibility change handler (app backgrounding)
  useEffect(() => {
    if (!pinEnabled || !pinHash || !user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // App went to background — start idle timer if in idle mode
        if (pinLockMode === "idle_timeout") {
          idleTimerRef.current = setTimeout(() => {
            setIsLocked(true);
          }, pinIdleTimeout * 60 * 1000);
        } else {
          // every_open mode: lock immediately when hidden
          setIsLocked(true);
        }
      } else if (document.visibilityState === "visible") {
        // App came back — clear idle timer if it hasn't fired
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
          idleTimerRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [pinEnabled, pinHash, pinLockMode, pinIdleTimeout, user]);

  // Idle activity tracking for idle_timeout mode
  useEffect(() => {
    if (!pinEnabled || !pinHash || !user || pinLockMode !== "idle_timeout" || isLocked) return;

    let idleTimer: ReturnType<typeof setTimeout>;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsLocked(true);
      }, pinIdleTimeout * 60 * 1000);
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => document.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach((e) => document.removeEventListener(e, resetIdleTimer));
    };
  }, [pinEnabled, pinHash, pinLockMode, pinIdleTimeout, user, isLocked]);

  const verifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!pinHash) return false;
      const hash = await hashPin(pin);
      if (hash === pinHash) {
        setFailedAttempts(0);
        setIsLocked(false);
        return true;
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          // Force logout
          await signOut();
          setIsLocked(false);
          setFailedAttempts(0);
        }
        return false;
      }
    },
    [pinHash, failedAttempts, signOut]
  );

  const setupPin = useCallback(
    async (pin: string) => {
      if (!user) return;
      const hash = await hashPin(pin);
      const { error } = await supabase
        .from("profiles")
        .update({ pin_hash: hash, pin_enabled: true })
        .eq("user_id", user.id);

      if (error) throw error;
      setPinHash(hash);
      setPinEnabled(true);
      hasLockedOnMount.current = true; // Don't lock immediately after setup
    },
    [user]
  );

  const changePin = useCallback(
    async (oldPin: string, newPin: string): Promise<boolean> => {
      if (!pinHash) return false;
      const oldHash = await hashPin(oldPin);
      if (oldHash !== pinHash) return false;

      const newHash = await hashPin(newPin);
      const { error } = await supabase
        .from("profiles")
        .update({ pin_hash: newHash })
        .eq("user_id", user!.id);

      if (error) throw error;
      setPinHash(newHash);
      return true;
    },
    [pinHash, user]
  );

  const removePin = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ pin_hash: null, pin_enabled: false })
      .eq("user_id", user.id);

    if (error) throw error;
    setPinHash(null);
    setPinEnabled(false);
    setIsLocked(false);
  }, [user]);

  const updateLockMode = useCallback(
    async (mode: "every_open" | "idle_timeout") => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ pin_lock_mode: mode })
        .eq("user_id", user.id);

      if (error) throw error;
      setPinLockMode(mode);
    },
    [user]
  );

  const updateIdleTimeout = useCallback(
    async (minutes: number) => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ pin_idle_timeout: minutes })
        .eq("user_id", user.id);

      if (error) throw error;
      setPinIdleTimeout(minutes);
    },
    [user]
  );

  const updateBiometricEnabled = useCallback(
    async (enabled: boolean) => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ biometric_enabled: enabled })
        .eq("user_id", user.id);

      if (error) throw error;
      setBiometricEnabled(enabled);
    },
    [user]
  );

  const unlock = useCallback(() => {
    setIsLocked(false);
    setFailedAttempts(0);
  }, []);

  const value: PinLockContextType = {
    isLocked,
    pinEnabled,
    pinLockMode,
    pinIdleTimeout,
    failedAttempts,
    maxAttempts: MAX_ATTEMPTS,
    biometricEnabled,
    verifyPin,
    setupPin,
    changePin,
    removePin,
    updateLockMode,
    updateIdleTimeout,
    updateBiometricEnabled,
    unlock,
    loading,
  };

  return <PinLockContext.Provider value={value}>{children}</PinLockContext.Provider>;
}

export function usePinLock() {
  const context = useContext(PinLockContext);
  if (context === undefined) {
    throw new Error("usePinLock must be used within a PinLockProvider");
  }
  return context;
}
