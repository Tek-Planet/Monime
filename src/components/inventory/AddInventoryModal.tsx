import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Tag, PenTool } from "lucide-react";
import { useInventory, type InventoryFormData } from "@/hooks/useInventory";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBranchContext } from "@/contexts/BranchContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getCategoriesForBusinessType, getBusinessTypeOption } from "@/lib/businessArchetypes";

interface AddInventoryModalProps {
  children?: React.ReactNode;
  onItemAdded?: () => void;
}

export function AddInventoryModal({ children, onItemAdded }: AddInventoryModalProps) {
  const { t } = useLanguage();
  const { selectedBranchId } = useBranchContext();
  const { business } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  
  const { inventory, addInventoryItem } = useInventory(business?.id);

  const businessType = business?.business_type;
  const businessTypeOption = useMemo(() => getBusinessTypeOption(businessType), [businessType]);

  const categories = useMemo(() => {
    const existing = inventory.map(item => item.category);
    return getCategoriesForBusinessType(businessType, existing);
  }, [businessType, inventory]);

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

    const finalCategory = isCustomCategory ? customCategoryInput.trim() : formData.category;

    try {
      await addInventoryItem({
        ...formData,
        category: finalCategory || undefined,
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
      setIsCustomCategory(false);
      setCustomCategoryInput("");
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

  const handleCategorySelect = (value: string) => {
    if (value === "__custom__") {
      setIsCustomCategory(true);
      setCustomCategoryInput("");
      updateField("category", "");
    } else {
      setIsCustomCategory(false);
      updateField("category", value);
    }
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
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>{t('inventory.addNew')}</DialogTitle>
            {businessTypeOption && (
              <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20 hidden sm:inline-flex">
                <Sparkles className="w-3 h-3 mr-1" />
                {businessTypeOption.label}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('inventory.productName')} *</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => updateField("name", e.target.value)} 
                placeholder={businessTypeOption?.archetype === 'food' ? "e.g. Fried Rice & Chicken" : businessTypeOption?.archetype === 'service' ? "e.g. Screen Replacement Service" : "e.g. Samsung Fast Charger"}
                required 
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category" className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  {t('inventory.category')}
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(!isCustomCategory);
                    if (!isCustomCategory) {
                      setCustomCategoryInput(formData.category || "");
                    }
                  }}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <PenTool className="w-3 h-3" />
                  {isCustomCategory ? "Choose from list" : "+ Custom"}
                </button>
              </div>

              {isCustomCategory ? (
                <Input
                  id="custom-category"
                  placeholder="Enter custom category name..."
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  autoFocus
                />
              ) : (
                <Select value={formData.category} onValueChange={handleCategorySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('inventory.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {businessTypeOption && (
                      <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/40 rounded-t">
                        Recommended for {businessTypeOption.label}
                      </div>
                    )}
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                    <div className="border-t my-1" />
                    <SelectItem value="__custom__" className="text-primary font-medium">
                      + Add New / Custom Category
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
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

