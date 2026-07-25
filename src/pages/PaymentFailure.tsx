import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XCircle, LayoutDashboard, RefreshCw, HelpCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const ref = searchParams.get("ref") || searchParams.get("tx_ref");
  const reason = searchParams.get("reason") || searchParams.get("status");

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-rose-500/30 shadow-lg relative overflow-hidden bg-gradient-to-b from-background to-rose-50/20 dark:to-rose-950/10">
        {/* Top subtle decorative banner */}
        <div className="h-2 w-full bg-gradient-to-r from-rose-500 via-red-400 to-amber-500" />

        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto mb-4 relative flex items-center justify-center">
            <div className="relative bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 p-4 rounded-full shadow-inner border border-rose-200 dark:border-rose-800">
              <XCircle className="h-12 w-12 text-rose-600 dark:text-rose-400" />
            </div>
          </div>

          <Badge className="mx-auto mb-2 bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 px-3 py-1 font-medium">
            <AlertTriangle className="h-3.5 w-3.5 mr-1 text-rose-500" />
            Payment Incomplete
          </Badge>

          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {reason === "cancelled" ? "Payment Cancelled" : "Payment Unsuccessful"}
          </CardTitle>

          <CardDescription className="text-base text-muted-foreground mt-2 max-w-md mx-auto">
            {reason === "cancelled"
              ? "The checkout process was cancelled before completion. No charges were made to your account."
              : "We could not complete your payment transaction. Please check your payment details or try a different payment method."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6">
          {ref && (
            <div className="bg-muted/40 rounded-xl p-4 border border-border/60 text-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Reference ID</span>
                <span className="font-mono text-xs text-foreground font-medium truncate max-w-[200px]" title={ref}>
                  {ref}
                </span>
              </div>
            </div>
          )}

          <div className="bg-rose-500/5 dark:bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 text-xs sm:text-sm text-rose-800 dark:text-rose-200 space-y-1">
            <p className="font-semibold flex items-center">
              Need assistance?
            </p>
            <p className="text-muted-foreground text-xs">
              If money was deducted from your account, please contact support with your reference ID for immediate help.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2 pb-6 px-6">
          <Button
            onClick={() => navigate("/settings")}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Payment Again
          </Button>

          <Button
            onClick={() => navigate("/")}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            {t("nav.dashboard") || "Go to Dashboard"}
          </Button>

          <Button
            onClick={() => navigate("/support")}
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Support
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
