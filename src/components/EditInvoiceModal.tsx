import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Calculator, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface InvoiceItem {
  id?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface EditInvoiceModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceUpdated?: () => void;
}

export function EditInvoiceModal({ invoice, open, onOpenChange, onInvoiceUpdated }: EditInvoiceModalProps) {
  const [invoiceData, setInvoiceData] = useState({
    customer_id: "",
    due_date: "",
    notes: "",
    status: "draft",
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();
  const { updateInvoice } = useInvoices();
  const { inventory } = useInventory();
  const { toast } = useToast();

  useEffect(() => {
    if (invoice && open) {
      setInvoiceData({
        customer_id: invoice.customer_id || "",
        due_date: invoice.due_date || "",
        notes: invoice.notes || "",
        status: invoice.status,
      });

      // Set items from invoice_items or create a default item
      if (invoice.invoice_items && invoice.invoice_items.length > 0) {
        setItems(
          invoice.invoice_items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })),
        );
      } else {
        setItems([{ product_name: "", quantity: 1, unit_price: 0, total_price: 0 }]);
      }
    }
    fetchCustomers();
  }, [invoice, open]);

  const fetchCustomers = async () => {
    try {
      const { data } = await supabase.from("customers").select("id, name, email, phone").order("name");

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
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const tax = subtotal * 0.15; // 15% tax
  const total = subtotal + tax;

  const handleSave = async () => {
    if (!invoice) return;

    const validItems = items.filter((item) => item.product_name && item.product_name.trim() !== "");

    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await updateInvoice(
        invoice.id,
        {
          customer_id: invoiceData.customer_id || undefined,
          due_date: invoiceData.due_date || undefined,
          notes: invoiceData.notes || undefined,
          status: invoiceData.status as any,
        },
        validItems
      );

      // Invalidate the invoice-items cache so ViewInvoiceModal shows updated data
      queryClient.invalidateQueries({ queryKey: ['invoice-items', invoice.id] });

      onInvoiceUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] flex flex-col sm:max-w-4xl max-h-[95vh] p-4 sm:p-6">
        <DialogHeader className="flex-shrink">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Edit Invoice {invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={invoiceData.customer_id}
                onValueChange={(value) => setInvoiceData({ ...invoiceData, customer_id: value })}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select customer" />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoiceData.due_date}
                  onChange={(e) => setInvoiceData({ ...invoiceData, due_date: e.target.value })}
                  className="h-12 text-base"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={invoiceData.status}
                  onValueChange={(value) => setInvoiceData({ ...invoiceData, status: value })}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>Invoice Items</span>
                <Button size="sm" onClick={addItem} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Item {index + 1}</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label>Product</Label>
                        <Select onValueChange={(value) => selectProduct(index, value)} value={item.product_id}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Select product" />
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
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                            className="h-12 text-base"
                          />
                        </div>

                        <div>
                          <Label>Price (Le)</Label>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                            className="h-12 text-base"
                          />
                        </div>

                        <div>
                          <Label>Total (Le)</Label>
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or terms..."
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
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Le {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (15%):</span>
                  <span>Le {tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>Le {total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="order-2 sm:order-1 h-12 text-base">
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleSave}
              disabled={loading}
              className="order-1 sm:order-2 h-12 text-base"
            >
              <Save className="h-4 w-4" />
              {loading ? "Updating..." : "Update Invoice"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
