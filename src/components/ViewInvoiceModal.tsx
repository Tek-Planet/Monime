import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, User, MapPin, Phone, Mail } from "lucide-react";
import { Invoice } from "@/hooks/useInvoices";
import { ShareButton } from "@/components/ShareButton";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { createModernPDFDocument, renderModernTable, addTotalsAndNotes, addPDFPageFooters } from "@/lib/pdfTemplate";

interface ViewInvoiceModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewInvoiceModal({ invoice, open, onOpenChange }: ViewInvoiceModalProps) {
  const { t } = useLanguage();
  const { business, profilePhoto } = useUserProfile();
  
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

  const generateInvoicePDF = async () => {
    const currency = business?.currency || "SLL";
    const logoUrl = profilePhoto?.url || null;

    const { doc, startY } = await createModernPDFDocument({
      docType: "invoice",
      title: t("receipt.invoice") || "INVOICE",
      docNumber: `INV-${invoice.invoice_number}`,
      date: format(new Date(invoice.invoice_date), "PPP"),
      dueDate: invoice.due_date ? format(new Date(invoice.due_date), "PPP") : undefined,
      status: invoice.status,
      business: {
        business_name: business?.business_name || t("business.defaultname"),
        address: business?.address || null,
        phone: business?.phone || null,
        email: business?.email || null,
        currency: currency,
        logoUrl: logoUrl,
      },
      customer: invoice.customer ? {
        label: (t("invoice.customerInfo") || "BILL TO").toUpperCase(),
        name: invoice.customer.name,
        phone: invoice.customer.phone || null,
        email: invoice.customer.email || null,
        address: invoice.customer.address || null,
      } : undefined,
      notes: invoice.notes || undefined,
    });

    // Render Invoice Items Table
    const tableBody = (invoice.invoice_items || []).map((item, idx) => [
      `${idx + 1}`,
      item.product_name,
      `${item.quantity}`,
      `${currency} ${item.unit_price.toLocaleString()}`,
      `${currency} ${item.total_price.toLocaleString()}`,
    ]);

    renderModernTable(doc, {
      startY: startY,
      head: [["#", t("reports.pdf.product") || "Item", t("invoice.quantity") || "Qty", t("reports.pdf.unitPrice") || "Unit Price", t("invoice.total") || "Total"]],
      body: tableBody.length > 0 ? tableBody : [["1", "General Goods / Services", "1", `${currency} ${invoice.total_amount.toLocaleString()}`, `${currency} ${invoice.total_amount.toLocaleString()}`]],
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 38, halign: "right" },
        4: { cellWidth: 42, halign: "right" },
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || startY + 20;
    const balanceDue = invoice.total_amount - (invoice.paid_amount || 0);

    addTotalsAndNotes(doc, {
      startY: finalY,
      notes: invoice.notes || undefined,
      totals: [
        { label: "Subtotal:", value: `${currency} ${(invoice.subtotal || invoice.total_amount).toLocaleString()}` },
        { label: "Tax Amount:", value: `${currency} ${(invoice.tax_amount || 0).toLocaleString()}` },
        { label: "Amount Paid:", value: `${currency} ${(invoice.paid_amount || 0).toLocaleString()}` },
        { label: "Balance Due:", value: `${currency} ${balanceDue.toLocaleString()}`, isBold: true },
        { label: "Total Amount:", value: `${currency} ${invoice.total_amount.toLocaleString()}`, isHighlight: true },
      ],
    });

    addPDFPageFooters(doc, {
      title: "INVOICE",
      business: { business_name: business?.business_name },
    });

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