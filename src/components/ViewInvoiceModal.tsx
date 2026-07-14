import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, User, MapPin, Phone, Mail } from "lucide-react";
import { Invoice } from "@/hooks/useInvoices";
import { ShareButton } from "@/components/ShareButton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface ViewInvoiceModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewInvoiceModal({ invoice, open, onOpenChange }: ViewInvoiceModalProps) {
  const { t } = useLanguage();
  
  if (!invoice) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "overdue":
        return "destructive";
      case "sent":
        return "default";
      case "draft":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const generateInvoicePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.text(t("receipt.invoice"), pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`${t("invoice.invoiceNumber")} ${invoice.invoice_number}`, 20, 40);
    doc.text(`${t("invoice.invoiceDate")}: ${format(new Date(invoice.invoice_date), "PPP")}`, 20, 50);
    if (invoice.due_date) {
      doc.text(`${t("invoice.dueDate")}: ${format(new Date(invoice.due_date), "PPP")}`, 20, 60);
    }

    doc.setFontSize(10);
    doc.text(`${t("sale.customer")}: ${invoice.customer?.name || "N/A"}`, 20, 75);
    if (invoice.customer?.email) {
      doc.text(`${t("customer.email")}: ${invoice.customer.email}`, 20, 82);
    }
    if (invoice.customer?.phone) {
      doc.text(`${t("customer.phone")}: ${invoice.customer.phone}`, 20, 89);
    }

    const startY = invoice.customer?.phone ? 100 : invoice.customer?.email ? 93 : 86;

    doc.setFontSize(14);
    doc.text(`${t("invoice.total")}: Le ${invoice.total_amount.toLocaleString()}`, 20, startY + 10);
    doc.text(`${t("invoice.paidAmount")}: Le ${invoice.paid_amount.toLocaleString()}`, 20, startY + 20);
    doc.text(`${t("invoices.status")}: ${invoice.status.toUpperCase()}`, 20, startY + 30);

    if (invoice.notes) {
      doc.setFontSize(10);
      doc.text(`${t("invoice.notes")}:`, 20, startY + 45);
      const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 40);
      doc.text(splitNotes, 20, startY + 52);
    }

    return doc;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] md:max-w-4xl max-h-[90vh] flex flex-col p-4">
        <DialogHeader className="flex-shrink">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("receipt.invoice")} {invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{t("invoice.invoiceDetails")}</CardTitle>
                  <p className="text-muted-foreground">{t("invoice.invoiceNumber")} {invoice.invoice_number}</p>
                </div>
                <Badge variant={getStatusVariant(invoice.status)} className="text-sm">
                  {invoice.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{t("invoice.invoiceDate")}:</span>
                    <span className="text-sm">{new Date(invoice.invoice_date).toLocaleDateString()}</span>
                  </div>
                  {invoice.due_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t("invoice.dueDate")}:</span>
                      <span className="text-sm">{new Date(invoice.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{t("invoice.totalAmount")}</div>
                    <div className="text-2xl font-bold">Le {invoice.total_amount.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{t("invoice.paidAmount")}</div>
                    <div className="text-lg font-semibold text-success">Le {invoice.paid_amount.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {invoice.customer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("invoice.customerInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{invoice.customer.name}</span>
                  </div>
                  {invoice.customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{invoice.customer.email}</span>
                    </div>
                  )}
                  {invoice.customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{invoice.customer.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>{t("invoice.invoiceItems")}</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.invoice_items && invoice.invoice_items.length > 0 ? (
                <div className="space-y-3">
                  {invoice.invoice_items.map((item, index) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {t("invoice.quantity")}: {item.quantity} × Le {item.unit_price.toLocaleString()}
                        </div>
                      </div>
                      <div className="font-semibold">Le {item.total_price.toLocaleString()}</div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>{t("invoice.subtotal")}:</span>
                      <span>Le {invoice.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("invoice.tax")}:</span>
                      <span>Le {invoice.tax_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>{t("invoice.total")}:</span>
                      <span>Le {invoice.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">{t("invoice.noItems")}</div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t("invoice.notes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Share Section */}
          <div className="pt-4 border-t">
            <ShareButton
              documentType="invoice"
              documentData={{
                invoiceNumber: invoice.invoice_number,
                date: format(new Date(invoice.invoice_date), "PPP"),
                customer: invoice.customer?.name || "N/A",
                total: `Le ${invoice.total_amount.toLocaleString()}`,
                status: invoice.status,
                dueDate: invoice.due_date ? format(new Date(invoice.due_date), "PPP") : undefined,
              }}
              generatePDF={generateInvoicePDF}
              subject={`${t("receipt.invoice")} ${invoice.invoice_number}`}
              fileName={`invoice-${invoice.invoice_number}.pdf`}
              whatsappMessage={`${t("receipt.invoice")} ${invoice.invoice_number} for Le ${invoice.total_amount.toLocaleString()} - ${t("invoice.dueDate")}: ${invoice.due_date ? format(new Date(invoice.due_date), "PPP") : "N/A"}`}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}