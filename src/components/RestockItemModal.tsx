import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface RestockItem {
  product: string;
  category: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  total: number;
}

const products = [
  "Rice (50kg bag)",
  "Palm Oil (20L)",
  "Maggi Cubes",
  "Milk Powder",
  "Sugar (50kg)",
  "Flour (25kg)",
  "Groundnut Oil",
  "Biscuits",
  "Soap",
  "Detergent",
];

const categories = ["Food Items", "Beverages", "Personal Care", "Household", "Spices"];

const suppliers = [
  "Sierra Leone Trading Co.",
  "West Africa Imports",
  "Local Farmers Market",
  "Continental Distributors",
  "Atlantic Suppliers",
];

export function RestockItemModal() {
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RestockItem[]>([
    { product: "", category: "", quantity: 1, unitCost: 0, supplier: "", total: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const addItem = () => {
    setItems([...items, { product: "", category: "", quantity: 1, unitCost: 0, supplier: "", total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof RestockItem, value: string | number) => {
    const updatedItems = items.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitCost") {
          updated.total = updated.quantity * updated.unitCost;
        }
        return updated;
      }
      return item;
    });
    setItems(updatedItems);
  };

  const totalCost = items.reduce((sum, item) => sum + item.total, 0);

  const handleRestock = () => {
    console.log("Restocking items:", { items, notes, totalCost });
    toast({
      title: t("restock.orderSubmitted"),
      description: `${items.length} ${t("restock.itemsOrdered")} Le ${totalCost.toLocaleString(locale)}`,
    });
    setOpen(false);
    setItems([{ product: "", category: "", quantity: 1, unitCost: 0, supplier: "", total: 0 }]);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" className="w-full sm:w-auto">
          <Package className="h-4 w-4" />
          {t("restock.restockItems")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("restock.restockInventory")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Items List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-semibold">{t("restock.itemsToRestock")}</h3>
              <Button onClick={addItem} size="sm" variant="outline" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                {t("restock.addItem")}
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{t("restock.item")} {index + 1}</span>
                    {items.length > 1 && (
                      <Button variant="outline" size="sm" onClick={() => removeItem(index)}>
                        <Minus className="h-4 w-4" />
                        {t("restock.remove")}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>{t("restock.product")}</Label>
                      <Select value={item.product} onValueChange={(value) => updateItem(index, "product", value)}>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder={t("restock.selectProduct")} />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product} value={product}>
                              {product}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{t("restock.category")}</Label>
                      <Select value={item.category} onValueChange={(value) => updateItem(index, "category", value)}>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder={t("restock.category")} />
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t("restock.quantity")}</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                          className="h-12 text-base"
                        />
                      </div>

                      <div>
                        <Label>{t("restock.unitCost")}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) => updateItem(index, "unitCost", parseFloat(e.target.value) || 0)}
                          className="h-12 text-base"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>{t("restock.supplier")}</Label>
                      <Select value={item.supplier} onValueChange={(value) => updateItem(index, "supplier", value)}>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder={t("restock.supplier")} />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier} value={supplier}>
                              {supplier}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-muted-foreground">{t("restock.totalCost")}:</span>
                      <span className="font-semibold text-lg">Le {item.total.toLocaleString(locale)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">{t("restock.orderSummary")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t("restock.totalItems")}:</span>
                  <span className="font-semibold">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("restock.totalQuantity")}:</span>
                  <span className="font-semibold">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">{t("restock.totalCost")}:</span>
                  <span className="font-bold text-primary">Le {totalCost.toLocaleString(locale)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">{t("restock.additionalNotes")}</Label>
            <Textarea
              id="notes"
              placeholder={t("restock.notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 min-h-[100px] text-base"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="order-2 sm:order-1 h-12 text-base">
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleRestock}
              className="order-1 sm:order-2 h-12 text-base"
              disabled={items.some((item) => !item.product || !item.category || !item.supplier)}
            >
              {t("restock.submitOrder")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
