import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

// Lazy-import to avoid errors on web
let BiometricAuth: any = null;

async function loadBiometricPlugin() {
  if (BiometricAuth) return BiometricAuth;
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const mod = await import("@aparajita/capacitor-biometric-auth");
    BiometricAuth = mod.BiometricAuth;
    return BiometricAuth;
  } catch {
    return null;
  }
}

export function useBiometricAuth() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string>("none");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const plugin = await loadBiometricPlugin();
      if (!plugin || !mounted) return;
      try {
        const result = await plugin.checkBiometry();
        if (mounted) {
          setIsAvailable(result.isAvailable);
          // biometryType: 1=touchId, 2=faceId, 3=fingerprintAuthentication, 4=faceAuthentication, 5=irisAuthentication
          const typeMap: Record<number, string> = {
            1: "Touch ID",
            2: "Face ID",
            3: "Fingerprint",
            4: "Face Unlock",
            5: "Iris",
          };
          setBiometryType(typeMap[result.biometryType] ?? "Biometrics");
        }
      } catch {
        if (mounted) setIsAvailable(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const authenticate = useCallback(async (reason = "Unlock MiBuks"): Promise<boolean> => {
    const plugin = await loadBiometricPlugin();
    if (!plugin) return false;
    try {
      await plugin.authenticate({ reason, allowDeviceCredential: false });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { isAvailable, biometryType, authenticate };
}
