import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Calculator, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBranchContext } from "@/contexts/BranchContext";
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface InvoiceItem {
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated?: () => void;
}

export function CreateInvoiceModal({ open, onOpenChange, onInvoiceCreated }: CreateInvoiceModalProps) {
  const { t } = useLanguage();
  const { selectedBranchId } = useBranchContext();
  const [invoiceData, setInvoiceData] = useState({
    customer_id: "",
    due_date: "",
    notes: "",
  });
  const [items, setItems] = useState<InvoiceItem[]>([{ product_name: "", quantity: 1, unit_price: 0, total_price: 0 }]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const { createInvoice } = useInvoices();
  const { inventory } = useInventory();
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, [selectedBranchId]);

  const fetchCustomers = async () => {
    try {
      let query = supabase.from("customers").select("id, name, email, phone");
      
      // Filter by branch if one is selected
      if (selectedBranchId) {
        query = query.eq("branch_id", selectedBranchId);
      }
      
      const { data } = await query.order("name");
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const addItem = () => {
    setItems([...items, { product_name: "", quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "unit_price") {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }

    setItems(newItems);
  };

  const selectProduct = (index: number, productId: string) => {
    const product = inventory.find((p) => p.id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product_id: productId,
        product_name: product.name,
        unit_price: product.unit_price,
        total_price: product.unit_price * newItems[index].quantity,
      };
      setItems(newItems);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const tax = subtotal * 0.15; // 15% tax
  const total = subtotal + tax;

  const handleSave = async () => {
    console.log("Items before validation:", items);
    const validItems = items.filter((item) => item.product_name && item.product_name.trim() !== "");
    console.log("Valid items:", validItems);

    if (validItems.length === 0) {
      toast({
        title: t('modal.error'),
        description: t('invoice.addAtLeastOne'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await createInvoice({
        customer_id: invoiceData.customer_id || undefined,
        due_date: invoiceData.due_date || undefined,
        notes: invoiceData.notes || undefined,
        branch_id: selectedBranchId || undefined,
        items: items.filter((item) => item.product_name),
      });

      // Reset form
      setInvoiceData({
        customer_id: "",
        due_date: "",
        notes: "",
      });
      setItems([{ product_name: "", quantity: 1, unit_price: 0, total_price: 0 }]);
      onOpenChange(false);

      // Trigger refetch in parent component
      onInvoiceCreated?.();
    } catch (error) {
      console.error("Error creating invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-4xl max-h-[80vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('invoice.createNew')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="customer">{t('nav.customers')}</Label>
              <Select onValueChange={(value) => setInvoiceData({ ...invoiceData, customer_id: value })}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder={t('invoice.selectCustomer')} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate">{t('invoice.dueDate')}</Label>
              <Input
                id="dueDate"
                type="date"
                value={invoiceData.due_date}
                onChange={(e) => setInvoiceData({ ...invoiceData, due_date: e.target.value })}
                className="h-12 text-base"
              />
            </div>
          </div>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>{t('invoice.invoiceItems')}</span>
                <Button size="sm" onClick={addItem} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  {t('invoice.addItem')}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{t('invoice.item')} {index + 1}</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        {t('modal.remove')}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label>{t('inventory.productName')}</Label>
                        <Select onValueChange={(value) => selectProduct(index, value)}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder={t('invoice.selectProduct')} />
                          </SelectTrigger>
                          <SelectContent>
                            {inventory.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - Le {product.unit_price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label>{t('invoice.quantity')}</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                            className="h-12 text-base"
                          />
                        </div>

                        <div>
                          <Label>{t('invoice.price')}</Label>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                            className="h-12 text-base"
                          />
                        </div>

                        <div>
                          <Label>{t('invoice.total')}</Label>
                          <Input value={item.total_price.toFixed(2)} disabled className="h-12 text-base" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">{t('invoice.notes')}</Label>
            <Textarea
              id="notes"
              placeholder={t('invoice.additionalNotes')}
              value={invoiceData.notes}
              onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
              className="min-h-[100px] text-base"
            />
          </div>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {t('invoice.invoiceSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t('invoice.subtotal')}:</span>
                  <span>Le {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('invoice.tax')}:</span>
                  <span>Le {tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>{t('invoice.total').replace(' (Le)', '')}:</span>
                  <span>Le {total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="order-2 sm:order-1 h-12 text-base">
              {t('modal.cancel')}
            </Button>
            <Button
              variant="success"
              onClick={handleSave}
              disabled={loading}
              className="order-1 sm:order-2 h-12 text-base"
            >
              <Save className="h-4 w-4" />
              {loading ? t('modal.creating') : t('invoice.createInvoice')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
