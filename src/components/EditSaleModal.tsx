import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Sale, useSales, SaleItemData } from "@/hooks/useSales";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface SaleItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface EditSaleModalProps {
  sale: Sale;
  onSaleUpdated?: () => void;
}

export function EditSaleModal({ sale, onSaleUpdated }: EditSaleModalProps) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { updateSale } = useSales();
  const { inventory } = useInventory();

  const [formData, setFormData] = useState({
    customer_id: sale.customer_id || "none",
    payment_method: sale.payment_method,
    notes: sale.notes || "",
    sale_date: sale.sale_date,
  });

  const [items, setItems] = useState<SaleItemData[]>([]);
  const [originalItems, setOriginalItems] = useState<SaleItem[]>([]);

  useEffect(() => {
    if (open) {
      fetchCustomers();
      fetchSaleItems();
    }
  }, [open]);

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("id, name, email, phone").order("name");
    setCustomers(data || []);
  };

  const fetchSaleItems = async () => {
    const { data } = await supabase
      .from("sale_items")
      .select("id, product_id, product_name, quantity, unit_price, total_price")
      .eq("sale_id", sale.id);
    
    if (data && data.length > 0) {
      setOriginalItems(data);
      setItems(data.map(item => ({
        product_id: item.product_id || "",
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price
      })));
    } else {
      // Fallback if no items exist
      setItems([{
        product_id: "",
        product_name: "Item",
        quantity: 1,
        unit_price: sale.total_amount
      }]);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { product_id: "", product_name: "", quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof SaleItemData, value: string | number) => {
    const newItems = [...items];
    
    if (field === "product_id") {
      const product = inventory.find(p => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          product_id: product.id,
          product_name: product.name,
          unit_price: product.unit_price
        };
      }
    } else {
      (newItems[index] as any)[field] = value;
    }
    
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  // Calculate available stock for each product (current stock + what was sold in original sale)
  const getAvailableStock = (productId: string) => {
    const product = inventory.find(p => p.id === productId);
    const currentStock = product?.stock_quantity || 0;
    
    // Add back the quantity from original sale for this product
    const originalItem = originalItems.find(item => item.product_id === productId);
    const originalQty = originalItem?.quantity || 0;
    
    return currentStock + originalQty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate items
    const validItems = items.filter(item => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateSale(sale.id, {
        customer_id: formData.customer_id === "none" ? null : formData.customer_id,
        payment_method: formData.payment_method as any,
        notes: formData.notes,
        items: validItems
      });

      // Invalidate the sale-items cache so ViewSaleModal shows updated data
      queryClient.invalidateQueries({ queryKey: ['sale-items', sale.id] });
      
      onSaleUpdated?.();
      setOpen(false);
    } catch (error) {
      console.error("Error updating sale:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95%] max-h-[85vh] flex flex-col md:max-w-lg p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogTitle>Edit Sale</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Select
              value={formData.customer_id}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, customer_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Walk-in Customer</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  payment_method: value as "cash" | "mobile_money" | "bank_transfer" | "credit",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale_date">Sale Date</Label>
            <Input
              id="sale_date"
              type="date"
              value={formData.sale_date}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>

          {/* Sale Items Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Sale Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Select
                      value={item.product_id}
                      onValueChange={(value) => handleItemChange(index, "product_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} (Stock: {getAvailableStock(product.id)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          max={item.product_id ? getAvailableStock(item.product_id) : undefined}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, "unit_price", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <Input
                          type="text"
                          value={`Le ${(item.quantity * item.unit_price).toLocaleString()}`}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount (Read-only) */}
          <div className="p-3 bg-primary/10 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount</span>
              <span className="text-lg font-bold">Le {calculateTotal().toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes about this sale..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Sale"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
