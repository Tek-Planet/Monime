import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Search, Edit, Trash2, Eye, Calendar, Users, CreditCard } from "lucide-react";
import { LeCurrency } from "@/components/ui/le-currency";
import { CreateInvoiceModal } from "@/components/CreateInvoiceModal";
import { ViewInvoiceModal } from "@/components/ViewInvoiceModal";
import { EditInvoiceModal } from "@/components/EditInvoiceModal";
import { RecordInvoicePaymentModal } from "@/components/RecordInvoicePaymentModal";
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

import { useState, useMemo, useEffect } from "react";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { useLanguage } from "@/contexts/LanguageContext";

const ITEMS_PER_PAGE = 10;

const Invoices = () => {
  const { t, locale } = useLanguage();
  const { business, loading: businessLoading } = useUserProfile();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const businessId = business?.id;
  const { invoices, loading, deleteInvoice, refetch } = useInvoices(businessId);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.status.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "partial":
        return "warning";
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

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const getRemainingBalance = (invoice: Invoice) => {
    return invoice.total_amount - invoice.paid_amount;
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm(t("invoices.confirmDelete"))) return;
    await deleteInvoice(invoiceId);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditModalOpen(true);
  };

  if (loading || businessLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm">{t("invoices.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("invoices.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t("invoices.description")}</p>
        </div>
        <Button variant="gradient" className="w-full sm:w-auto" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("invoices.create")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{t("invoices.totalInvoices")}</span>
            </div>
            <div className="text-2xl font-bold mt-2">{invoices.length}</div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <LeCurrency className="h-5 w-5 text-success" />
              <span className="text-sm font-medium">{t("invoices.totalAmount")}</span>
            </div>
            <div className="text-2xl font-bold mt-2 text-success">
              Le{" "}
              {invoices
                .reduce((sum, invoice) => {
                  if (invoice.status === "cancelled") return sum;
                  return sum + invoice.total_amount;
                }, 0)
                .toLocaleString(locale)}
            </div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <LeCurrency className="h-5 w-5 text-warning" />
              <span className="text-sm font-medium">{t("invoices.outstanding")}</span>
            </div>
            <div className="text-2xl font-bold mt-2 text-warning">
              Le{" "}
              {invoices
                .reduce((sum, invoice) => {
                  if (invoice.status === "cancelled" || invoice.status === "paid") return sum;
                  return sum + (invoice.total_amount - invoice.paid_amount);
                }, 0)
                .toLocaleString(locale)}
            </div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-info" />
              <span className="text-sm font-medium">{t("invoices.paidInvoices")}</span>
            </div>
            <div className="text-2xl font-bold mt-2 text-info">
              {invoices.filter((inv) => inv.status === "paid").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="professional-card">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("invoices.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: t("common.all") },
              { value: "draft", label: t("invoices.draft") },
              { value: "sent", label: t("invoices.status.sent") },
              { value: "partial", label: t("invoices.partial") },
              { value: "paid", label: t("invoices.paid") },
              { value: "overdue", label: t("invoices.overdue") },
              { value: "cancelled", label: t("invoices.cancelled") },
            ].map((status) => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status.value)}
                className="capitalize"
              >
                {status.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle>{t("invoices.invoiceList")} ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("invoices.noInvoicesFound")}</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? t("invoices.adjustSearch") : t("invoices.createFirst")}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button variant="gradient" onClick={() => setIsCreateModalOpen(true)}>
                  {t("invoices.createFirstInvoice")}
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {paginatedInvoices.map((invoice) => {
                  const remaining = getRemainingBalance(invoice);
                  const showRecordPayment = invoice.status !== "paid" && invoice.status !== "cancelled";

                  return (
                    <Card key={invoice.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          <div className="font-medium">{invoice.invoice_number}</div>
                          <div className="text-sm text-muted-foreground">{invoice.customer?.name || t("invoices.noCustomer")}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(invoice.invoice_date).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant={getStatusVariant(invoice.status)} className="text-xs capitalize">
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t("common.total")}:</span>
                          <span className="font-medium">Le {invoice.total_amount.toLocaleString(locale)}</span>
                        </div>
                        {invoice.paid_amount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t("invoices.paid")}:</span>
                            <span className="text-success">Le {invoice.paid_amount.toLocaleString(locale)}</span>
                          </div>
                        )}
                        {remaining > 0 && invoice.status !== "cancelled" && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t("invoices.balance")}:</span>
                            <span className="text-warning">Le {remaining.toLocaleString(locale)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        {showRecordPayment && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRecordPayment(invoice)}
                            className="h-8 text-xs"
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            {t("invoices.recordPayment")}
                          </Button>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditInvoice(invoice)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">{t("invoices.invoiceNumber")}</TableHead>
                      <TableHead className="min-w-[120px]">{t("invoices.customer")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("common.date")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("invoices.dueDate")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("common.total")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("invoices.balance")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("common.status")}</TableHead>
                      <TableHead className="text-right min-w-[140px]">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInvoices.map((invoice) => {
                      const remaining = getRemainingBalance(invoice);
                      const showRecordPayment = invoice.status !== "paid" && invoice.status !== "cancelled";

                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{invoice.customer?.name || t("invoices.noCustomer")}</TableCell>
                          <TableCell>{new Date(invoice.invoice_date).toLocaleDateString(locale)}</TableCell>
                          <TableCell>
                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString(locale) : t("invoices.noDueDate")}
                          </TableCell>
                          <TableCell className="font-medium">Le {invoice.total_amount.toLocaleString(locale)}</TableCell>
                          <TableCell>
                            {remaining > 0 && invoice.status !== "cancelled" ? (
                              <span className="text-warning font-medium">Le {remaining.toLocaleString(locale)}</span>
                            ) : invoice.status === "paid" ? (
                              <span className="text-success">{t("invoices.paid")}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(invoice.status)} className="text-xs capitalize">
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 justify-end">
                              {showRecordPayment && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRecordPayment(invoice)}
                                  className="h-8 text-xs"
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  {t("invoices.pay")}
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEditInvoice(invoice)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {t("common.showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)} {t("common.of")} {filteredInvoices.length}{" "}
                    {t("invoices.title").toLowerCase()}
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
                        {currentPage} of {totalPages}
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

      <CreateInvoiceModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} onInvoiceCreated={refetch} />

      <ViewInvoiceModal invoice={selectedInvoice} open={isViewModalOpen} onOpenChange={setIsViewModalOpen} />

      <EditInvoiceModal
        invoice={selectedInvoice}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onInvoiceUpdated={refetch}
      />

      <RecordInvoicePaymentModal
        invoice={selectedInvoice}
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        onPaymentRecorded={refetch}
      />
    </div>
  );
};

export default Invoices;
