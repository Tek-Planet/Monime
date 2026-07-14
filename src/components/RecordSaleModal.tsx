import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { ShoppingCart, Plus, Save, Calculator, User } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSales } from "@/hooks/useSales";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBranchContext } from "@/contexts/BranchContext";
import { getOrCreateBusinessId } from "@/lib/getOrCreateBusinessId";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface SaleItem {
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  maxStock: number;
}

export function RecordSaleModal({ onSaleCreated }: { onSaleCreated?: () => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [saleData, setSaleData] = useState({
    payment_method: "cash" as "cash" | "mobile_money" | "bank_transfer" | "credit",
    notes: "",
  });
  const [items, setItems] = useState<SaleItem[]>([
    { product_name: "", quantity: 1, unit_price: 0, total_price: 0, maxStock: 0 },
  ]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  const { createSale } = useSales();
  const { inventory } = useInventory();
  const { toast } = useToast();
  const { selectedBranchId } = useBranchContext();

  useEffect(() => {
    fetchCustomers();
  }, [selectedBranchId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        customerInputRef.current &&
        !customerInputRef.current.contains(e.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCustomers = async () => {
    try {
      let query = supabase.from("customers").select("id, name, email, phone");
      if (selectedBranchId) {
        query = query.eq("branch_id", selectedBranchId);
      }
      const { data } = await query.order("name");
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerName.trim()) return customers;
    const search = customerName.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(search));
  }, [customerName, customers]);

  const isNewCustomer = useMemo(() => {
    if (!customerName.trim()) return false;
    return !customers.some((c) => c.name.toLowerCase() === customerName.trim().toLowerCase());
  }, [customerName, customers]);

  const handleSelectCustomer = (customer: Customer) => {
    setCustomerName(customer.name);
    setSelectedCustomerId(customer.id);
    setShowCustomerDropdown(false);
  };

  const handleCustomerInputChange = (value: string) => {
    setCustomerName(value);
    setSelectedCustomerId(null); // Reset selection when typing
    setShowCustomerDropdown(true);
  };

  const addItem = () => {
    setItems([...items, { product_name: "", quantity: 1, unit_price: 0, total_price: 0, maxStock: 0 }]);
  };

  const updateItem = (index: number, field: keyof SaleItem, value: string | number) => {
    setItems((prev) => {
      const newItems = [...prev];
      const current = newItems[index] ?? { product_name: "", quantity: 1, unit_price: 0, total_price: 0, maxStock: 0 };
      const updated: SaleItem = { ...current, [field]: value } as SaleItem;
      if (field === "quantity" || field === "unit_price") {
        updated.total_price = Number(updated.quantity) * Number(updated.unit_price);
      }
      newItems[index] = updated;
      return newItems;
    });
  };

  const selectProduct = (index: number, productId: string) => {
    const product = inventory.find((p) => p.id === productId);
    if (product) {
      setItems((prev) => {
        const newItems = [...prev];
        const current = newItems[index] ?? { product_name: "", quantity: 1, unit_price: 0, total_price: 0, maxStock: 0 };
        const quantity = current.quantity || 1;
        const updated: SaleItem = {
          ...current,
          product_id: productId,
          product_name: product.name,
          unit_price: product.unit_price,
          maxStock: product.stock_quantity,
          total_price: Number(product.unit_price) * Number(quantity),
        };
        newItems[index] = updated;
        return newItems;
      });
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const total = subtotal - discount;

  const handleSave = async () => {
    if (total <= 0) {
      toast({
        title: t('modal.error'),
        description: t('sale.addPositiveTotal'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let customerId = selectedCustomerId;

      // Auto-create customer if a new name was typed
      if (!customerId && customerName.trim() && isNewCustomer) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const businessId = await getOrCreateBusinessId(user.id);
          if (businessId) {
            const { data: newCustomer, error: customerError } = await supabase
              .from("customers")
              .insert({
                name: customerName.trim(),
                user_id: user.id,
                business_id: businessId,
                branch_id: selectedBranchId || null,
              })
              .select("id")
              .single();

            if (!customerError && newCustomer) {
              customerId = newCustomer.id;
              toast({
                title: t('modal.success') || "Success",
                description: `Customer "${customerName.trim()}" created automatically.`,
              });
            }
          }
        }
      }

      await createSale({
        customer_id: customerId || undefined,
        total_amount: total,
        payment_method: saleData.payment_method,
        notes: saleData.notes || undefined,
        branch_id: selectedBranchId || undefined,
        items: items
          .filter(item => item.product_id)
          .map(item => ({
            product_id: item.product_id!,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price
          }))
      });

      onSaleCreated?.();

      // Reset form
      setCustomerName("");
      setSelectedCustomerId(null);
      setSaleData({ payment_method: "cash", notes: "" });
      setItems([{ product_name: "", quantity: 1, unit_price: 0, total_price: 0, maxStock: 0 }]);
      setDiscount(0);
      setOpen(false);
    } catch (error) {
      console.error("Error creating sale:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(openState) => {
        setOpen(openState);
        if (!openState) {
          setShowCustomerDropdown(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="gradient" className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          {t('sale.recordSale')}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90%] max-h-[90vh] flex flex-col md:max-w-md p-4">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('sale.recordNew')}
          </DialogTitle>
          <DialogDescription className="text-left mr-4">
            {t('sale.fillDetails')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6">
          {/* Sale Header */}
          <div className="grid grid-cols-1 gap-4">
            {/* Customer Name Input with Autocomplete */}
            <div className="relative">
              <Label htmlFor="customer-name">{t('nav.customers')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={customerInputRef}
                  id="customer-name"
                  placeholder={t('sale.walkInCustomer') || "Walk-in Customer / Type customer name"}
                  value={customerName}
                  onChange={(e) => handleCustomerInputChange(e.target.value)}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="h-12 text-base pl-9"
                  autoComplete="off"
                />
              </div>
              {isNewCustomer && customerName.trim() && (
                <p className="text-xs text-primary mt-1">
                  New customer — will be created automatically on save
                </p>
              )}
              {selectedCustomerId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Existing customer selected
                </p>
              )}
              {showCustomerDropdown && (filteredCustomers.length > 0 || customerName.trim()) && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md"
                >
                  {!customerName.trim() && (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer text-muted-foreground"
                      onClick={() => {
                        setCustomerName("");
                        setSelectedCustomerId(null);
                        setShowCustomerDropdown(false);
                      }}
                    >
                      {t('sale.walkInCustomer')} (no customer)
                    </button>
                  )}
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <span className="font-medium">{customer.name}</span>
                      {customer.phone && (
                        <span className="text-muted-foreground ml-2 text-xs">{customer.phone}</span>
                      )}
                    </button>
                  ))}
                  {isNewCustomer && customerName.trim() && (
                    <div className="px-3 py-2 text-sm border-t text-primary bg-primary/5">
                      <Plus className="inline h-3 w-3 mr-1" />
                      Create "{customerName.trim()}" as new customer
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="payment">{t('sale.paymentMethod')}</Label>
              <Select
                value={saleData.payment_method}
                onValueChange={(value) => setSaleData({ ...saleData, payment_method: value as any })}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder={t('sale.paymentMethod')} />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background">
                  <SelectItem value="cash">{t('payment.cash')}</SelectItem>
                  <SelectItem value="mobile_money">{t('payment.mobileMoney')}</SelectItem>
                  <SelectItem value="bank_transfer">{t('payment.bankTransfer')}</SelectItem>
                  <SelectItem value="credit">{t('payment.credit')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">{t('invoice.notes')}</Label>
              <Input
                id="notes"
                placeholder={t('invoice.additionalNotes')}
                value={saleData.notes}
                onChange={(e) => setSaleData({ ...saleData, notes: e.target.value })}
                className="h-12 text-base"
              />
            </div>
          </div>

          {/* Sale Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>{t('sale.saleItems')}</span>
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
                        <Select
                          onValueChange={(value) => selectProduct(index, value)}
                          value={item.product_id || ""}
                        >
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder={t('invoice.selectProduct')} />
                          </SelectTrigger>
                          <SelectContent className="z-50 bg-background">
                            {inventory
                              .filter((product) => product.id && product.id.trim() !== "")
                              .map((product) => (
                                <SelectItem key={product.id} value={product.id} disabled={product.stock_quantity === 0}>
                                  {product.name}{" "}
                                  {product.stock_quantity === 0 ? `(${t('sale.outOfStock')})` : `(${product.stock_quantity} ${t('sale.left')})`}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <Label>{t('invoice.quantity')}</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            min="1"
                            max={item.maxStock > 0 ? item.maxStock : undefined}
                            onChange={(e) => {
                              const inputValue = parseInt(e.target.value) || 1;
                              const qty = item.maxStock > 0 ? Math.min(inputValue, item.maxStock) : inputValue;
                              updateItem(index, "quantity", qty);
                            }}
                            className="h-12 text-base"
                            disabled={!item.product_id}
                          />
                          {item.maxStock > 0 && <p className="text-xs text-muted-foreground">{t('sale.max')}: {item.maxStock}</p>}
                        </div>

                        <div>
                          <Label>{t('invoice.price')}</Label>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                            className="h-12 text-base"
                            disabled={!item.product_id}
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

          {/* Sale Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {t('sale.saleSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t('invoice.subtotal')}:</span>
                  <span>Le {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="discount">{t('sale.discount')}:</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24 h-8 text-right"
                    min="0"
                    max={subtotal}
                    step="0.01"
                  />
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>{t('invoice.total').replace(' (Le)', '')}:</span>
                  <span>Le {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t('sale.paymentMethod')}:</span>
                  <span className="capitalize">{saleData.payment_method.replace("_", " ")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setCustomerName("");
                setSelectedCustomerId(null);
                setSaleData({ payment_method: "cash", notes: "" });
                setItems([{ product_name: "", quantity: 1, unit_price: 0, total_price: 0, maxStock: 0 }]);
                setDiscount(0);
                setOpen(false);
              }}
              className="order-2 sm:order-1 h-12 text-base"
            >
              {t('modal.cancel')}
            </Button>
            <Button
              variant="success"
              onClick={handleSave}
              disabled={loading || total <= 0}
              className="order-1 sm:order-2 h-12 text-base"
            >
              <Save className="h-4 w-4" />
              {loading ? t('sale.recording') : t('sale.recordSale')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
