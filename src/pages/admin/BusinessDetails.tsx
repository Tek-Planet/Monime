import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminType } from "@/hooks/useAdminType";
import {
  useAdminBusiness,
  useBusinessStats,
  useBusinessOwnerProfile,
  useBusinessCreditData,
  useBusinessReportingMetrics,
  useBusinessLoanApplications,
  useBusinessLoanRepayments,
} from "@/hooks/admin/useAdminBusinesses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityLogsTable } from "@/components/admin/ActivityLogsTable";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Package,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  BarChart3,
  PieChart,
  Award,
  Edit,
} from "lucide-react";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { EditBusinessLocationModal } from "@/components/admin/EditBusinessLocationModal";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BusinessDetails() {
  const { t } = useLanguage();
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { adminType, ngoId, loading: adminLoading } = useAdminType();
  const [editLocationOpen, setEditLocationOpen] = useState(false);

  const isNGOAdmin = adminType === "ngo_admin";
  const isSystemAdmin = adminType === "system_admin";

  const { data: business, isLoading: businessLoading } = useAdminBusiness(businessId);
  const { data: ownerProfile } = useBusinessOwnerProfile(business?.owner_id);
  const { data: stats } = useBusinessStats(businessId);
  const { data: creditData } = useBusinessCreditData(businessId);
  const { data: reportingMetrics } = useBusinessReportingMetrics(businessId);
  const { data: loanApplications = [] } = useBusinessLoanApplications(businessId);
  const { data: loanRepayments = [] } = useBusinessLoanRepayments(businessId);

  useEffect(() => {
    if (!adminLoading && !isNGOAdmin && !isSystemAdmin) {
      navigate("/admin");
    }
  }, [isNGOAdmin, isSystemAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (business && isNGOAdmin && business.ngo_id !== ngoId) {
      toast.error(t("admin.noAccessBusiness") || "You do not have access to this business");
      navigate("/admin/businesses");
    }
  }, [business, isNGOAdmin, ngoId, navigate]);

  if (adminLoading || businessLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">{t("admin.businessNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{business.business_name}</h1>
          {business.business_type && (
            <Badge variant="outline" className="mt-2">
              {business.business_type}
            </Badge>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.totalSalesLabel")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {business.currency} {stats.totalSales.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{stats.recentSalesCount} {t("admin.salesInLast30Days")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.totalExpensesLabel")}</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {business.currency} {stats.totalExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{stats.recentExpensesCount} {t("admin.expensesInLast30Days")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.customers")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">{t("admin.totalCustomers")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.inventoryItems")}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInventory}</div>
              <p className="text-xs text-muted-foreground">{stats.totalSuppliers} {t("admin.suppliersLabel")}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t("admin.overview")}</TabsTrigger>
          <TabsTrigger value="reports">{t("admin.reportsMetrics")}</TabsTrigger>
          <TabsTrigger value="credit">{t("admin.creditFinancing")}</TabsTrigger>
          <TabsTrigger value="activity">{t("admin.activityLogsTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.businessInformation")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {business.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.email")}</p>
                      <p className="font-medium break-all">{business.email}</p>
                    </div>
                  </div>
                )}

                {business.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.phone")}</p>
                      <p className="font-medium">{business.phone}</p>
                    </div>
                  </div>
                )}

                {business.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.address")}</p>
                      <p className="font-medium">{business.address}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("admin.joined")}</p>
                    <p className="font-medium">{new Date(business.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {business.currency && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("admin.currency")}</p>
                    <p className="font-medium">{business.currency}</p>
                  </div>
                )}

                {business.tax_rate !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("admin.taxRate")}</p>
                    <p className="font-medium">{business.tax_rate}%</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{t("admin.location")}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditLocationOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {(business as any).latitude ? t("common.edit") : t("admin.add")}
                    </Button>
                  </div>
                  {(business as any).latitude && (business as any).longitude ? (
                    <LocationPicker
                      latitude={(business as any).latitude}
                      longitude={(business as any).longitude}
                      readOnly
                      height="200px"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {t("admin.noLocationSet")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.businessOwner")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ownerProfile ? (
                  <>
                    {(ownerProfile.first_name || ownerProfile.last_name) && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t("common.name")}</p>
                        <p className="font-medium">
                          {ownerProfile.first_name} {ownerProfile.last_name}
                        </p>
                      </div>
                    )}

                    {ownerProfile.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">{t("admin.email")}</p>
                          <p className="font-medium break-all">{ownerProfile.email}</p>
                        </div>
                      </div>
                    )}

                    {ownerProfile.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">{t("admin.phone")}</p>
                          <p className="font-medium">{ownerProfile.phone}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">{t("admin.ownerNotAvailable")}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.businessMetrics")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.invoices")}</p>
                      <p className="text-2xl font-bold">{stats.totalInvoices}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.netRevenue")}</p>
                      <p className="text-2xl font-bold">
                        {business.currency} {(stats.totalSales - stats.totalExpenses).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Package className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("admin.suppliersLabel")}</p>
                      <p className="text-2xl font-bold">{stats.totalSuppliers}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="credit" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t("admin.loanApplications")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loanApplications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("admin.noLoanApplications")}</p>
                ) : (
                  <div className="space-y-4">
                    {loanApplications.map((loan) => (
                      <div key={loan.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{loan.application_number}</span>
                          <Badge
                            variant={
                              loan.status === "approved"
                                ? "default"
                                : loan.status === "pending"
                                  ? "secondary"
                                  : loan.status === "disbursed"
                                    ? "default"
                                    : "destructive"
                            }
                          >
                            {loan.status}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("admin.requested")}:</span>
                            <span className="font-medium">
                              {business.currency} {loan.requested_amount.toLocaleString()}
                            </span>
                          </div>
                          {loan.approved_amount && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t("admin.approved")}:</span>
                              <span className="font-medium">
                                {business.currency} {loan.approved_amount.toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("admin.applied")}:</span>
                            <span>{format(new Date(loan.created_at), "MMM dd, yyyy")}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  {t("admin.recentRepayments")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loanRepayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("admin.noRepayments")}</p>
                ) : (
                  <div className="space-y-4">
                    {loanRepayments.map((repayment) => (
                      <div key={repayment.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {business.currency} {repayment.amount.toLocaleString()}
                          </span>
                          <Badge
                            variant={
                              repayment.status === "paid"
                                ? "default"
                                : repayment.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {repayment.status}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("admin.dueDate")}:</span>
                            <span>{format(new Date(repayment.due_date), "MMM dd, yyyy")}</span>
                          </div>
                          {repayment.payment_date && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t("admin.paid")}:</span>
                              <span>{format(new Date(repayment.payment_date), "MMM dd, yyyy")}</span>
                            </div>
                          )}
                          {repayment.reference_number && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t("admin.ref")}:</span>
                              <span className="text-xs">{repayment.reference_number}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {reportingMetrics && business && (
            <>
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    {t("admin.businessCreditScore")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-5xl font-bold">{reportingMetrics.creditScore.score}</div>
                      <p className="text-lg text-muted-foreground mt-1">{reportingMetrics.creditScore.rating} {t("admin.credit")}</p>
                    </div>
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold ${
                        reportingMetrics.creditScore.score >= 800
                          ? "bg-green-100 text-green-700"
                          : reportingMetrics.creditScore.score >= 670
                            ? "bg-blue-100 text-blue-700"
                            : reportingMetrics.creditScore.score >= 580
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                      }`}
                    >
                      {reportingMetrics.creditScore.rating.charAt(0)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t("admin.financialSummary")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{t("admin.totalRevenueLabel")}</p>
                      <p className="text-2xl font-bold text-green-600">
                        {business.currency} {reportingMetrics.financialSummary.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{t("admin.totalExpenses")}</p>
                      <p className="text-2xl font-bold text-red-600">
                        {business.currency} {reportingMetrics.financialSummary.totalExpenses.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{t("admin.netProfit")}</p>
                      <p
                        className={`text-2xl font-bold ${reportingMetrics.financialSummary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {business.currency} {reportingMetrics.financialSummary.netProfit.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{t("admin.profitMargin")}</p>
                      <p
                        className={`text-2xl font-bold ${reportingMetrics.financialSummary.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {reportingMetrics.financialSummary.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {t("admin.salesPerformance")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("admin.totalTransactions")}</span>
                        <span className="font-semibold">{reportingMetrics.salesMetrics.totalTransactions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("admin.avgTransactionValue")}</span>
                        <span className="font-semibold">
                          {business.currency}{" "}
                          {reportingMetrics.salesMetrics.averageTransactionValue.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-3">{t("admin.topCustomers")}</p>
                      <div className="space-y-2">
                        {reportingMetrics.salesMetrics.topCustomers.length > 0 ? (
                          reportingMetrics.salesMetrics.topCustomers.map((customer, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">{customer.name}</span>
                              <span className="font-medium">
                                {business.currency} {customer.totalSpent.toLocaleString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">{t("admin.noCustomerData")}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {t("admin.inventoryStatus")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("admin.totalItems")}</span>
                        <span className="font-semibold">{reportingMetrics.inventoryMetrics.totalItems}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("admin.lowStockItems")}</span>
                        <span
                          className={`font-semibold ${reportingMetrics.inventoryMetrics.lowStockItems > 0 ? "text-red-600" : "text-green-600"}`}
                        >
                          {reportingMetrics.inventoryMetrics.lowStockItems}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("admin.totalInventoryValue")}</span>
                        <span className="font-semibold">
                          {business.currency} {reportingMetrics.inventoryMetrics.totalInventoryValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {t("admin.outstandingBalances")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{t("admin.unpaidInvoices")}</p>
                      <p className="text-xl font-bold text-orange-600">
                        {business.currency} {reportingMetrics.outstandingBalances.totalInvoicesDue.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{t("admin.customerCredit")}</p>
                      <p className="text-xl font-bold text-blue-600">
                        {business.currency} {reportingMetrics.outstandingBalances.totalCustomerCredit.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{t("admin.supplierDebt")}</p>
                      <p className="text-xl font-bold text-red-600">
                        {business.currency} {reportingMetrics.outstandingBalances.totalSupplierDebt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    {t("admin.monthOverMonth")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{t("admin.currentMonthSales")}</p>
                      <p className="text-xl font-bold">
                        {business.currency} {reportingMetrics.periodComparison.currentMonthSales.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{t("admin.lastMonthSales")}</p>
                      <p className="text-xl font-bold">
                        {business.currency} {reportingMetrics.periodComparison.lastMonthSales.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{t("admin.growthRate")}</p>
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-xl font-bold ${reportingMetrics.periodComparison.growthRate >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {reportingMetrics.periodComparison.growthRate >= 0 ? "+" : ""}
                          {reportingMetrics.periodComparison.growthRate.toFixed(1)}%
                        </p>
                        {reportingMetrics.periodComparison.growthRate >= 0 ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ActivityLogsTable />
        </TabsContent>
      </Tabs>

      {creditData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.totalLoanApps")}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creditData.totalLoansRequested}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.approvedLoans")}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creditData.totalLoansApproved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.activeLoans")}</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creditData.totalLoansActive}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.creditTransactions")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creditData.totalCreditTransactions}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <EditBusinessLocationModal
        open={editLocationOpen}
        onOpenChange={setEditLocationOpen}
        businessId={business.id}
        businessName={business.business_name}
        currentLatitude={(business as any).latitude}
        currentLongitude={(business as any).longitude}
      />
    </div>
  );
}
