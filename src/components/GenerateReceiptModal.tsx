import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Receipt, Share, Download } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReceiptItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface GenerateReceiptModalProps {
  sale?: any;
  invoice?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateReceiptModal({ sale, invoice, open, onOpenChange }: GenerateReceiptModalProps) {
  const { t } = useLanguage();
  const data = sale || invoice;
  const isInvoice = !!invoice;

  const { data: items = [] } = useQuery<ReceiptItem[]>({
    queryKey: [isInvoice ? "invoice-items-receipt" : "sale-items-receipt", data?.id],
    queryFn: async (): Promise<ReceiptItem[]> => {
      if (!data?.id) return [];

      if (isInvoice) {
        const { data: itemsData, error } = await supabase
          .from("invoice_items")
          .select("id, product_name, quantity, unit_price, total_price")
          .eq("invoice_id", data.id);
        if (error) throw error;
        return (itemsData || []) as ReceiptItem[];
      } else {
        const { data: itemsData, error } = await supabase
          .from("sale_items")
          .select("id, product_name, quantity, unit_price, total_price")
          .eq("sale_id", data.id);
        if (error) throw error;
        return (itemsData || []) as ReceiptItem[];
      }
    },
    enabled: open && !!data?.id,
  });

  if (!data) return null;

  const getDate = () => {
    const dateStr = data.sale_date || data.invoice_date;
    return dateStr ? new Date(dateStr).toLocaleDateString() : "N/A";
  };

  const getCustomerName = () => {
    return data.customer?.name || t("sale.walkInCustomer");
  };

  const getPaymentInfo = () => {
    if (isInvoice) {
      return data.status?.toUpperCase() || "PENDING";
    }
    return data.payment_method?.replace("_", " ").toUpperCase() || t("payment.cash").toUpperCase();
  };

  const getTotalAmount = () => {
    return data.total_amount || 0;
  };

  const generateReceiptText = () => {
    const itemsList =
      items.length > 0
        ? items
            .map(
              (item) =>
                `📦 ${item.product_name} x${item.quantity} @ Le ${item.unit_price.toLocaleString()} = Le ${item.total_price.toLocaleString()}`,
            )
            .join("\n")
        : "";

    return `
🧾 ${isInvoice ? t("receipt.invoice").toUpperCase() : t("receipt.receipt").toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━
📅 ${t("expense.date")}: ${getDate()}
👤 ${t("sale.customer")}: ${getCustomerName()}
💳 ${isInvoice ? t("invoices.status") : t("sale.paymentMethod")}: ${getPaymentInfo()}
${isInvoice && data.invoice_number ? `📋 ${t("invoice.invoiceNumber")}: ${data.invoice_number}` : ""}

${itemsList ? `📋 ${t("invoice.invoiceItems").toUpperCase()}:\n${itemsList}\n` : ""}
💰 ${t("invoice.total").toUpperCase()}: Le ${getTotalAmount().toFixed(2)}

${data.notes ? `📝 ${t("invoice.notes")}: ${data.notes}` : ""}

${t("receipt.thankYou")} 🙏
━━━━━━━━━━━━━━━━━━━━━━━━━
${t("receipt.generatedVia")}
`.trim();
  };

  const generateReceiptPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.text(isInvoice ? t("receipt.invoice").toUpperCase() : t("receipt.receipt").toUpperCase(), pageWidth / 2, 20, { align: "center" });

    // Content
    doc.setFontSize(12);
    let yPos = 40;
    
    if (isInvoice && data.invoice_number) {
      doc.text(`${t("invoice.invoiceNumber")}: ${data.invoice_number}`, 20, yPos);
      yPos += 10;
    }
    
    doc.text(`${t("expense.date")}: ${getDate()}`, 20, yPos);
    yPos += 10;
    doc.text(`${t("sale.customer")}: ${getCustomerName()}`, 20, yPos);
    yPos += 10;
    doc.text(`${isInvoice ? t("invoices.status") : t("sale.paymentMethod")}: ${getPaymentInfo()}`, 20, yPos);
    yPos += 15;

    // Items section
    if (items.length > 0) {
      doc.setFontSize(12);
      doc.text(`${t("invoice.invoiceItems")}:`, 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      items.forEach((item) => {
        doc.text(`${item.product_name} x${item.quantity} @ Le ${item.unit_price.toLocaleString()}`, 25, yPos);
        doc.text(`Le ${item.total_price.toLocaleString()}`, pageWidth - 40, yPos);
        yPos += 7;
      });
      yPos += 8;
    }

    doc.setFontSize(14);
    doc.text(`${t("invoice.total").toUpperCase()}: Le ${getTotalAmount().toFixed(2)}`, 20, yPos);
    yPos += 15;

    if (data.notes) {
      doc.setFontSize(10);
      doc.text(`${t("invoice.notes")}: ${data.notes}`, 20, yPos);
    }

    yPos += 20;
    doc.setFontSize(10);
    doc.text(t("receipt.thankYou"), pageWidth / 2, yPos, { align: "center" });

    return doc;
  };

  const handleCopyReceipt = async () => {
    const receiptText = generateReceiptText();
    try {
      await navigator.clipboard.writeText(receiptText);
    } catch (err) {
      console.error("Failed to copy receipt:", err);
    }
  };

  const handleDownloadReceipt = () => {
    const receiptText = generateReceiptText();
    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${data.id?.slice(0, 8) || "unknown"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-h-[90vh] flex flex-col md:max-w-md p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {isInvoice ? t("receipt.invoiceReceipt") : t("receipt.saleReceipt")}
          </DialogTitle>
          <DialogDescription>{t("receipt.shareOrDownload")} {isInvoice ? t("receipt.invoice").toLowerCase() : t("receipt.sale").toLowerCase()}.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">
          {/* Receipt Preview */}
          <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-line">{generateReceiptText()}</div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <p className="font-bold text-sm">{t("receipt.shareVia")}</p>
            <ShareButton
              documentType={isInvoice ? "invoice" : "sale"}
              documentData={isInvoice ? {
                invoiceNumber: data.invoice_number || "N/A",
                date: getDate(),
                customer: getCustomerName(),
                total: `Le ${getTotalAmount().toFixed(2)}`,
                status: data.status || "pending",
                dueDate: data.due_date ? new Date(data.due_date).toLocaleDateString() : undefined,
              } : {
                date: getDate(),
                customer: getCustomerName(),
                total: `Le ${getTotalAmount().toFixed(2)}`,
                paymentMethod: getPaymentInfo(),
              }}
              generatePDF={generateReceiptPDF}
              subject={`${t("receipt.receipt")} - ${getCustomerName()}`}
              fileName={`receipt-${data.id?.slice(0, 8) || "unknown"}.pdf`}
              whatsappMessage={generateReceiptText()}
              toastLabel={t("receipt.receipt")}
            />

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleCopyReceipt} variant="outline">
                <Share className="h-4 w-4" />
                {t("receipt.copyReceipt")}
              </Button>

              <Button onClick={handleDownloadReceipt} variant="outline">
                <Download className="h-4 w-4" />
                {t("receipt.download")}
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t("modal.close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}