import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Plus, Calendar, Search, Edit, Trash2, Eye, Receipt, FileText } from "lucide-react";
import { LeCurrency } from "@/components/ui/le-currency";
import { RecordSaleModal } from "@/components/RecordSaleModal";
import { ViewSaleModal } from "@/components/ViewSaleModal";
import { EditSaleModal } from "@/components/EditSaleModal";
import { GenerateReceiptModal } from "@/components/GenerateReceiptModal";
import { ViewInvoiceModal } from "@/components/ViewInvoiceModal";
import { TotalRevenueModal } from "@/components/TotalRevenueModal";
import { TodaySalesModal } from "@/components/TodaySalesModal";
import { TotalOrdersModal } from "@/components/TotalOrdersModal";
import { useState, useMemo, useEffect } from "react";
import { useSales, Sale } from "@/hooks/useSales";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useUserProfile } from "@/hooks/useUserProfile";

interface UnifiedTransaction {
  id: string;
  source: "sale" | "invoice";
  customer_name: string | null;
  date: string;
  total_amount: number;
  payment_method: string;
  notes: string | null;
  invoice_number?: string;
  invoice_status?: string;
  originalSale?: Sale;
  originalInvoice?: Invoice;
}

const ITEMS_PER_PAGE = 10;

const Sales = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "sales" | "invoices">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<Invoice | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [invoiceReceiptModalOpen, setInvoiceReceiptModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [todaySalesModalOpen, setTodaySalesModalOpen] = useState(false);
  const [totalOrdersModalOpen, setTotalOrdersModalOpen] = useState(false);
  const { business, loading: businessLoading } = useUserProfile();
  const businessId = business?.id;
  const { sales, loading, deleteSale, refetch } = useSales(businessId);
  const { invoices, loading: invoicesLoading, refetch: refetchInvoices } = useInvoices(businessId);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, paymentFilter, sourceFilter]);

  // Get paid invoices for revenue calculation
  const paidInvoices = useMemo(() => invoices.filter((invoice) => invoice.status === "paid"), [invoices]);

  // Create unified transactions list (all invoices, not just paid)
  const unifiedTransactions = useMemo(() => {
    const salesTransactions: UnifiedTransaction[] = sales.map((sale) => ({
      id: sale.id,
      source: "sale" as const,
      customer_name: sale.customer?.name || null,
      date: sale.sale_date,
      total_amount: sale.total_amount,
      payment_method: sale.payment_method,
      notes: sale.notes,
      originalSale: sale,
    }));

    const invoiceTransactions: UnifiedTransaction[] = invoices.map((invoice) => ({
      id: invoice.id,
      source: "invoice" as const,
      customer_name: invoice.customer?.name || null,
      date: invoice.invoice_date,
      total_amount: Number(invoice.total_amount) || 0,
      payment_method: invoice.status === "paid" ? "bank_transfer" : "-",
      notes: `Invoice #${invoice.invoice_number}`,
      invoice_number: invoice.invoice_number,
      invoice_status: invoice.status,
      originalInvoice: invoice,
    }));

    // Combine and sort by date descending
    return [...salesTransactions, ...invoiceTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [sales, invoices]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return unifiedTransactions.filter((transaction) => {
      // Source filter
      if (sourceFilter === "sales" && transaction.source !== "sale") return false;
      if (sourceFilter === "invoices" && transaction.source !== "invoice") return false;

      // Search filter
      const matchesSearch =
        transaction.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.payment_method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());

      // Payment method filter (only apply to sales, invoices always show when source filter includes them)
      if (paymentFilter === "all") return matchesSearch;
      if (transaction.source === "invoice") return matchesSearch; // Don't filter invoices by payment method
      return matchesSearch && transaction.payment_method === paymentFilter;
    });
  }, [unifiedTransactions, sourceFilter, searchQuery, paymentFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 2) pages.push("ellipsis");
      if (currentPage !== 1 && currentPage !== totalPages) {
        pages.push(currentPage);
      }
      if (currentPage < totalPages - 1) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

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

  const getInvoiceStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "sent":
        return "default";
      case "draft":
        return "secondary";
      case "overdue":
        return "destructive";
      case "cancelled":
        return "outline";
      default:
        return "secondary";
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm(t("sales.confirmDelete"))) return;
    await deleteSale(saleId);
  };

  // Statistics
  const salesRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const invoiceRevenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);
  const totalRevenue = salesRevenue + invoiceRevenue;

  const todaySales = sales.filter((s) => new Date(s.sale_date).toDateString() === new Date().toDateString());
  const todayInvoices = invoices.filter((i) => new Date(i.invoice_date).toDateString() === new Date().toDateString());
  const todayTotalSales = todaySales.reduce((total, sale) => {
    total += sale.total_amount;
    return total;
  }, 0);
  const todayTotalInvoices = todayInvoices.reduce((total, invoice) => {
    total += invoice.total_amount;
    return total;
  }, 0);
  const todayTransactions = todayTotalSales + todayTotalInvoices;

  const creditSales = sales.filter((s) => s.payment_method === "credit");
  const creditSalesAmount = creditSales.reduce((sum, sale) => sum + sale.total_amount, 0);

  // Include unpaid invoices (draft, sent, overdue) in outstanding amount
  const unpaidInvoices = invoices.filter((i) => ["draft", "sent", "overdue"].includes(i.status || "draft"));
  const unpaidInvoiceAmount = unpaidInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);
  const totalOutstandingAmount = creditSalesAmount + unpaidInvoiceAmount;

  const totalTransactions = sales.length + invoices.length;

  if (loading || invoicesLoading || businessLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm">{t("sales.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("sales.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t("sales.description")}</p>
        </div>
        <RecordSaleModal onSaleCreated={refetch} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card
          className="professional-card cursor-pointer hover:border-primary transition-colors"
          onClick={() => setRevenueModalOpen(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <LeCurrency className="h-5 w-5 text-prosperity-green" />
              <span className="text-sm font-medium">{t("sales.totalRevenue")}</span>
            </div>
            <div className="text-2xl font-bold mt-2 text-prosperity-green">Le {totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-warning" />
              <span className="text-sm font-medium">{t("sales.creditSales")}</span>
            </div>
            <div className="text-2xl font-bold mt-2 text-warning">Le {totalOutstandingAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card
          className="professional-card cursor-pointer hover:border-primary transition-colors"
          onClick={() => setTodaySalesModalOpen(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{t("sales.todaySales")}</span>
            </div>
            <div className="text-2xl font-bold mt-2">Le {todayTransactions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card
          className="professional-card cursor-pointer hover:border-primary transition-colors"
          onClick={() => setTotalOrdersModalOpen(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-info" />
              <span className="text-sm font-medium">{t("sales.totalOrders")}</span>
            </div>
            <div className="text-2xl font-bold mt-2">{totalTransactions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Source Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={sourceFilter === "all" ? "default" : "outline"}
          onClick={() => setSourceFilter("all")}
          size="sm"
        >
          {t("sales.filter.all")}
        </Button>
        <Button
          variant={sourceFilter === "sales" ? "default" : "outline"}
          onClick={() => setSourceFilter("sales")}
          size="sm"
        >
          {t("sales.filter.direct")}
        </Button>
        <Button
          variant={sourceFilter === "invoices" ? "default" : "outline"}
          onClick={() => setSourceFilter("invoices")}
          size="sm"
        >
          {t("sales.filter.invoices")}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="professional-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("sales.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("sales.paymentMethod")} />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">{t("sales.payment.all")}</SelectItem>
                <SelectItem value="cash">{t("sales.cash")}</SelectItem>
                <SelectItem value="mobile_money">{t("sales.mobileMoney")}</SelectItem>
                <SelectItem value="bank_transfer">{t("sales.bankTransfer")}</SelectItem>
                <SelectItem value="credit">{t("sales.credit")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle>
            {t("sales.recentSales")} ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("sales.noSales")}</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? t("sales.adjustSearch") : t("sales.recordFirst")}
              </p>
              {!searchQuery && <RecordSaleModal onSaleCreated={refetch} />}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {paginatedTransactions.map((transaction) => (
                  <Card key={`${transaction.source}-${transaction.id}`} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {transaction.customer_name || t("sale.walkInCustomer")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                        {transaction.source === "sale" ? (
                          <Badge variant="success" className="text-xs">
                            {t("sales.type.sale")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {t("sales.type.invoice")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg font-bold text-primary">Le {transaction.total_amount.toLocaleString()}</p>
                      <div className="flex justify-end items-center">
                        <div className="flex items-center gap-1">
                          {transaction.source === "sale" && transaction.originalSale ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSelectedSale(transaction.originalSale!);
                                    setReceiptModalOpen(true);
                                  }}
                                  title={t("sales.generateReceipt")}
                                >
                                  <Receipt className="h-4 w-4" />
                                </Button>
                              <ViewSaleModal sale={transaction.originalSale} />
                              <EditSaleModal sale={transaction.originalSale} onSaleUpdated={refetch} />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSale(transaction.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : transaction.originalInvoice ? (
                            <>
                              {transaction.invoice_status === "paid" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedInvoiceForReceipt(transaction.originalInvoice!);
                                    setInvoiceReceiptModalOpen(true);
                                  }}
                                >
                                  <Receipt className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedInvoice(transaction.originalInvoice!);
                                  setInvoiceModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                      {transaction.notes && transaction.source === "sale" && (
                        <p className="text-sm text-muted-foreground mt-2 truncate">{transaction.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">{t("sales.customer")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("sales.date")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("sales.amount")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("sales.source")}</TableHead>
                      <TableHead>{t("sales.notes")}</TableHead>
                      <TableHead className="text-right min-w-[100px]">{t("sales.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((transaction) => (
                      <TableRow key={`${transaction.source}-${transaction.id}`}>
                        <TableCell className="font-medium">{transaction.customer_name || t("sale.walkInCustomer")}</TableCell>
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">Le {transaction.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          {transaction.source === "sale" ? (
                            <Badge variant="success">{t("sales.type.sale")}</Badge>
                          ) : (
                            <Badge variant="secondary">
                              <FileText className="h-3 w-3 mr-1" />
                              {t("sales.type.invoice")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{transaction.source === "sale" ? transaction.notes || "-" : "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {transaction.source === "sale" && transaction.originalSale ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSale(transaction.originalSale!);
                                    setReceiptModalOpen(true);
                                  }}
                                  title={t("sales.generateReceipt")}
                                >
                                  <Receipt className="h-4 w-4" />
                                </Button>
                                <ViewSaleModal sale={transaction.originalSale} />
                                <EditSaleModal sale={transaction.originalSale} onSaleUpdated={refetch} />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSale(transaction.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : transaction.originalInvoice ? (
                              <>
                                {transaction.invoice_status === "paid" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                    setSelectedInvoiceForReceipt(transaction.originalInvoice!);
                                    setInvoiceReceiptModalOpen(true);
                                  }}
                                  title={t("sales.generateReceipt")}
                                >
                                  <Receipt className="h-4 w-4" />
                                </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedInvoice(transaction.originalInvoice!);
                                    setInvoiceModalOpen(true);
                                  }}
                                  title={t("sales.viewInvoice")}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {t("pagination.showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} {t("pagination.to")}{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} {t("pagination.of")}{" "}
                    {filteredTransactions.length} {t("sales.transactions")}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      <div className="hidden md:flex">
                        {getPageNumbers().map((page, index) =>
                          page === "ellipsis" ? (
                            <PaginationItem key={`ellipsis-${index}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ),
                        )}
                      </div>
                      <PaginationItem className="md:hidden">
                        {currentPage} {t("pagination.of")} {totalPages}
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedSale && (
        <GenerateReceiptModal sale={selectedSale} open={receiptModalOpen} onOpenChange={setReceiptModalOpen} />
      )}
      {selectedInvoiceForReceipt && (
        <GenerateReceiptModal
          invoice={selectedInvoiceForReceipt}
          open={invoiceReceiptModalOpen}
          onOpenChange={setInvoiceReceiptModalOpen}
        />
      )}
      {selectedInvoice && (
        <ViewInvoiceModal invoice={selectedInvoice} open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen} />
      )}
      <TotalRevenueModal
        isOpen={revenueModalOpen}
        onClose={() => setRevenueModalOpen(false)}
        sales={sales}
        paidInvoices={paidInvoices}
        totalRevenue={totalRevenue}
        salesRevenue={salesRevenue}
        invoiceRevenue={invoiceRevenue}
      />
      <TodaySalesModal
        isOpen={todaySalesModalOpen}
        onClose={() => setTodaySalesModalOpen(false)}
        todaySales={sales.filter((s) => new Date(s.sale_date).toDateString() === new Date().toDateString())}
        todayInvoices={invoices.filter((i) => new Date(i.invoice_date).toDateString() === new Date().toDateString())}
      />
      <TotalOrdersModal
        isOpen={totalOrdersModalOpen}
        onClose={() => setTotalOrdersModalOpen(false)}
        sales={sales}
        invoices={invoices}
      />
    </div>
  );
};

export default Sales;
