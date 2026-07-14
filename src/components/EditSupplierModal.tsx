import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Save, Truck } from "lucide-react";
import { useState, useEffect } from "react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useLanguage } from "@/contexts/LanguageContext";

interface EditSupplierModalProps {
  supplier: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function EditSupplierModal({ supplier, open, onOpenChange, onClose }: EditSupplierModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [supplierData, setSupplierData] = useState({
    name: "",
    phone: "",
    location: "",
    product_category: "",
    notes: "",
  });

  const { updateSupplier } = useSuppliers();

  useEffect(() => {
    if (supplier) {
      setSupplierData({
        name: supplier.name || "",
        phone: supplier.phone || "",
        location: supplier.location || "",
        product_category: supplier.product_category || "",
        notes: supplier.notes || "",
      });
    }
  }, [supplier]);

  const handleSave = async () => {
    if (!supplierData.name.trim()) return;

    setLoading(true);
    try {
      await updateSupplier(supplier.id, {
        name: supplierData.name,
        phone: supplierData.phone || undefined,
        location: supplierData.location || undefined,
        product_category: supplierData.product_category || undefined,
        notes: supplierData.notes || undefined,
      });

      onOpenChange(false);
      onClose();
    } catch (error) {
      console.error("Error updating supplier:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink">
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {t('modal.edit')} {t('nav.suppliers').slice(0, -1)}
          </DialogTitle>
          <DialogDescription className="text-left">{t('supplier.addToManage').replace('Add a new supplier to', 'Update supplier information to')}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4">
          <div>
            <Label htmlFor="name">{t('supplier.name')} *</Label>
            <Input
              id="name"
              value={supplierData.name}
              onChange={(e) => setSupplierData({ ...supplierData, name: e.target.value })}
              placeholder={t('supplier.enterName')}
            />
          </div>

          <div>
            <Label htmlFor="phone">{t('supplier.phone')}</Label>
            <Input
              id="phone"
              value={supplierData.phone}
              onChange={(e) => setSupplierData({ ...supplierData, phone: e.target.value })}
              placeholder={t('supplier.enterPhone')}
            />
          </div>

          <div>
            <Label htmlFor="location">{t('supplier.location')}</Label>
            <Input
              id="location"
              value={supplierData.location}
              onChange={(e) => setSupplierData({ ...supplierData, location: e.target.value })}
              placeholder={t('supplier.villageTownCity')}
            />
          </div>

          <div>
            <Label htmlFor="category">{t('supplier.productCategory')}</Label>
            <Select
              value={supplierData.product_category}
              onValueChange={(value) => setSupplierData({ ...supplierData, product_category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('supplier.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food_beverages">{t('productCategory.foodBeverages')}</SelectItem>
                <SelectItem value="electronics">{t('productCategory.electronics')}</SelectItem>
                <SelectItem value="clothing">{t('productCategory.clothing')}</SelectItem>
                <SelectItem value="household">{t('productCategory.household')}</SelectItem>
                <SelectItem value="beauty_personal">{t('productCategory.beautyPersonal')}</SelectItem>
                <SelectItem value="stationery">{t('productCategory.stationery')}</SelectItem>
                <SelectItem value="hardware">{t('productCategory.hardware')}</SelectItem>
                <SelectItem value="pharmaceuticals">{t('productCategory.pharmaceuticals')}</SelectItem>
                <SelectItem value="transportation">{t('productCategory.transportation')}</SelectItem>
                <SelectItem value="services">{t('productCategory.services')}</SelectItem>
                <SelectItem value="other">{t('productCategory.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">{t('supplier.notes')}</Label>
            <Textarea
              id="notes"
              value={supplierData.notes}
              onChange={(e) => setSupplierData({ ...supplierData, notes: e.target.value })}
              placeholder={t('supplier.additionalNotes')}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t('modal.cancel')}
            </Button>
            <Button variant="gradient" onClick={handleSave} disabled={loading || !supplierData.name.trim()} className="flex-1">
              <Save className="h-4 w-4" />
              {loading ? t('modal.saving') : t('team.saveChanges')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
