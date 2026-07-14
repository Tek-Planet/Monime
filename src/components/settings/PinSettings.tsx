import { useState } from "react";
import { usePinLock } from "@/contexts/PinLockContext";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Smartphone, AlertTriangle, Fingerprint } from "lucide-react";
import { toast } from "sonner";

export function PinSettings() {
  const { t } = useLanguage();
  const {
    pinEnabled,
    pinLockMode,
    pinIdleTimeout,
    biometricEnabled,
    setupPin,
    changePin,
    removePin,
    updateLockMode,
    updateIdleTimeout,
    updateBiometricEnabled,
  } = usePinLock();

  const { isAvailable: biometricAvailable, biometryType } = useBiometricAuth();

  const [showSetup, setShowSetup] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const [setupStep, setSetupStep] = useState<"enter" | "confirm">("enter");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [changeNewPin, setChangeNewPin] = useState("");
  const [saving, setSaving] = useState(false);

  const handleTogglePin = async (enabled: boolean) => {
    if (enabled) {
      setShowSetup(true);
      setSetupStep("enter");
      setNewPin("");
      setConfirmPin("");
    } else {
      try {
        await removePin();
        if (biometricEnabled) await updateBiometricEnabled(false);
        toast.success(t("pin.pinDisabledSuccess"));
      } catch {
        toast.error(t("pin.failedToDisablePin"));
      }
    }
  };

  const handleToggleBiometric = async (enabled: boolean) => {
    try {
      await updateBiometricEnabled(enabled);
      toast.success(enabled ? t("pin.biometricEnabled").replace("{type}", biometryType) : t("pin.biometricDisabled"));
    } catch {
      toast.error(t("pin.failedBiometric"));
    }
  };

  const handleSetupDigit = (digit: string) => {
    if (setupStep === "enter") {
      if (newPin.length < 4) setNewPin((p) => p + digit);
    } else {
      if (confirmPin.length < 4) setConfirmPin((p) => p + digit);
    }
  };

  const handleSetupDelete = () => {
    if (setupStep === "enter") {
      setNewPin((p) => p.slice(0, -1));
    } else {
      setConfirmPin((p) => p.slice(0, -1));
    }
  };

  const handleSetupSubmit = async () => {
    if (setupStep === "enter") {
      if (newPin.length === 4) setSetupStep("confirm");
      return;
    }

    if (confirmPin !== newPin) {
      toast.error(t("pin.pinsDontMatch"));
      setConfirmPin("");
      return;
    }

    setSaving(true);
    try {
      await setupPin(newPin);
      toast.success(t("pin.pinEnabledSuccess"));
      setShowSetup(false);
      setNewPin("");
      setConfirmPin("");
    } catch {
      toast.error(t("pin.failedToSetPin"));
    } finally {
      setSaving(false);
    }
  };

  const handleChangeDigit = (digit: string, field: "old" | "new") => {
    if (field === "old" && oldPin.length < 4) setOldPin((p) => p + digit);
    if (field === "new" && changeNewPin.length < 4) setChangeNewPin((p) => p + digit);
  };

  const handleChangeSubmit = async () => {
    if (oldPin.length !== 4 || changeNewPin.length !== 4) return;
    setSaving(true);
    try {
      const success = await changePin(oldPin, changeNewPin);
      if (success) {
        toast.success(t("pin.pinChangedSuccess"));
        setShowChange(false);
        setOldPin("");
        setChangeNewPin("");
      } else {
        toast.error(t("pin.currentPinIncorrect"));
        setOldPin("");
      }
    } catch {
      toast.error(t("pin.failedToChangePin"));
    } finally {
      setSaving(false);
    }
  };

  const MiniPad = ({
    value,
    onDigit,
    onDelete,
  }: {
    value: string;
    onDigit: (d: string) => void;
    onDelete: () => void;
  }) => (
    <div className="space-y-3">
      <div className="flex gap-3 justify-center">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-2 transition-all ${
              value.length > i ? "bg-primary border-primary" : "border-muted-foreground/40"
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => onDigit(String(num))}
            className="h-11 rounded-lg bg-muted/50 hover:bg-muted text-sm font-semibold text-foreground transition-all active:scale-95"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          onClick={() => onDigit("0")}
          className="h-11 rounded-lg bg-muted/50 hover:bg-muted text-sm font-semibold text-foreground transition-all active:scale-95"
        >
          0
        </button>
        <button
          onClick={onDelete}
          disabled={value.length === 0}
          className="h-11 rounded-lg bg-muted/50 hover:bg-muted text-xs text-foreground transition-all active:scale-95 disabled:opacity-30"
        >
          ←
        </button>
      </div>
    </div>
  );

  return (
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Smartphone className="h-5 w-5" />
          {t("pin.appLock")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Enable/Disable Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Label htmlFor="pin-toggle">{t("pin.enablePinLock")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("pin.requirePin")}
            </p>
          </div>
          <Switch
            id="pin-toggle"
            checked={pinEnabled}
            onCheckedChange={handleTogglePin}
          />
        </div>

        {/* Setup PIN Flow */}
        {showSetup && !pinEnabled && (
          <>
            <Separator />
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {setupStep === "enter" ? t("pin.createYourPin") : t("pin.confirmYourPin")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {setupStep === "enter"
                  ? t("pin.choose4Digit")
                  : t("pin.enterSamePin")}
              </p>
              <MiniPad
                value={setupStep === "enter" ? newPin : confirmPin}
                onDigit={handleSetupDigit}
                onDelete={handleSetupDelete}
              />
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSetup(false);
                    setNewPin("");
                    setConfirmPin("");
                    setSetupStep("enter");
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSetupSubmit}
                  disabled={
                    saving ||
                    (setupStep === "enter" && newPin.length !== 4) ||
                    (setupStep === "confirm" && confirmPin.length !== 4)
                  }
                >
                  {saving ? t("common.saving") : setupStep === "enter" ? t("pin.next") : t("pin.confirm")}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* PIN Settings (when enabled) */}
        {pinEnabled && (
          <>
            <Separator />

            {/* Biometric Toggle - only show on native devices that support it */}
            {biometricAvailable && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <Label htmlFor="biometric-toggle" className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-primary" />
                    {t("pin.unlockWith").replace("{type}", biometryType)}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("pin.useInsteadOfPin").replace("{type}", biometryType)}
                  </p>
                </div>
                <Switch
                  id="biometric-toggle"
                  checked={biometricEnabled}
                  onCheckedChange={handleToggleBiometric}
                />
              </div>
            )}

            {/* Lock Mode */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <Label>{t("pin.lockMode")}</Label>
                <p className="text-sm text-muted-foreground">{t("pin.whenToRequirePin")}</p>
              </div>
              <Select
                value={pinLockMode}
                onValueChange={(v) => updateLockMode(v as "every_open" | "idle_timeout")}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="every_open">{t("pin.everyAppOpen")}</SelectItem>
                  <SelectItem value="idle_timeout">{t("pin.afterInactivity")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Idle Timeout */}
            {pinLockMode === "idle_timeout" && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <Label>{t("pin.idleTimeout")}</Label>
                  <p className="text-sm text-muted-foreground">{t("pin.lockAfterMinutes")}</p>
                </div>
                <Select
                  value={String(pinIdleTimeout)}
                  onValueChange={(v) => updateIdleTimeout(Number(v))}
                >
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 {t("pin.min")}</SelectItem>
                    <SelectItem value="2">2 {t("pin.min")}</SelectItem>
                    <SelectItem value="5">5 {t("pin.min")}</SelectItem>
                    <SelectItem value="10">10 {t("pin.min")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* Change PIN */}
            {!showChange ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChange(true)}
                  className="gap-2"
                >
                  <Lock className="h-4 w-4" />
                  {t("pin.changePin")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <span className="font-medium text-sm">{t("pin.enterCurrentPin")}</span>
                <MiniPad
                  value={oldPin}
                  onDigit={(d) => handleChangeDigit(d, "old")}
                  onDelete={() => setOldPin((p) => p.slice(0, -1))}
                />
                {oldPin.length === 4 && (
                  <>
                    <span className="font-medium text-sm">{t("pin.enterNewPin")}</span>
                    <MiniPad
                      value={changeNewPin}
                      onDigit={(d) => handleChangeDigit(d, "new")}
                      onDelete={() => setChangeNewPin((p) => p.slice(0, -1))}
                    />
                  </>
                )}
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowChange(false);
                      setOldPin("");
                      setChangeNewPin("");
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleChangeSubmit}
                    disabled={saving || oldPin.length !== 4 || changeNewPin.length !== 4}
                  >
                    {saving ? t("common.saving") : t("pin.saveNewPin")}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {t("pin.securityWarning")}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
