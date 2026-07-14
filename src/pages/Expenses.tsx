import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpenses, Expense } from "@/hooks/useExpenses";
import { useLanguage } from "@/contexts/LanguageContext";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { ViewExpenseModal } from "@/components/ViewExpenseModal";
import { EXPENSE_CATEGORIES, formatCategory } from "@/lib/formatCategory";
import { toast } from "sonner";
import { format, startOfDay, startOfWeek, startOfMonth, startOfQuarter, subDays } from "date-fns";
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

const ITEMS_PER_PAGE = 10;

// Date range options will be built using translations

export default function Expenses() {
  const { business, loading: businessLoading } = useUserProfile();
  const businessId = business?.id;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const { expenses, loading, deleteExpense } = useExpenses(businessId);
  const { t, locale } = useLanguage();

  const DATE_RANGE_OPTIONS = [
    { value: "all", label: t("expenses.allTime") },
    { value: "today", label: t("expenses.today") },
    { value: "week", label: t("expenses.thisWeek") },
    { value: "month", label: t("expenses.thisMonth") },
    { value: "quarter", label: t("expenses.thisQuarter") },
    { value: "last30", label: t("expenses.last30Days") },
  ];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter, selectedCategory, selectedDateRange]);

  const getDateRangeStart = (range: string): Date | null => {
    const now = new Date();
    switch (range) {
      case "today":
        return startOfDay(now);
      case "week":
        return startOfWeek(now, { weekStartsOn: 1 });
      case "month":
        return startOfMonth(now);
      case "quarter":
        return startOfQuarter(now);
      case "last30":
        return subDays(now, 30);
      default:
        return null;
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPaymentMethod =
        selectedFilter === "all" ||
        (selectedFilter === "cash" && expense.payment_method === "cash") ||
        (selectedFilter === "bank" && expense.payment_method === "bank_transfer") ||
        (selectedFilter === "mobile" && expense.payment_method === "mobile_money") ||
        (selectedFilter === "credit" && expense.payment_method === "credit");

      const matchesCategory = selectedCategory === "all" || expense.category === selectedCategory;

      const dateRangeStart = getDateRangeStart(selectedDateRange);
      const matchesDateRange = !dateRangeStart || new Date(expense.expense_date) >= dateRangeStart;

      return matchesSearch && matchesPaymentMethod && matchesCategory && matchesDateRange;
    });
  }, [expenses, searchQuery, selectedFilter, selectedCategory, selectedDateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExpenses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredExpenses, currentPage]);

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

  const getCategoryLabel = (category: string | null | undefined) => {
    if (!category) return "";
    const cleanCategory = category.replace(/\s+/g, '');
    const expenseKey = `expense.category.${cleanCategory}`;
    // Check if it's a known expense category
    if (['Office Supplies', 'Marketing', 'Travel', 'Utilities', 'Equipment', 'Professional Services', 'Inventory', 'Maintenance', 'Insurance', 'Other'].includes(category)) {
        return t(expenseKey);
    }
    return formatCategory(category);
  };

  const getPaymentMethodLabel = (method: string) => {
      if (!method) return "";
      switch(method) {
          case 'cash': return t('payment.cash');
          case 'mobile_money': return t('payment.mobileMoney');
          case 'bank_transfer': return t('payment.bankTransfer');
          case 'credit': return t('payment.credit');
          default: return formatCategory(method);
      }
  };

  if (loading || businessLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm">{t("expenses.loading")}</p>
      </div>
    );
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm(t("expenses.confirmDelete"))) {
      try {
        await deleteExpense(expenseId);
        toast.success(t("expenses.deleteSuccess"));
      } catch (error) {
        toast.error(t("expenses.deleteFailed"));
      }
    }
  };

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsViewModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditModalOpen(true);
  };

  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const thisMonthExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.expense_date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  });
  const thisMonthAmount = thisMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  const filterOptions = [
    { value: "all", label: t("expenses.allExpenses") },
    { value: "cash", label: t("expenses.cash") },
    { value: "bank", label: t("expenses.bankTransfer") },
    { value: "mobile", label: t("expenses.mobileMoney") },
    { value: "credit", label: t("expenses.creditPayment") },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("expenses.title")}</h1>
          <p className="text-muted-foreground">{t("expenses.description")}</p>
        </div>
        <Button variant="gradient" className="w-full sm:w-auto" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("expenses.addExpense")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("expenses.totalExpenses")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExpenses.toLocaleString(locale)}</div>
            <p className="text-xs text-muted-foreground">{t("expenses.allTime")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("expenses.totalAmount")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SLL {totalAmount.toLocaleString(locale)}</div>
            <p className="text-xs text-muted-foreground">{t("expenses.allTime")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("expenses.thisMonthLabel")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SLL {thisMonthAmount.toLocaleString(locale)}</div>
            <p className="text-xs text-muted-foreground">{thisMonthExpenses.length} {t("nav.expenses").toLowerCase()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("common.category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.allCategories")}</SelectItem>
              {EXPENSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {t(`expense.category.${cat.value.replace(/\s+/g, '')}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("expenses.dateRange")} />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t("expenses.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("expenses.title")}</CardTitle>
          <CardDescription>
            {filteredExpenses.length} {t("expenses.expensesFound")}
            {totalPages > 1 && ` • ${t("pagination.page")} ${currentPage} ${t("pagination.of")} ${totalPages}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{t("expenses.noExpensesFound")}</p>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("expenses.addFirstExpense")}
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {paginatedExpenses.map((expense) => (
                  <Card key={expense.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <div className="font-medium">{expense.description}</div>
                        {expense.category && (
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(expense.category)}
                          </Badge>
                        )}
                        {expense.supplier?.name && (
                          <div className="text-xs text-muted-foreground">{expense.supplier.name}</div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(expense.expense_date), "MMM dd, yyyy")}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {getPaymentMethodLabel(expense.payment_method)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <div className="font-mono font-medium">SLL {Number(expense.amount).toLocaleString(locale)}</div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewExpense(expense)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditExpense(expense)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.description")}</TableHead>
                      <TableHead>{t("common.category")}</TableHead>
                      <TableHead>{t("common.supplier")}</TableHead>
                      <TableHead>{t("common.amount")}</TableHead>
                      <TableHead>{t("common.paymentMethod")}</TableHead>
                      <TableHead>{t("common.date")}</TableHead>
                      <TableHead>{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>
                          {expense.category && <Badge variant="outline">{getCategoryLabel(expense.category)}</Badge>}
                        </TableCell>
                        <TableCell>{expense.supplier?.name || "-"}</TableCell>
                        <TableCell className="font-mono">SLL {Number(expense.amount).toLocaleString(locale)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getPaymentMethodLabel(expense.payment_method)}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(expense.expense_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewExpense(expense)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditExpense(expense)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredExpenses.length)} {t("pagination.of")} {filteredExpenses.length}{" "}
                    {t("nav.expenses").toLowerCase()}
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
      <AddExpenseModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {selectedExpense && (
        <>
          <EditExpenseModal
            expense={selectedExpense}
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedExpense(null);
            }}
          />

          <ViewExpenseModal
            expense={selectedExpense}
            open={isViewModalOpen}
            onOpenChange={setIsViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedExpense(null);
            }}
          />
        </>
      )}
    </div>
  );
}
