import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Crown, Check, Loader2, Tag, CreditCard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTH_OPTIONS = [1, 3, 6, 12];
const PRICE_PER_MONTH_USD = 2;
const NGN_RATE = 1600;
const SLE_RATE = 23;

type PaymentCurrency = "USD" | "NGN" | "SLE";

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [months, setMonths] = useState(1);
  const [currency, setCurrency] = useState<PaymentCurrency>("NGN");
  const [promoCode, setPromoCode] = useState("");
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState("");
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPromo, setLoadingPromo] = useState(false);
  const [showPromo, setShowPromo] = useState(false);

  const usdTotal = months * PRICE_PER_MONTH_USD;
  const rate = currency === "NGN" ? NGN_RATE : currency === "SLE" ? SLE_RATE : 1;
  const totalPrice = usdTotal * rate;
  const currencySymbol = currency === "NGN" ? "₦" : currency === "SLE" ? "Le " : "$";
  const isMonimeCurrency = currency === "SLE";

  const prepareMonimePayload = (reference: string) => ({
    amount: Math.round(totalPrice * 100) / 100,
    currency,
    months,
    phone_number: mobileMoneyPhone.trim(),
    source: "upgrade-modal",
    user_id: user?.id ?? null,
    reference: reference,
    reference_number: reference,
    success_url: `${window.location.origin}/?subscription=monime_success&ref=${reference}`,
    cancel_url: `${window.location.origin}/?subscription=monime_cancel&ref=${reference}`,
  });

  const handleCheckout = async () => {
    if (!user) return;

    if (isMonimeCurrency) {
      const phoneNumber = mobileMoneyPhone.trim();
      if (!phoneNumber) {
        toast({
          title: "Mobile money number required",
          description: "Please enter a valid Orange Money or Afrimoney phone number.",
          variant: "destructive",
        });
        return;
      }

      setLoadingCheckout(true);
      try {
        const reference = `sub_monime_${user.id}_${Date.now()}`;
        const monimePayload = prepareMonimePayload(reference);
        const { data, error } = await supabase.functions.invoke("monime-checkout", {
          body: monimePayload,
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        if (data?.checkout_url) {
          window.open(data.checkout_url, "_blank", "noopener,noreferrer");
        }

        toast({
          title: "Monime checkout ready",
          description: data?.message || "Complete the payment in the new tab.",
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unable to start Monime checkout.";
        toast({
          title: "Monime checkout failed",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoadingCheckout(false);
      }
      return;
    }

    setLoadingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { months, currency },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to start checkout.";
      toast({
        title: t("subscription.checkoutError"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim() || !user) return;
    setLoadingPromo(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-promo-code", {
        body: { code: promoCode.trim().toUpperCase() },
      });
      if (error) throw error;
      if (data?.success) {
        toast({
          title: t("subscription.promoSuccess"),
          description: `${t("subscription.promoApplied")} ${data.days_granted} ${t("subscription.days")}`,
        });
        onOpenChange(false);
        window.location.reload();
      } else {
        toast({
          title: t("subscription.promoError"),
          description: data?.error || t("subscription.invalidCode"),
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to redeem promo code.";
      toast({
        title: t("subscription.promoError"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingPromo(false);
    }
  };

  const premiumFeatures = [
    t("subscription.featureSuppliers"),
    t("subscription.featureExpenses"),
    t("subscription.featureReports"),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            {t("subscription.upgradeToPremium")}
          </DialogTitle>
          <DialogDescription>
            {t("subscription.upgradeDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="font-medium text-sm">{t("subscription.premiumIncludes")}</p>
            {premiumFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{t("subscription.selectDuration")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {MONTH_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={`rounded-lg border-2 p-3 text-center transition-colors ${
                    months === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-lg font-bold">{m}</div>
                  <div className="text-xs text-muted-foreground">
                    {m === 1 ? t("subscription.month") : t("subscription.months")}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("subscription.currency")}</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["NGN", "SLE", "USD"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`rounded-lg border-2 p-2 text-center transition-colors ${
                    currency === c
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-sm font-semibold">
                    {c === "NGN" ? `₦ ${t("subscription.naira")}` : c === "SLE" ? `Le ${c}` : `$ ${t("subscription.usd")}`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {isMonimeCurrency ? (
            <div className="space-y-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
              <Label htmlFor="mobile-money-phone">Mobile Money (Orange & Afrimoney)</Label>
              <Input
                id="mobile-money-phone"
                type="tel"
                inputMode="tel"
                value={mobileMoneyPhone}
                onChange={(e) => setMobileMoneyPhone(e.target.value)}
                placeholder="Enter phone number"
                className="h-12 text-base"
              />
              <p className="text-xs text-muted-foreground">
                This prepares a secure Monime payload for our backend checkout function.
              </p>
            </div>
          ) : null}

          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <span className="font-medium">{t("subscription.total")}</span>
            <div className="text-right">
              <span className="text-2xl font-bold">
                {currencySymbol}{totalPrice.toLocaleString()}
              </span>
              <Badge variant="secondary" className="ml-2">
                {currencySymbol}{(PRICE_PER_MONTH_USD * rate).toLocaleString()}/{t("subscription.mo")}
              </Badge>
            </div>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loadingCheckout}
            className="w-full"
            size="lg"
          >
            {loadingCheckout ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            {isMonimeCurrency ? "Continue with Mobile Money" : t("subscription.makePayment")}
          </Button>

          <Separator />

          {!showPromo ? (
            <button
              onClick={() => setShowPromo(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
            >
              <Tag className="h-4 w-4" />
              {t("subscription.havePromoCode")}
            </button>
          ) : (
            <div className="space-y-2">
              <Label>{t("subscription.promoCode")}</Label>
              <div className="flex gap-2">
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="PROMO2024"
                  className="uppercase"
                />
                <Button
                  onClick={handleRedeemPromo}
                  disabled={loadingPromo || !promoCode.trim()}
                  variant="outline"
                >
                  {loadingPromo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("subscription.redeem")
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
