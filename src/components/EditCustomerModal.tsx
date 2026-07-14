import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  business_type?: string;
  credit_limit: number;
  current_balance: number;
  birthday?: string;
}

interface EditCustomerModalProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerUpdated: () => void;
}

export function EditCustomerModal({ customer, open, onOpenChange, onCustomerUpdated }: EditCustomerModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: customer.name,
    phone: customer.phone || "",
    email: customer.email || "",
    address: customer.address || "",
    business_type: customer.business_type || "",
    credit_limit: customer.credit_limit.toString(),
    birthday: customer.birthday || "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: t('modal.error'),
        description: t('customer.nameRequired'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("customers")
        .update({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          business_type: formData.business_type || null,
          credit_limit: parseFloat(formData.credit_limit) || 0,
          birthday: formData.birthday || null,
        })
        .eq("id", customer.id);

      if (error) throw error;

      toast({
        title: t('modal.success'),
        description: `${t('nav.customers').slice(0, -1)} ${t('modal.update').toLowerCase()}d successfully`,
      });

      onCustomerUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({
        title: t('modal.error'),
        description: t('customer.failedToAdd').replace('add', 'update'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col sm:max-w-[600px] max-w-[90vw] max-h-[90vh] p-4 sm:p-6">
        <DialogHeader className="flex-shrink">
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            {t('customer.editCustomer')}
          </DialogTitle>
          <DialogDescription className="text-left">{t('customer.addToRecords').replace('Add a new', 'Update')}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 grid gap-4 sm:gap-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">{t('customer.basicInfo')}</h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('customer.name')} *</Label>
                <Input
                  id="name"
                  placeholder={t('customer.enterName')}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('customer.phone')}</Label>
                <Input
                  id="phone"
                  placeholder={t('customer.enterPhone')}
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('customer.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('customer.enterEmail')}
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday">{t('customer.birthday')}</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => handleInputChange("birthday", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min="1900-01-01"
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('customer.address')}</Label>
              <Textarea
                id="address"
                placeholder={t('customer.enterAddress')}
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                rows={3}
                className="min-h-[100px] text-base"
              />
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">{t('customer.businessDetails')}</h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_type">{t('customer.businessType')}</Label>
                <Select
                  value={formData.business_type}
                  onValueChange={(value) => handleInputChange("business_type", value)}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder={t('customer.selectBusinessType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail_store">{t('businessType.retailStore')}</SelectItem>
                    <SelectItem value="provision_shop">{t('businessType.provisionShop')}</SelectItem>
                    <SelectItem value="restaurant">{t('businessType.restaurant')}</SelectItem>
                    <SelectItem value="market_vendor">{t('businessType.marketVendor')}</SelectItem>
                    <SelectItem value="supermarket">{t('businessType.supermarket')}</SelectItem>
                    <SelectItem value="other">{t('businessType.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit_limit">{t('customer.creditLimit')}</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.credit_limit}
                  onChange={(e) => handleInputChange("credit_limit", e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="order-2 sm:order-1 h-12 text-base">
            {t('modal.cancel')}
          </Button>
          <Button
            variant="gradient"
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            className="order-1 sm:order-2 min-w-[100px] h-12 text-base"
          >
            {loading ? t('modal.updating') : t('modal.update')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
