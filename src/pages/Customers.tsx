import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddCustomerModal } from "@/components/AddCustomerModal";
import { EditCustomerModal } from "@/components/EditCustomerModal";
import { ViewCustomerModal } from "@/components/ViewCustomerModal";
import { RecordCreditTransactionModal } from "@/components/RecordCreditTransactionModal";
import { BirthdayReminders } from "@/components/BirthdayReminders";
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  Edit,
  Trash2,
  Eye,
  Wallet,
  Gift,
  Calendar,
} from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, parseISO, differenceInDays, isSameDay } from "date-fns";
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

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  business_type?: string;
  credit_limit: number;
  current_balance: number;
  birthday?: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

const Customers = () => {
  const { t, locale } = useLanguage();
  const { business, loading: businessLoading } = useUserProfile();
  const businessId = business?.id;
  const {
    customers: rawCustomers,
    loading,
    deleteCustomer: deleteCustomerFromHook,
    refetch,
  } = useCustomers(businessId);
  const [searchQuery, setSearchQuery] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [recordingTransactionFor, setRecordingTransactionFor] = useState<Customer | null>(null);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, businessTypeFilter]);

  // Normalize customers to ensure required fields have defaults
  const customers: Customer[] = useMemo(
    () =>
      rawCustomers.map((c) => ({
        ...c,
        credit_limit: c.credit_limit ?? 0,
        current_balance: c.current_balance ?? 0,
      })),
    [rawCustomers],
  );

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = businessTypeFilter === "all" || customer.business_type === businessTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [customers, searchQuery, businessTypeFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

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

  const getBusinessTypeLabel = (type?: string) => {
    const types: { [key: string]: string } = {
      retail_store: t("businessType.retailStore"),
      provision_shop: t("businessType.provisionShop"),
      restaurant: t("businessType.restaurant"),
      market_vendor: t("businessType.marketVendor"),
      supermarket: t("businessType.supermarket"),
      other: t("businessType.other"),
    };
    return types[type || ""] || type || "N/A";
  };

  const getBirthdayStatus = (birthday?: string) => {
    if (!birthday) return null;

    const today = new Date();
    const bday = parseISO(birthday);
    const thisYearBirthday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());

    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }

    const daysUntil = differenceInDays(thisYearBirthday, today);
    const isToday = isSameDay(today, thisYearBirthday);

    if (isToday) return { label: t("dashboard.today"), variant: "default" as const };
    if (daysUntil <= 7) return { label: `${daysUntil}d`, variant: "secondary" as const };
    return null;
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm(t("customers.confirmDelete"))) return;
    await deleteCustomerFromHook(customerId);
  };

  // Stats calculations
  const totalOutstanding = customers.reduce((sum, c) => sum + c.current_balance, 0);
  const totalAvailableCredit = customers.reduce((sum, c) => sum + Math.max(0, c.credit_limit - c.current_balance), 0);

  if (loading || businessLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm">{t("customers.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("customers.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t("customers.description")}</p>
        </div>
        <AddCustomerModal onCustomerAdded={refetch} />
      </div>

      {/* Birthday Reminders */}
      <BirthdayReminders />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("customers.totalCustomers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("customers.totalOutstanding")}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">Le {totalOutstanding.toLocaleString(locale)}</div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("customers.availableCredit")}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">Le {totalAvailableCredit.toLocaleString(locale)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="professional-card p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("customers.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Business Type Filter */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: t("customers.allTypes") },
              { value: "retail_store", label: t("businessType.retailStore") },
              { value: "provision_shop", label: t("businessType.provisionShop") },
              { value: "restaurant", label: t("businessType.restaurant") },
              { value: "market_vendor", label: t("businessType.marketVendor") },
              { value: "supermarket", label: t("businessType.supermarket") },
              { value: "other", label: t("businessType.other") },
            ].map((type) => (
              <Button
                key={type.value}
                variant={businessTypeFilter === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setBusinessTypeFilter(type.value)}
                className="text-xs"
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle>{t("customers.customerList")} ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("customers.noCustomersFound")}</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || businessTypeFilter !== "all"
                  ? t("customers.adjustFilters")
                  : t("customers.addFirst")}
              </p>
              {!searchQuery && businessTypeFilter === "all" && <AddCustomerModal onCustomerAdded={refetch} />}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {paginatedCustomers.map((customer) => {
                  const birthdayStatus = getBirthdayStatus(customer.birthday);
                  return (
                    <Card
                      key={customer.id}
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setViewingCustomer(customer)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {customer.name}
                            {birthdayStatus && (
                              <Badge variant={birthdayStatus.variant} className="text-xs">
                                <Gift className="h-3 w-3 mr-1" />
                                {birthdayStatus.label}
                              </Badge>
                            )}
                          </div>
                          {customer.phone && (
                            <div className="text-xs flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.birthday && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(customer.birthday), "MMM d")}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            <div>{t("customers.limit")}: Le {customer.credit_limit.toLocaleString(locale)}</div>
                            <div>
                              {t("customers.available")}: Le {(customer.credit_limit - customer.current_balance).toLocaleString(locale)}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs mt-1 text-center">
                          {getBusinessTypeLabel(customer.business_type)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <div
                          className={`text-sm font-medium ${
                            customer.current_balance > 0 ? "text-warning" : "text-success"
                          }`}
                        >
                          Le {customer.current_balance.toLocaleString(locale)}
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingCustomer(customer)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCustomer(customer)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer.id)}
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
                      <TableHead className="min-w-[150px]">{t("customers.customer")}</TableHead>
                      <TableHead className="min-w-[120px]">{t("common.contact")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("customers.birthday")}</TableHead>
                      <TableHead className="min-w-[120px]">{t("customers.businessType")}</TableHead>
                      <TableHead className="min-w-[120px]">{t("customers.creditInfo")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("customers.balance")}</TableHead>
                      <TableHead className="text-right min-w-[100px]">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.map((customer) => {
                      const birthdayStatus = getBirthdayStatus(customer.birthday);
                      return (
                        <TableRow
                          key={customer.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setViewingCustomer(customer)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {customer.name}
                                {birthdayStatus && (
                                  <Badge variant={birthdayStatus.variant} className="text-xs">
                                    <Gift className="h-3 w-3 mr-1" />
                                    {birthdayStatus.label}
                                  </Badge>
                                )}
                              </div>
                              {customer.address && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {customer.address.substring(0, 30)}...
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {customer.phone && (
                                <div className="text-sm flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {customer.phone}
                                </div>
                              )}
                              {customer.email && (
                                <div className="text-sm flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {customer.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.birthday ? (
                              <div className="text-sm">{format(parseISO(customer.birthday), "MMM d, yyyy")}</div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {getBusinessTypeLabel(customer.business_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{t("customers.limit")}: Le {customer.credit_limit.toLocaleString(locale)}</div>
                              <div className="text-muted-foreground">
                                {t("customers.available")}: Le {(customer.credit_limit - customer.current_balance).toLocaleString(locale)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`font-medium ${
                                customer.current_balance > 0 ? "text-warning" : "text-success"
                              }`}
                            >
                              Le {customer.current_balance.toLocaleString(locale)}
                            </div>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingCustomer(customer)}
                                className="h-9 w-9 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingCustomer(customer)}
                                className="h-9 w-9 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCustomer(customer.id)}
                                className="text-destructive hover:text-destructive h-9 w-9 p-0"
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
                    {t("common.showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} {t("common.of")} {filteredCustomers.length}{" "}
                    {t("customers.title").toLowerCase()}
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

      {/* View Customer Modal */}
      {viewingCustomer && (
        <ViewCustomerModal
          customer={viewingCustomer}
          open={!!viewingCustomer}
          onOpenChange={(open) => !open && setViewingCustomer(null)}
          onEdit={() => {
            setEditingCustomer(viewingCustomer);
            setViewingCustomer(null);
          }}
          onRecordTransaction={() => {
            setRecordingTransactionFor(viewingCustomer);
            setViewingCustomer(null);
          }}
        />
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          open={!!editingCustomer}
          onOpenChange={(open) => !open && setEditingCustomer(null)}
          onCustomerUpdated={refetch}
        />
      )}

      {/* Record Credit Transaction Modal */}
      {recordingTransactionFor && (
        <RecordCreditTransactionModal
          customer={recordingTransactionFor}
          open={!!recordingTransactionFor}
          onOpenChange={(open) => !open && setRecordingTransactionFor(null)}
          onTransactionRecorded={refetch}
        />
      )}
    </div>
  );
};

export default Customers;
