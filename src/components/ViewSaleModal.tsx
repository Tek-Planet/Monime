import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar, DollarSign, User, CreditCard, FileText, Package } from "lucide-react";
import { Sale } from "@/hooks/useSales";
import { ShareButton } from "@/components/ShareButton";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

interface SaleItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ViewSaleModalProps {
  sale: Sale;
}

export function ViewSaleModal({ sale }: ViewSaleModalProps) {
  const { t } = useLanguage();
  
  const { data: saleItems = [] } = useQuery({
    queryKey: ['sale-items', sale.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sale_items')
        .select('id, product_name, quantity, unit_price, total_price')
        .eq('sale_id', sale.id);
      if (error) throw error;
      return data as SaleItem[];
    }
  });
  
  const getPaymentMethodVariant = (method: string) => {
    switch (method) {
      case "cash":
        return "success";
      case "mobile_money":
        return "default";
      case "bank_transfer":
        return "secondary";
      case "credit":
        return "warning";
      default:
        return "secondary";
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return t("payment.cash");
      case "mobile_money":
        return t("payment.mobileMoney");
      case "bank_transfer":
        return t("payment.bankTransfer");
      case "credit":
        return t("payment.credit");
      default:
        return method.replace("_", " ");
    }
  };

  const generateSalePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.text(t("receipt.saleReceipt"), pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`${t("expense.date")}: ${format(new Date(sale.sale_date), "PPP")}`, 20, 40);
    doc.text(`${t("sale.customer")}: ${sale.customer?.name || t("sale.walkInCustomer")}`, 20, 50);
    doc.text(`${t("sale.paymentMethod")}: ${getPaymentMethodLabel(sale.payment_method)}`, 20, 60);

    doc.setFontSize(14);
    doc.text(`${t("invoice.totalAmount")}: Le ${sale.total_amount.toLocaleString()}`, 20, 80);

    if (sale.notes) {
      doc.setFontSize(10);
      doc.text(`${t("invoice.notes")}:`, 20, 100);
      doc.text(sale.notes, 20, 110);
    }

    return doc;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90%] max-h-[90vh] flex flex-col md:max-w-md p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogTitle>{t("sale.saleDetails")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {t("sale.customer")}
              </div>
              <p className="font-medium">{sale.customer?.name || t("sale.walkInCustomer")}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {t("expense.date")}
              </div>
              <p className="font-medium">{new Date(sale.sale_date).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                {t("expense.amount")}
              </div>
              <p className="font-bold text-lg text-prosperity-green">Le {sale.total_amount.toLocaleString()}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                {t("sale.paymentMethod")}
              </div>
              <Badge variant={getPaymentMethodVariant(sale.payment_method)}>
                {getPaymentMethodLabel(sale.payment_method)}
              </Badge>
            </div>
          </div>

          {sale.customer?.email && (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">{t("customer.email")}</div>
              <p className="font-medium">{sale.customer.email}</p>
            </div>
          )}

          {sale.customer?.phone && (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">{t("customer.phone")}</div>
              <p className="font-medium">{sale.customer.phone}</p>
            </div>
          )}

          {saleItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                {t("sale.productsSold")}
              </div>
              <div className="bg-muted rounded-lg p-3 space-y-2">
                {saleItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">{item.product_name}</span>
                      <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-medium">Le {item.total_price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sale.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {t("invoice.notes")}
              </div>
              <p className="text-sm bg-muted p-3 rounded-lg">{sale.notes}</p>
            </div>
          )}

          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">{t("common.created")}: {new Date(sale.created_at).toLocaleString()}</div>
          </div>

          <div className="pt-4">
            <ShareButton
              documentType="sale"
              documentData={{
                date: format(new Date(sale.sale_date), "PPP"),
                customer: sale.customer?.name || t("sale.walkInCustomer"),
                total: `Le ${sale.total_amount.toLocaleString()}`,
                paymentMethod: getPaymentMethodLabel(sale.payment_method),
              }}
              generatePDF={generateSalePDF}
              subject={`${t("receipt.saleReceipt")} - ${format(new Date(sale.sale_date), "PPP")}`}
              fileName={`sale-receipt-${sale.id}.pdf`}
              whatsappMessage={`${t("receipt.saleReceipt")} for Le ${sale.total_amount.toLocaleString()} - ${format(new Date(sale.sale_date), "PPP")}`}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}