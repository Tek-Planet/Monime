import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DollarSign, CreditCard, Save, X } from "lucide-react";
import { useState } from "react";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RecordInvoicePaymentModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentRecorded?: () => void;
}

type PaymentCurrency = "USD" | "SLE";

export function RecordInvoicePaymentModal({ 
  invoice, 
  open, 
  onOpenChange, 
  onPaymentRecorded 
}: RecordInvoicePaymentModalProps) {
  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_method: "cash",
    reference_number: "",
    notes: "",
  });
  const [paymentCurrency, setPaymentCurrency] = useState<PaymentCurrency>("USD");
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const { updateInvoice } = useInvoices();
  const { toast } = useToast();

  const remainingBalance = invoice ? invoice.total_amount - invoice.paid_amount : 0;
  const isMonimeCurrency = paymentCurrency === "SLE";

  const handleSave = async () => {
    if (!invoice) return;

    const paymentAmount = parseFloat(paymentData.amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (paymentAmount > remainingBalance) {
      toast({
        title: "Error",
        description: `Payment amount cannot exceed remaining balance of Le ${remainingBalance.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

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

      setLoading(true);
      try {
        const amount = paymentData.amount;
        const cleanAmount = parseFloat(String(amount).replace(/[^0-9.]/g, ""));
        const reference = paymentData.reference_number.trim() || `inv_monime_${invoice.id}_${Date.now()}`;
        const { data, error } = await supabase.functions.invoke("monime-checkout", {
          body: {
            amount: cleanAmount,
            currency: paymentCurrency,
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            phone_number: phoneNumber,
            payment_method: "mobile_money",
            reference_number: reference,
            reference: reference,
            notes: paymentData.notes.trim(),
            source: "invoice-payment-modal",
            success_url: `${window.location.origin}/invoices?payment=monime_success&ref=${reference}`,
            cancel_url: `${window.location.origin}/invoices?payment=monime_cancel&ref=${reference}`,
          },
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

        setPaymentData({
          amount: "",
          payment_method: "cash",
          reference_number: "",
          notes: "",
        });
        setMobileMoneyPhone("");
        onPaymentRecorded?.();
        onOpenChange(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unable to start Monime checkout.";
        toast({
          title: "Monime checkout failed",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const newPaidAmount = invoice.paid_amount + paymentAmount;
      
      // Determine new status based on payment
      let newStatus: string = invoice.status;
      if (newPaidAmount >= invoice.total_amount) {
        newStatus = "paid";
      } else if (newPaidAmount > 0) {
        newStatus = "partial";
      }

      // Add payment note to existing notes
      const paymentNote = `Payment of Le ${paymentAmount.toLocaleString()} received on ${new Date().toLocaleDateString()} via ${paymentData.payment_method}${paymentData.reference_number ? ` (Ref: ${paymentData.reference_number})` : ""}${paymentData.notes ? ` - ${paymentData.notes}` : ""}`;
      const updatedNotes = invoice.notes 
        ? `${invoice.notes}\n\n${paymentNote}` 
        : paymentNote;

      await updateInvoice(invoice.id, {
        paid_amount: newPaidAmount,
        status: newStatus as any,
        notes: updatedNotes,
      });

      toast({
        title: "Payment Recorded",
        description: `Payment of Le ${paymentAmount.toLocaleString()} has been recorded successfully`,
      });

      // Reset form
      setPaymentData({
        amount: "",
        payment_method: "cash",
        reference_number: "",
        notes: "",
      });

      onPaymentRecorded?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFullPayment = () => {
    setPaymentData({ ...paymentData, amount: remainingBalance.toString() });
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="sticky top-0 bg-background z-10 p-4 sm:p-6 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Record Payment
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Invoice {invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-4 space-y-4">
          {/* Invoice Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium">Le {invoice.total_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Already Paid:</span>
              <span className="font-medium text-success">Le {invoice.paid_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t pt-2">
              <span>Remaining Balance:</span>
              <span className="text-warning">Le {remainingBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Button 
                type="button" 
                variant="link" 
                size="sm" 
                className="h-auto p-0 text-xs"
                onClick={handleFullPayment}
              >
                Pay Full Balance
              </Button>
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                className="pl-9 h-12 text-base"
              />
            </div>
          </div>

          {/* Payment Currency */}
          <div>
            <Label htmlFor="payment_currency">Transaction Currency</Label>
            <Select
              value={paymentCurrency}
              onValueChange={(value) => setPaymentCurrency(value as PaymentCurrency)}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="SLE">SLE (Le)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          {isMonimeCurrency ? (
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-2">
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
                This prepares a secure Monime payload for the upcoming backend integration.
              </p>
            </div>
          ) : (
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={paymentData.payment_method}
                onValueChange={(value) => setPaymentData({ ...paymentData, payment_method: value })}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reference Number */}
          <div>
            <Label htmlFor="reference_number">Reference Number (Optional)</Label>
            <Input
              id="reference_number"
              placeholder="Transaction reference..."
              value={paymentData.reference_number}
              onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
              className="h-12 text-base"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional payment notes..."
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              className="min-h-[80px] text-base"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="order-2 sm:order-1 h-12 text-base"
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleSave}
              disabled={loading || !paymentData.amount}
              className="order-1 sm:order-2 h-12 text-base"
            >
              <Save className="h-4 w-4" />
              {loading ? "Recording..." : isMonimeCurrency ? "Prepare Mobile Money" : "Record Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
