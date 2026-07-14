import { useState, useEffect, useRef, useCallback } from "react";
import { usePinLock } from "@/contexts/PinLockContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { Button } from "@/components/ui/button";
import { Lock, LogOut, AlertTriangle, Delete, Fingerprint } from "lucide-react";
import logo from "@/assets/logo.png";

export function PinLockScreen() {
  const { isLocked, verifyPin, failedAttempts, maxAttempts, loading, biometricEnabled, unlock } = usePinLock();
  const { signOut, user } = useAuth();
  const { t } = useLanguage();
  const { isAvailable: biometricAvailable, biometryType, authenticate } = useBiometricAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const canUseBiometric = biometricEnabled && biometricAvailable;

  const handleBiometricUnlock = useCallback(async () => {
    if (!canUseBiometric || verifying) return;
    setVerifying(true);
    const success = await authenticate(`Unlock MiBuks`);
    if (success) {
      unlock();
    }
    setVerifying(false);
  }, [canUseBiometric, verifying, authenticate, unlock]);

  // Auto-trigger biometric on mount
  useEffect(() => {
    if (isLocked && canUseBiometric) {
      // Small delay to let the screen render first
      const timer = setTimeout(() => handleBiometricUnlock(), 300);
      return () => clearTimeout(timer);
    }
  }, [isLocked, canUseBiometric]); // intentionally not including handleBiometricUnlock to avoid re-triggers

  // Reset pin when screen shows
  useEffect(() => {
    if (isLocked) {
      setPin("");
      setError(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isLocked]);

  if (!isLocked || loading || !user) return null;

  const handleDigitPress = async (digit: string) => {
    if (verifying) return;
    const newPin = pin + digit;
    setError(false);

    if (newPin.length <= 4) {
      setPin(newPin);
    }

    if (newPin.length === 4) {
      setVerifying(true);
      const success = await verifyPin(newPin);
      if (!success) {
        setError(true);
        setPin("");
        if (navigator.vibrate) navigator.vibrate(200);
      }
      setVerifying(false);
    }
  };

  const handleDelete = () => {
    if (verifying) return;
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleForgotPin = async () => {
    await signOut();
  };

  const remainingAttempts = maxAttempts - failedAttempts;

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-6">
        <img src={logo} alt="MiBuks" className="h-12 w-auto" />
      </div>

      {/* Lock Icon */}
      <div className="mb-4 p-4 rounded-full bg-primary/10">
        <Lock className="h-8 w-8 text-primary" />
      </div>

      {/* Title */}
      <h1 className="text-xl font-semibold text-foreground mb-1">{t("pin.enterYourPin")}</h1>
      <p className="text-sm text-muted-foreground mb-8">
        {user?.email}
      </p>

      {/* PIN Dots */}
      <div className="flex gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
              pin.length > i
                ? error
                  ? "bg-destructive border-destructive scale-110"
                  : "bg-primary border-primary scale-110"
                : "border-muted-foreground/40"
            } ${error && pin.length === 0 ? "animate-shake border-destructive" : ""}`}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm mb-4 animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <span>
            {t("pin.incorrectPin")} {remainingAttempts} {remainingAttempts === 1 ? t("pin.attemptsRemaining") : t("pin.attemptsRemainingPlural")}
          </span>
        </div>
      )}

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-3 mb-4 max-w-[280px] w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleDigitPress(String(num))}
            disabled={verifying}
            className="h-16 w-full rounded-xl bg-muted/50 hover:bg-muted text-xl font-semibold text-foreground transition-all active:scale-95 disabled:opacity-50"
          >
            {num}
          </button>
        ))}
        {/* Biometric button or empty space */}
        {canUseBiometric ? (
          <button
            onClick={handleBiometricUnlock}
            disabled={verifying}
            className="h-16 w-full rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
            title={`Use ${biometryType}`}
          >
            <Fingerprint className="h-6 w-6 text-primary" />
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={() => handleDigitPress("0")}
          disabled={verifying}
          className="h-16 w-full rounded-xl bg-muted/50 hover:bg-muted text-xl font-semibold text-foreground transition-all active:scale-95 disabled:opacity-50"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          disabled={verifying || pin.length === 0}
          className="h-16 w-full rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
        >
          <Delete className="h-6 w-6 text-foreground" />
        </button>
      </div>

      {/* Biometric hint */}
      {canUseBiometric && (
        <p className="text-xs text-muted-foreground mb-4">
          {t("pin.tapToUseBiometric").replace("{icon}", "").replace("{type}", biometryType)} <Fingerprint className="inline h-3.5 w-3.5" />
        </p>
      )}

      {/* Forgot PIN / Sign Out */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleForgotPin}
        className="text-muted-foreground hover:text-foreground gap-2"
      >
        <LogOut className="h-4 w-4" />
        {t("pin.forgotPinSignOut")}
      </Button>
    </div>
  );
}
