import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Truck, Phone, MapPin, Package, Edit, Trash2, Eye, DollarSign } from "lucide-react";
import { useState, useMemo } from "react";
import { useSuppliers, Supplier } from "@/hooks/useSuppliers";
import { useLanguage } from "@/contexts/LanguageContext";
import { AddSupplierModal } from "@/components/AddSupplierModal";
import { EditSupplierModal } from "@/components/EditSupplierModal";
import { ViewSupplierModal } from "@/components/ViewSupplierModal";
import { RecordSupplierPaymentModal } from "@/components/RecordSupplierPaymentModal";
import { formatDistanceToNow } from "date-fns";
import { formatCategory, SUPPLIER_CATEGORIES } from "@/lib/formatCategory";
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

export default function Suppliers() {
  const { t, locale } = useLanguage();
  const { business, loading: businessLoading } = useUserProfile();
  const businessId = business?.id;
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const { suppliers, loading, deleteSupplier, refetch } = useSuppliers(businessId);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesSearch =
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.product_category?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && supplier.current_balance > 0) ||
        (filter === "zero_balance" && supplier.current_balance === 0);

      const matchesCategory = categoryFilter === "all" || supplier.product_category === categoryFilter;

      return matchesSearch && matchesFilter && matchesCategory;
    });
  }, [suppliers, searchQuery, filter, categoryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);

  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSuppliers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSuppliers, currentPage]);

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

  // Reset to page 1 when filters change
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategoryFilter(newCategory);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (confirm(t("suppliers.confirmDelete"))) {
      await deleteSupplier(supplierId);
    }
  };

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.current_balance > 0).length;
  const totalBalance = suppliers.reduce((sum, s) => sum + s.current_balance, 0);

  if (loading || businessLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm">{t("suppliers.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("suppliers.title")}</h1>
          <p className="text-muted-foreground">{t("suppliers.description")}</p>
        </div>
        <AddSupplierModal />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("suppliers.totalSuppliers")}</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">{activeSuppliers} {t("suppliers.withOutstandingBalance")}</p>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("suppliers.outstandingBalance")}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Le {totalBalance.toLocaleString(locale)}</div>
            <p className="text-xs text-muted-foreground">{t("suppliers.totalOwed")}</p>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("suppliers.activeSuppliers")}</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSuppliers}</div>
            <p className="text-xs text-muted-foreground">{t("suppliers.withCurrentBalance")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("all")}
          >
            {t("suppliers.allSuppliers")}
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("active")}
          >
            {t("suppliers.outstandingBalance")}
          </Button>
          <Button
            variant={filter === "zero_balance" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("zero_balance")}
          >
            {t("suppliers.zeroBalance")}
          </Button>
        </div>

        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("suppliers.allCategories")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("suppliers.allCategories")}</SelectItem>
            {SUPPLIER_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t("suppliers.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t("suppliers.suppliersList")}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {filteredSuppliers.length} {t("suppliers.title").toLowerCase()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("suppliers.noSuppliersFound")}</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filter !== "all" || categoryFilter !== "all"
                  ? t("suppliers.adjustSearchFilters")
                  : t("suppliers.addFirst")}
              </p>
              {!searchQuery && filter === "all" && categoryFilter === "all" && <AddSupplierModal />}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {paginatedSuppliers.map((supplier) => (
                  <Card key={supplier.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <div className="font-medium">{supplier.name}</div>
                        {supplier.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {supplier.location}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(supplier.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                      {supplier.product_category && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {formatCategory(supplier.product_category)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <span
                        className={`text-sm font-medium ${supplier.current_balance > 0 ? "text-orange-600" : "text-muted-foreground"}`}
                      >
                        Le {supplier.current_balance.toLocaleString(locale)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setPaymentModalOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                          title="Record Payment"
                        >
                          <DollarSign className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setViewModalOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setEditModalOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSupplier(supplier.id)}
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
                      <TableHead className="min-w-[150px]">{t("suppliers.supplier")}</TableHead>
                      <TableHead className="min-w-[120px]">{t("common.contact")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("common.category")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("customers.balance")}</TableHead>
                      <TableHead className="min-w-[120px]">{t("suppliers.lastUpdated")}</TableHead>
                      <TableHead className="text-right min-w-[140px]">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            {supplier.location && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {supplier.location}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {supplier.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {supplier.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {supplier.product_category && (
                            <Badge variant="secondary" className="text-xs">
                              {formatCategory(supplier.product_category)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm ${supplier.current_balance > 0 ? "text-orange-600" : "text-muted-foreground"}`}
                          >
                            Le {supplier.current_balance.toLocaleString(locale)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(supplier.updated_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setPaymentModalOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                              title="Record Payment"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setViewModalOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setEditModalOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              className="h-8 w-8 p-0"
                            >
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
                    {t("common.showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredSuppliers.length)} {t("common.of")} {filteredSuppliers.length}{" "}
                    {t("suppliers.title").toLowerCase()}
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

      {/* Modals */}
      {selectedSupplier && (
        <>
          <EditSupplierModal
            supplier={selectedSupplier}
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            onClose={() => setSelectedSupplier(null)}
          />
          <ViewSupplierModal
            supplier={selectedSupplier}
            open={viewModalOpen}
            onOpenChange={setViewModalOpen}
            onClose={() => setSelectedSupplier(null)}
            onPaymentRecorded={refetch}
          />
          <RecordSupplierPaymentModal
            supplier={selectedSupplier}
            open={paymentModalOpen}
            onOpenChange={setPaymentModalOpen}
            onPaymentRecorded={refetch}
          />
        </>
      )}
    </div>
  );
}
