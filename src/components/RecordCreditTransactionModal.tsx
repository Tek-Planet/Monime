import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Customer {
  id: string;
  name: string;
  credit_limit: number;
  current_balance: number;
}

interface RecordCreditTransactionModalProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionRecorded: () => void;
}

export function RecordCreditTransactionModal({
  customer,
  open,
  onOpenChange,
  onTransactionRecorded,
}: RecordCreditTransactionModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    transaction_type: "credit",
    transaction_date: new Date().toISOString().split("T")[0],
    description: "",
    reference_number: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: t('modal.error'),
        description: t('creditTx.validAmount'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get business ID
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);

      if (!businesses || businesses.length === 0) {
        throw new Error("No business found");
      }

      const amount = parseFloat(formData.amount);

      // Create credit transaction
      const { error: txError } = await supabase.from("credit_transactions").insert({
        customer_id: customer.id,
        business_id: businesses[0].id,
        user_id: user.id,
        amount: amount,
        transaction_type: formData.transaction_type,
        transaction_date: formData.transaction_date,
        description: formData.description || null,
        reference_number: formData.reference_number || null,
      });

      if (txError) throw txError;

      // Update customer balance
      const newBalance =
        formData.transaction_type === "credit"
          ? customer.current_balance + amount
          : Math.max(0, customer.current_balance - amount);

      const { error: updateError } = await supabase
        .from("customers")
        .update({ current_balance: newBalance })
        .eq("id", customer.id);

      if (updateError) throw updateError;

      toast({
        title: t('modal.success'),
        description: `${formData.transaction_type === "credit" ? t('payment.credit') : t('creditTx.paymentPaysBack').split(' ')[0]} ${t('creditTx.recordedSuccess')}`,
      });

      // Reset form
      setFormData({
        amount: "",
        transaction_type: "credit",
        transaction_date: new Date().toISOString().split("T")[0],
        description: "",
        reference_number: "",
      });

      onTransactionRecorded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error recording transaction:", error);
      toast({
        title: t('modal.error'),
        description: t('creditTx.failedToRecord'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableCredit = customer.credit_limit - customer.current_balance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('creditTx.recordTransaction')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Info */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="font-medium">{customer.name}</div>
            <div className="text-muted-foreground">
              {t('creditTx.balance')}: Le {customer.current_balance.toLocaleString()} | {t('customer.available')}: Le{" "}
              {availableCredit.toLocaleString()}
            </div>
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label>{t('creditTx.transactionType')}</Label>
            <Select
              value={formData.transaction_type}
              onValueChange={(value) =>
                setFormData({ ...formData, transaction_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">{t('creditTx.creditOwesMore')}</SelectItem>
                <SelectItem value="payment">{t('creditTx.paymentPaysBack')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>{t('creditTx.amount')}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder={t('creditTx.enterAmount')}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>{t('creditTx.transactionDate')}</Label>
            <Input
              type="date"
              value={formData.transaction_date}
              onChange={(e) =>
                setFormData({ ...formData, transaction_date: e.target.value })
              }
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{t('creditTx.descriptionOptional')}</Label>
            <Textarea
              placeholder={t('creditTx.enterDescription')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label>{t('creditTx.referenceNumber')}</Label>
            <Input
              placeholder={t('creditTx.enterReference')}
              value={formData.reference_number}
              onChange={(e) =>
                setFormData({ ...formData, reference_number: e.target.value })
              }
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t('modal.cancel')}
            </Button>
            <Button type="submit" variant="gradient" disabled={loading} className="flex-1">
              {loading ? t('modal.saving') : t('creditTx.recordTransaction')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
