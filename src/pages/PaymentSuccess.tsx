import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Crown, ArrowRight, LayoutDashboard, Settings, Loader2, Sparkles, Pause, Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const transactionId = searchParams.get("transaction_id");
  const txRef = searchParams.get("tx_ref") || searchParams.get("ref");
  const subType = searchParams.get("subscription");
  const status = searchParams.get("status");
  const isInvoicePayment = searchParams.get("type") === "invoice" || searchParams.get("payment") === "monime_success";

  const [verifying, setVerifying] = useState(Boolean(transactionId && subType === "verify"));
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [isPaused, setIsPaused] = useState(false);

  // Handle Flutterwave verification if transaction_id is present
  useEffect(() => {
    if (transactionId && subType === "verify" && status !== "cancelled") {
      let isMounted = true;
      (async () => {
        try {
          setVerifying(true);
          const { data, error } = await supabase.functions.invoke("verify-flutterwave-payment", {
            body: { transaction_id: transactionId, tx_ref: txRef },
          });

          if (error) throw error;
          if (data?.success) {
            if (isMounted) {
              queryClient.invalidateQueries({ queryKey: ["subscription"] });
              setVerifying(false);
            }
          } else {
            if (isMounted) {
              setVerifyError(data?.error || "Payment verification could not be confirmed.");
              setVerifying(false);
            }
          }
        } catch (err: unknown) {
          if (isMounted) {
            const msg = err instanceof Error ? err.message : "Payment verification failed.";
            setVerifyError(msg);
            setVerifying(false);
          }
        }
      })();

      return () => {
        isMounted = false;
      };
    } else {
      // For Monime or general success redirects, invalidate queries right away
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    }
  }, [transactionId, txRef, subType, status, queryClient]);

  // Countdown timer for automatic redirect to dashboard
  useEffect(() => {
    if (verifying || verifyError || isPaused) return;

    if (countdown <= 0) {
      navigate("/");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, verifying, verifyError, isPaused, navigate]);

  const progressPercent = ((5 - countdown) / 5) * 100;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-emerald-500/30 shadow-lg relative overflow-hidden bg-gradient-to-b from-background to-emerald-50/20 dark:to-emerald-950/10">
        {/* Top subtle decorative banner */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500" />

        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto mb-4 relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
            <div className="relative bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 p-4 rounded-full shadow-inner border border-emerald-200 dark:border-emerald-800">
              {verifying ? (
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600 dark:text-emerald-400" />
              ) : (
                <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
          </div>

          <Badge className="mx-auto mb-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 px-3 py-1 font-medium">
            <Sparkles className="h-3.5 w-3.5 mr-1 text-emerald-500" />
            {isInvoicePayment ? "Payment Confirmed" : "Subscription Premium Activated"}
          </Badge>

          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {verifying
              ? "Verifying Payment..."
              : isInvoicePayment
              ? "Payment Received Successfully!"
              : "Welcome to Premium!"}
          </CardTitle>

          <CardDescription className="text-base text-muted-foreground mt-2 max-w-md mx-auto">
            {verifying
              ? "Please wait a moment while we confirm your transaction details."
              : verifyError
              ? verifyError
              : isInvoicePayment
              ? "Your payment was processed successfully and your records have been updated."
              : "Thank you for upgrading! Your subscription is now active and all premium features are unlocked."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6">
          {/* Details Box */}
          {!verifying && (
            <div className="bg-muted/40 rounded-xl p-4 border border-border/60 text-sm space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300">
                  <Crown className="h-3 w-3 mr-1 text-amber-500" /> Active
                </Badge>
              </div>

              {txRef && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs text-foreground font-medium truncate max-w-[200px]" title={txRef}>
                    {txRef}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Destination</span>
                <span className="font-medium text-foreground">Dashboard</span>
              </div>
            </div>
          )}

          {/* Auto Redirect Countdown */}
          {!verifying && !verifyError && (
            <div className="space-y-2.5 bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
              <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                <span className="flex items-center text-emerald-800 dark:text-emerald-200">
                  <ArrowRight className="h-4 w-4 mr-1.5 text-emerald-600 animate-pulse" />
                  Redirecting to dashboard in <span className="font-bold px-1 text-emerald-600 dark:text-emerald-400">{countdown}s</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPaused(!isPaused)}
                  className="h-7 text-xs px-2 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                >
                  {isPaused ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
              </div>
              <Progress value={progressPercent} className="h-1.5 bg-emerald-200/50 dark:bg-emerald-950" />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2 pb-6 px-6">
          <Button
            onClick={() => navigate("/")}
            size="lg"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-all group"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            {t("nav.dashboard") || "Go to Dashboard"}
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            onClick={() => navigate("/settings")}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <Settings className="h-4 w-4 mr-2" />
            {t("nav.settings") || "Settings"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
