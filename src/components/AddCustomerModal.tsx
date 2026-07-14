import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateBusinessId } from "@/lib/getOrCreateBusinessId";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBranchContext } from "@/contexts/BranchContext";
interface CustomerData {
  name: string;
  phone: string;
  email: string;
  address: string;
  business_type: string;
  credit_limit: string;
  birthday?: Date;
}

interface AddCustomerModalProps {
  onCustomerAdded?: () => void;
}

export function AddCustomerModal({ onCustomerAdded }: AddCustomerModalProps = {}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { selectedBranchId } = useBranchContext();
  const [customer, setCustomer] = useState<CustomerData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    business_type: "",
    credit_limit: "0",
    birthday: undefined,
  });

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!customer.name.trim()) {
      toast({
        title: t('message.error'),
        description: t('customer.nameRequired'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: t('message.error'),
          description: t('customer.mustBeLoggedIn'),
          variant: "destructive",
        });
        return;
      }

      // Get business ID (respects team membership - won't create if member)
      const businessId = await getOrCreateBusinessId(user.id);
      
      if (!businessId) {
        toast({
          title: t('message.error'),
          description: t('customer.noBusinessFound'),
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("customers").insert({
        user_id: user.id,
        business_id: businessId,
        branch_id: selectedBranchId || null,
        name: customer.name,
        phone: customer.phone || null,
        email: customer.email || null,
        address: customer.address || null,
        business_type: customer.business_type || null,
        credit_limit: parseFloat(customer.credit_limit) || 0,
        birthday: customer.birthday ? customer.birthday.toISOString().split("T")[0] : null,
      });

      if (error) throw error;

      toast({
        title: t('message.success'),
        description: t('customer.addedSuccess'),
      });

      // Reset form and close modal
      setCustomer({
        name: "",
        phone: "",
        email: "",
        address: "",
        business_type: "",
        credit_limit: "0",
        birthday: undefined,
      });
      setOpen(false);

      // Trigger refetch in parent component
      onCustomerAdded?.();
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({
        title: t('message.error'),
        description: t('customer.failedToAdd'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = customer.name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" className="w-full sm:w-auto">
          <Users className="h-4 w-4" />
          {t('customer.addCustomer')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('customer.addNew')}
          </DialogTitle>
          <DialogDescription className="text-left">{t('customer.addToRecords')}</DialogDescription>
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
                  value={customer.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('customer.phone')}</Label>
                <Input
                  id="phone"
                  placeholder={t('customer.enterPhone')}
                  value={customer.phone}
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
                value={customer.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday">{t('customer.birthday')}</Label>
              <Input
                id="birthday"
                type="date"
                value={customer.birthday ? customer.birthday.toISOString().split("T")[0] : ""}
                onChange={(e) =>
                  setCustomer((prev) => ({
                    ...prev,
                    birthday: e.target.value ? new Date(e.target.value) : undefined,
                  }))
                }
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
                value={customer.address}
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
                  value={customer.business_type}
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
                  value={customer.credit_limit}
                  onChange={(e) => handleInputChange("credit_limit", e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="order-2 sm:order-1 h-12 text-base">
            {t('modal.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            className="order-1 sm:order-2 min-w-[100px] h-12 text-base"
          >
            {loading ? t('modal.adding') : t('customer.addCustomer')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
