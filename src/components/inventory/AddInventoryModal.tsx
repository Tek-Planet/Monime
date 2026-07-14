import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useInventory, type InventoryFormData } from "@/hooks/useInventory";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBranchContext } from "@/contexts/BranchContext";
interface AddInventoryModalProps {
  children?: React.ReactNode;
  onItemAdded?: () => void;
}

const categories = [
  "Staples",
  "Cooking",
  "Seasoning",
  "Sweet",
  "Beverages",
  "Dairy",
  "Meat & Fish",
  "Vegetables",
  "Fruits",
  "Snacks",
  "Personal Care",
  "Household",
  "Other",
];

export function AddInventoryModal({ children, onItemAdded }: AddInventoryModalProps) {
  const { t } = useLanguage();
  const { selectedBranchId } = useBranchContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addInventoryItem } = useInventory();

  const [formData, setFormData] = useState<InventoryFormData>({
    name: "",
    category: "",
    sku: "",
    barcode: "",
    description: "",
    unit_price: 0,
    cost_price: 0,
    stock_quantity: 0,
    min_stock_level: 0,
    supplier: "",
    location: "",
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addInventoryItem({
        ...formData,
        branch_id: selectedBranchId || undefined
      });
      setFormData({
        name: "",
        category: "",
        sku: "",
        barcode: "",
        description: "",
        unit_price: 0,
        cost_price: 0,
        stock_quantity: 0,
        min_stock_level: 0,
        supplier: "",
        location: "",
        is_active: true,
      });
      setOpen(false);
      onItemAdded?.();
    } catch (error) {
      console.error("Error adding inventory item:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof InventoryFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="gradient" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {t('inventory.addProduct')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex flex-col max-w-[90vw] sm:max-w-2xl max-h-[90vh] p-4 md:p-6">
        <DialogHeader className="flex-shrink">
          <DialogTitle>{t('inventory.addNew')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('inventory.productName')} *</Label>
              <Input id="name" value={formData.name} onChange={(e) => updateField("name", e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t('inventory.category')}</Label>
              <Select value={formData.category} onValueChange={(value) => updateField("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('inventory.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">{t('inventory.sku')}</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => updateField("sku", e.target.value)}
                placeholder={t('inventory.stockKeepingUnit')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">{t('inventory.barcode')}</Label>
              <Input id="barcode" value={formData.barcode} onChange={(e) => updateField("barcode", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_price">{t('inventory.unitPrice')} *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => updateField("unit_price", parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_price">{t('inventory.costPrice')}</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => updateField("cost_price", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_quantity">{t('inventory.stockQuantity')} *</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => updateField("stock_quantity", parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock_level">{t('inventory.minStockLevel')}</Label>
              <Input
                id="min_stock_level"
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => updateField("min_stock_level", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">{t('inventory.supplierName')}</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => updateField("supplier", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t('inventory.locationShelf')}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder={t('inventory.shelfAisle')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('inventory.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => updateField("is_active", checked)}
            />
            <Label htmlFor="is_active">{t('inventory.activeProduct')}</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('modal.cancel')}
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? t('modal.adding') : t('inventory.addProduct')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
