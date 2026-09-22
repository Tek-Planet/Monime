import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Calendar, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Receipt as ReceiptIcon, 
  CreditCard, 
  Clock,
  Download
} from "lucide-react";
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
  onRecordPayment?: (invoice: Invoice) => void;
}

export function ViewInvoiceModal({ invoice, open, onOpenChange, onRecordPayment }: ViewInvoiceModalProps) {
  const { t } = useLanguage();
  const { business, profilePhoto } = useUserProfile();
  
  if (!invoice) return null;

  const currency = business?.currency || "SLL";
  const paidAmount = invoice.paid_amount || 0;
  const balanceDue = Math.max(0, invoice.total_amount - paidAmount);
  const isPaid = invoice.status === "paid" || balanceDue === 0;
  const isOverdue = !!(invoice.due_date && new Date(invoice.due_date) < new Date() && balanceDue > 0);

  const docTypeLabel = isPaid 
    ? (t("receipt.receipt") || "RECEIPT") 
    : (t("receipt.invoice") || "INVOICE");

  const docNumberFormatted = isPaid
    ? (invoice.invoice_number.startsWith("REC-") ? invoice.invoice_number : `REC-${invoice.invoice_number.replace(/^INV-/, "")}`)
    : (invoice.invoice_number.startsWith("INV-") ? invoice.invoice_number : `INV-${invoice.invoice_number}`);

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
      case "partial":
        return "outline";
      default:
        return "secondary";
    }
  };

  const generateInvoicePDF = async () => {
    const logoUrl = profilePhoto?.url || null;

    const { doc, startY } = await createModernPDFDocument({
      docType: isPaid ? "receipt" : "invoice",
      title: docTypeLabel.toUpperCase(),
      docNumber: docNumberFormatted,
      date: format(new Date(invoice.invoice_date), "PPP"),
      dueDate: invoice.due_date ? format(new Date(invoice.due_date), "PPP") : undefined,
      status: invoice.status,
      business: {
        business_name: business?.business_name || t("business.defaultname") || "MiBuks Business",
        address: business?.address || null,
        phone: business?.phone || null,
        email: business?.email || null,
        currency: currency,
        logoUrl: logoUrl,
      },
      customer: invoice.customer ? {
        label: (isPaid ? "RECEIVED FROM" : (t("invoice.customerInfo") || "BILL TO")).toUpperCase(),
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
      `${currency} ${item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `${currency} ${(item.total_price * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `${currency} ${item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ]);

    renderModernTable(doc, {
      startY: startY,
      head: [["#", t("reports.pdf.product") || "Product / Service", t("invoice.quantity") || "Qty", t("reports.pdf.unitPrice") || "Unit Price", "Tax (15%)", t("invoice.total") || "Total"]],
      body: tableBody.length > 0 ? tableBody : [["1", "General Goods / Services", "1", `${currency} ${invoice.total_amount.toLocaleString()}`, `${currency} ${(invoice.tax_amount || 0).toLocaleString()}`, `${currency} ${invoice.total_amount.toLocaleString()}`]],
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 16, halign: "center" },
        3: { cellWidth: 32, halign: "right" },
        4: { cellWidth: 26, halign: "right" },
        5: { cellWidth: 34, halign: "right" },
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || startY + 20;

    addTotalsAndNotes(doc, {
      startY: finalY,
      notes: invoice.notes || undefined,
      totals: [
        { label: "Subtotal:", value: `${currency} ${(invoice.subtotal || (invoice.total_amount - (invoice.tax_amount || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: "Tax (15%):", value: `${currency} ${(invoice.tax_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: "Total Amount:", value: `${currency} ${invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, isHighlight: true },
        { label: "Amount Paid:", value: `${currency} ${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: "Outstanding Balance:", value: `${currency} ${balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, isBold: true },
      ],
    });

    addPDFPageFooters(doc, {
      title: docTypeLabel.toUpperCase(),
      business: { business_name: business?.business_name },
    });

    return doc;
  };

  const handleDownloadDirectPDF = async () => {
    try {
      const doc = await generateInvoicePDF();
      doc.save(`${isPaid ? "receipt" : "invoice"}-${invoice.invoice_number}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] md:max-w-4xl max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="flex-shrink-0 pb-2 border-b border-border/60">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight">
              {isPaid ? <ReceiptIcon className="h-5 w-5 text-emerald-600" /> : <FileText className="h-5 w-5 text-primary" />}
              <span>{docTypeLabel}</span>
              <span className="font-mono text-sm sm:text-base font-semibold text-muted-foreground">
                {docNumberFormatted}
              </span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(invoice.status)} className="uppercase text-xs font-bold tracking-wide">
                {invoice.status}
              </Badge>
              {isPaid && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Paid in Full
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Printable/Viewable Invoice Template */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 py-3">
          {/* 1. User Business Header (Logo, Name, Address, Contact Details) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/70 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {profilePhoto?.url ? (
                  <img
                    src={profilePhoto.url}
                    alt={business?.business_name || "Business Logo"}
                    className="h-16 w-16 rounded-xl object-contain border border-border bg-white shadow-xs p-1 shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-extrabold text-xl shrink-0">
                    {business?.business_name ? business.business_name.slice(0, 2).toUpperCase() : <Building2 className="h-8 w-8" />}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                      {business?.business_name || t("business.defaultname") || "MiBuks Business"}
                    </h2>
                    {business?.business_type && (
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold text-muted-foreground hidden sm:inline-flex">
                        {business.business_type.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                  {business?.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span>{business.address}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {business?.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>{business.phone}</span>
                      </span>
                    )}
                    {business?.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>{business.email}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Meta (Invoice/Receipt #, Date, Due Date) */}
              <div className="text-left sm:text-right space-y-1 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  {docTypeLabel}
                </div>
                <div className="text-base font-extrabold text-primary font-mono">
                  {docNumberFormatted}
                </div>
                <div className="text-xs text-muted-foreground flex items-center sm:justify-end gap-1.5 pt-0.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Date: {format(new Date(invoice.invoice_date), "PPP")}</span>
                </div>
                {invoice.due_date && (
                  <div className={`text-xs flex items-center sm:justify-end gap-1.5 font-medium ${isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span>Due: {format(new Date(invoice.due_date), "PPP")}</span>
                    {isOverdue && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.2 rounded font-bold">OVERDUE</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Customer’s Name & Contact Details + Payment Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/60 bg-muted/15">
              <CardHeader className="py-2.5 px-4 bg-muted/30 border-b border-border/50">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {isPaid ? "Received From (Customer Details)" : (t("invoice.customerInfo") || "Bill To (Customer Details)")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-1.5 text-xs">
                <div className="font-bold text-sm text-foreground">
                  {invoice.customer?.name || "Walk-in Customer / Retail Client"}
                </div>
                {invoice.customer?.phone && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{invoice.customer.phone}</span>
                  </div>
                )}
                {invoice.customer?.email && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{invoice.customer.email}</span>
                  </div>
                )}
                {invoice.customer?.address ? (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{invoice.customer.address}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground/70 italic">
                    No physical address registered
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-muted/15">
              <CardHeader className="py-2.5 px-4 bg-muted/30 border-b border-border/50">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  Payment Summary & Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Operating Currency:</span>
                  <span className="font-semibold text-foreground">{currency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Due Date:</span>
                  <span className={`font-semibold ${isOverdue ? "text-destructive" : "text-foreground"}`}>
                    {invoice.due_date ? format(new Date(invoice.due_date), "PPP") : "Immediate / Due on Receipt"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Invoice Status:</span>
                  <Badge variant={getStatusVariant(invoice.status)} className="text-[11px] h-5 capitalize">
                    {invoice.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. Financial Status Cards: Total Amount, Amount Paid, Outstanding Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-border/70 bg-card shadow-xs">
              <span className="text-xs text-muted-foreground font-medium block mb-1">Total Amount</span>
              <span className="text-xl font-extrabold text-foreground tracking-tight font-mono">
                {currency} {invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Amount Paid</span>
                {paidAmount > 0 && (
                  <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 h-4 px-1.5">
                    Recorded
                  </Badge>
                )}
              </div>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
                {currency} {paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className={`p-4 rounded-xl border shadow-xs ${
              balanceDue > 0
                ? "border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20"
                : "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${balanceDue > 0 ? "text-amber-800 dark:text-amber-300" : "text-emerald-800 dark:text-emerald-300"}`}>
                  Outstanding Balance
                </span>
                {balanceDue <= 0 ? (
                  <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 h-4 px-1.5 font-bold">
                    Settled
                  </Badge>
                ) : isOverdue ? (
                  <Badge variant="destructive" className="text-[9px] h-4 px-1.5 font-bold">
                    Overdue
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 h-4 px-1.5 font-bold">
                    Pending
                  </Badge>
                )}
              </div>
              <span className={`text-xl font-extrabold tracking-tight font-mono ${balanceDue > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {currency} {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* 4. Products or Services Provided (Table with Qty, Price, Tax, and Total Amount) */}
          <Card className="border-border/60">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>{t("invoice.invoiceItems") || "Products & Services Provided"}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {(invoice.invoice_items || []).length} {(invoice.invoice_items?.length === 1 ? "item" : "items")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoice.invoice_items && invoice.invoice_items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground">
                        <th className="py-2.5 px-3 text-center w-10">#</th>
                        <th className="py-2.5 px-3 text-left">Description / Service</th>
                        <th className="py-2.5 px-3 text-center w-16">Qty</th>
                        <th className="py-2.5 px-3 text-right w-28">Unit Price</th>
                        <th className="py-2.5 px-3 text-right w-24">Tax (15%)</th>
                        <th className="py-2.5 px-3 text-right w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {invoice.invoice_items.map((item, index) => {
                        const itemTax = item.total_price * 0.15;
                        return (
                          <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-2.5 px-3 text-center text-muted-foreground">{index + 1}</td>
                            <td className="py-2.5 px-3 font-medium text-foreground">{item.product_name}</td>
                            <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                              {currency} {item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                              {currency} {itemTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-foreground font-mono">
                              {currency} {item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  {t("invoice.noItems") || "No line items registered for this invoice."}
                </div>
              )}

              {/* Financial Calculation Breakdown */}
              <div className="border-t border-border/60 p-4 bg-muted/15 flex justify-end">
                <div className="w-full sm:w-80 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("invoice.subtotal") || "Subtotal"}:</span>
                    <span className="font-mono font-medium text-foreground">
                      {currency} {(invoice.subtotal || invoice.total_amount - (invoice.tax_amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("invoice.tax") || "Tax (15% GST/VAT)"}:</span>
                    <span className="font-mono font-medium text-foreground">
                      {currency} {(invoice.tax_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-sm border-t border-border/60 pt-2 text-foreground">
                    <span>{t("invoice.total") || "Total Amount"}:</span>
                    <span className="font-mono text-primary">
                      {currency} {invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Amount Paid:</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      - {currency} {paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={`flex justify-between font-bold text-sm border-t border-border/60 pt-2 ${
                    balanceDue > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"
                  }`}>
                    <span>Outstanding Balance Due:</span>
                    <span className="font-mono">
                      {currency} {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Notes & Payment Instructions */}
          {invoice.notes && (
            <Card className="border-border/60 bg-muted/15">
              <CardHeader className="py-2.5 px-4 bg-muted/30 border-b border-border/50">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("invoice.notes") || "Notes & Payment Instructions"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 text-xs text-muted-foreground whitespace-pre-wrap">
                {invoice.notes}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 6. Footer Actions: Download PDF, Share (WhatsApp/Email), Record Payment */}
        <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadDirectPDF}
              className="text-xs font-medium flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
            {onRecordPayment && balanceDue > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onRecordPayment(invoice)}
                className="text-xs font-medium flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Record Payment
              </Button>
            )}
          </div>

          <ShareButton
            documentType={isPaid ? "receipt" : "invoice"}
            documentData={{
              invoiceNumber: docNumberFormatted,
              date: format(new Date(invoice.invoice_date), "PPP"),
              customer: invoice.customer?.name || "Walk-in Customer",
              total: `${currency} ${invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              status: invoice.status,
              dueDate: invoice.due_date ? format(new Date(invoice.due_date), "PPP") : undefined,
            }}
            generatePDF={generateInvoicePDF}
            subject={`${docTypeLabel} ${docNumberFormatted} - ${business?.business_name || "MiBuks"}`}
            fileName={`${isPaid ? "receipt" : "invoice"}-${invoice.invoice_number}.pdf`}
            whatsappMessage={`${docTypeLabel} ${docNumberFormatted} from ${business?.business_name || "MiBuks"}\nTotal: ${currency} ${invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nAmount Paid: ${currency} ${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nOutstanding Balance: ${currency} ${balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nDue Date: ${invoice.due_date ? format(new Date(invoice.due_date), "PPP") : "Immediate"}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
