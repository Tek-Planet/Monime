import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, AlertTriangle, TrendingUp, Edit, Trash2, Eye, X, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useInventory, type InventoryItem } from "@/hooks/useInventory";
import { useLanguage } from "@/contexts/LanguageContext";
import { AddInventoryModal } from "@/components/inventory/AddInventoryModal";
import { EditInventoryModal } from "@/components/inventory/EditInventoryModal";
import { ViewInventoryModal } from "@/components/inventory/ViewInventoryModal";
import { RestockModal } from "@/components/inventory/RestockModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const Inventory = () => {
  const { t } = useLanguage();
  const { business, loading: businessLoading } = useUserProfile();
  const businessId = business?.id;
  const {
    inventory,
    loading,
    deleteInventoryItem,
    getStockStatus,
    criticalItems,
    lowItems,
    outOfStockItems,
    totalValue,
    fetchInventory,
  } = useInventory(businessId);

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  // Get unique categories from inventory
  const categories = useMemo(() => {
    const cats = new Set(inventory.map((item) => item.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [inventory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "destructive";
      case "low":
        return "secondary";
      case "good":
        return "default";
      case "out":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Filter and search inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // Stock status filter
      if (filter !== "all") {
        const status = getStockStatus(item);
        if (status !== filter) return false;
      }

      // Category filter
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesSku = item.sku?.toLowerCase().includes(query);
        const matchesBarcode = item.barcode?.toLowerCase().includes(query);
        const matchesCategory = item.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesBarcode && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [inventory, filter, categoryFilter, searchQuery, getStockStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE);
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInventory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInventory, currentPage]);

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

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      await deleteInventoryItem(deletingItem.id);
      setDeletingItem(null);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  if (loading || businessLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm">{t("inventory.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("inventory.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t("inventory.description")}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <RestockModal onRestockComplete={fetchInventory}>
            <Button variant="gradient" className="flex-1 sm:flex-none">
              <Package className="h-4 w-4 mr-2" />
              {t("inventory.restock")}
            </Button>
          </RestockModal>
          <AddInventoryModal onItemAdded={fetchInventory} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{t("inventory.totalItems")}</span>
            </div>
            <div className="text-2xl font-bold mt-2">{inventory.length}</div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-prosperity-green" />
              <span className="text-sm font-medium">{t("inventory.totalValue")}</span>
            </div>
            <div className="text-2xl font-bold mt-2">Le {totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span className="text-sm font-medium">{t("inventory.lowStock")}</span>
            </div>
            <div className="text-2xl font-bold mt-2 text-warning">{lowItems}</div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <X className="h-5 w-5 text-destructive" />
              <span className="text-sm font-medium">{t("inventory.outOfStock")}</span>
            </div>
            <div className="text-2xl font-bold mt-2 text-destructive">{outOfStockItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("inventory.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("inventory.allCategories")}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category!}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => handleFilterChange("all")} size="sm">
          {t("inventory.allItems")} ({inventory.length})
        </Button>
        <Button
          variant={filter === "critical" ? "destructive" : "outline"}
          onClick={() => handleFilterChange("critical")}
          size="sm"
        >
          {t("inventory.critical")} ({criticalItems})
        </Button>
        <Button
          variant={filter === "low" ? "secondary" : "outline"}
          onClick={() => handleFilterChange("low")}
          size="sm"
        >
          {t("inventory.lowStock")} ({lowItems})
        </Button>
        <Button
          variant={filter === "out" ? "destructive" : "outline"}
          onClick={() => handleFilterChange("out")}
          size="sm"
        >
          {t("inventory.outOfStock")} ({outOfStockItems})
        </Button>
      </div>

      {/* Inventory Table */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle>
            {t("inventory.stockOverview")} ({filteredInventory.length} {t("inventory.items")})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== "all"
                  ? t("inventory.noMatches")
                  : filter === "all"
                    ? t("inventory.noItems")
                    : `${t("inventory.no")} ${filter} ${t("inventory.stockItems")}`}
              </p>
              {filter === "all" && !searchQuery && categoryFilter === "all" && (
                <AddInventoryModal>
                  <Button variant="gradient">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("inventory.addFirst")}
                  </Button>
                </AddInventoryModal>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedInventory.map((item) => {
                const status = getStockStatus(item);
                const profitMargin =
                  item.cost_price && item.cost_price > 0
                    ? (((item.unit_price - item.cost_price) / item.unit_price) * 100).toFixed(0)
                    : null;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setViewingItem(item)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm sm:text-base">{item.name}</h3>
                          {!item.is_active && (
                            <Badge variant="outline" className="text-xs">
                              {t("inventory.inactive")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {item.category} • Le {item.unit_price.toLocaleString()}
                          {item.sku && ` • SKU: ${item.sku}`}
                          {profitMargin && (
                            <span
                              className={`ml-2 ${parseFloat(profitMargin) > 0 ? "text-prosperity-green" : "text-destructive"}`}
                            >
                              ({profitMargin}% {t("inventory.margin")})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Badge variant={getStatusColor(status)} className="text-xs whitespace-nowrap">
                        {item.stock_quantity} {status === "out" ? t("inventory.status.out") : t("inventory.status.stock")}
                      </Badge>

                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setViewingItem(item)} className="h-8 w-8 p-0">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingItem(item)} className="h-8 w-8 p-0">
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingItem(item)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {t("inventory.showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} {t("inventory.to")}{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredInventory.length)} {t("inventory.of")} {filteredInventory.length}{" "}
                    {t("inventory.items")}
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
                        {currentPage} {t("inventory.of")} {totalPages}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Modal */}
      <ViewInventoryModal
        item={viewingItem}
        open={!!viewingItem}
        onOpenChange={(open) => !open && setViewingItem(null)}
        onEdit={setEditingItem}
        onDelete={setDeletingItem}
        getStockStatus={getStockStatus}
      />

      {/* Edit Modal */}
      <EditInventoryModal
        item={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("inventory.deleteItem")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("inventory.deleteConfirm")} "{deletingItem?.name}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Inventory;
