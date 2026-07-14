import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, Phone, MapPin, Package, MessageSquare, Calendar, DollarSign, MessageCircle, Receipt, CreditCard } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/hooks/useSuppliers";
import { RecordSupplierPaymentModal } from "@/components/RecordSupplierPaymentModal";
import { formatCategory } from "@/lib/formatCategory";
import { useLanguage } from "@/contexts/LanguageContext";

interface SupplierPayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

interface LinkedExpense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  category: string | null;
  payment_method: string | null;
}

interface ViewSupplierModalProps {
  supplier: Supplier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onPaymentRecorded?: () => void;
}

export function ViewSupplierModal({ supplier, open, onOpenChange, onClose, onPaymentRecorded }: ViewSupplierModalProps) {
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [expenses, setExpenses] = useState<LinkedExpense[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const { t } = useLanguage();

  const handleCallSupplier = () => {
    if (supplier.phone) {
      window.open(`tel:${supplier.phone}`);
    }
  };

  const handleWhatsAppSupplier = () => {
    if (supplier.phone) {
      const cleanPhone = supplier.phone.replace(/[^\d]/g, "");
      window.open(`https://wa.me/${cleanPhone}`);
    }
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from("supplier_payments")
        .select("*")
        .eq("supplier_id", supplier.id)
        .order("payment_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("supplier_id", supplier.id)
        .order("expense_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    if (open && supplier) {
      fetchPayments();
      fetchExpenses();
    }
  }, [open, supplier?.id]);

  const handlePaymentRecorded = () => {
    fetchPayments();
    onPaymentRecorded?.();
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return t("payment.cash");
    switch (method) {
      case "cash":
        return t("payment.cash");
      case "bank_transfer":
        return t("payment.bankTransfer");
      case "mobile_money":
        return t("payment.mobileMoney");
      case "cheque":
        return t("payment.cheque");
      case "credit":
        return t("payment.credit");
      default:
        return method;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-w-[95vw] max-h-[80vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {t("supplier.supplierDetails")}
            </DialogTitle>
            <DialogDescription className="text-left">{t("supplier.viewInfo")}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">{t("supplier.details")}</TabsTrigger>
              <TabsTrigger value="payments">{t("supplier.payments")}</TabsTrigger>
              <TabsTrigger value="expenses">{t("expenses.title")}</TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto flex-1 mt-4">
              <TabsContent value="details" className="m-0 space-y-4">
                {/* Basic Info */}
                <div>
                  <h3 className="font-semibold text-lg">{supplier.name}</h3>
                  {supplier.product_category && (
                    <Badge variant="secondary" className="mt-2">
                      {formatCategory(supplier.product_category)}
                    </Badge>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  {supplier.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.phone}</span>
                      <div className="flex gap-2 ml-auto">
                        <Button size="sm" variant="outline" onClick={handleCallSupplier}>
                          {t("supplier.call")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleWhatsAppSupplier}>
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                  )}

                  {supplier.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.location}</span>
                    </div>
                  )}
                </div>

                {/* Balance Info */}
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{t("supplier.outstandingBalance")}</span>
                      </div>
                      <div className="text-2xl font-bold">
                        <span className={supplier.current_balance > 0 ? "text-orange-600" : "text-muted-foreground"}>
                          Le {supplier.current_balance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button variant="gradient" onClick={() => setPaymentModalOpen(true)}>
                      <DollarSign className="h-4 w-4 mr-1" />
                      {t("supplier.recordPayment")}
                    </Button>
                  </div>
                </div>

                {/* Notes */}
                {supplier.notes && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t("invoice.notes")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{supplier.notes}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{t("supplier.added")} {formatDistanceToNow(new Date(supplier.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>{t("supplier.lastUpdated")} {formatDistanceToNow(new Date(supplier.updated_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="m-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {t("supplier.paymentHistory")}
                    </h4>
                    <Button variant="gradient" size="sm" onClick={() => setPaymentModalOpen(true)}>
                      <DollarSign className="h-4 w-4 mr-1" />
                      {t("supplier.recordPayment")}
                    </Button>
                  </div>

                  {loadingPayments ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>{t("supplier.noPayments")}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("expense.date")}</TableHead>
                          <TableHead>{t("expense.amount")}</TableHead>
                          <TableHead>{t("supplier.method")}</TableHead>
                          <TableHead>{t("supplier.reference")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{format(new Date(payment.payment_date), "MMM d, yyyy")}</TableCell>
                            <TableCell className="font-medium text-green-600">Le {payment.amount.toFixed(2)}</TableCell>
                            <TableCell>{formatPaymentMethod(payment.payment_method)}</TableCell>
                            <TableCell className="text-muted-foreground">{payment.reference_number || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="expenses" className="m-0">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    {t("supplier.linkedExpenses")}
                  </h4>

                  {loadingExpenses ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : expenses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>{t("supplier.noExpenses")}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("expense.date")}</TableHead>
                          <TableHead>{t("expense.description")}</TableHead>
                          <TableHead>{t("expense.amount")}</TableHead>
                          <TableHead>{t("supplier.method")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>{format(new Date(expense.expense_date), "MMM d, yyyy")}</TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell className="font-medium">Le {expense.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatPaymentMethod(expense.payment_method)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex gap-3 pt-4 mt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t("modal.close")}
            </Button>
            {supplier.phone && (
              <Button onClick={handleWhatsAppSupplier} className="flex-1">
                <MessageCircle className="h-4 w-4 mr-1" />
                {t("supplier.contactSupplier")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RecordSupplierPaymentModal
        supplier={supplier}
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        onPaymentRecorded={handlePaymentRecorded}
      />
    </>
  );
}