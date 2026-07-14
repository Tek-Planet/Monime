import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  BarChart3,
  FileText,
  TrendingUp,
  Calendar as CalendarIcon,
  Download,
  Package,
  Mail,
  MessageCircle,
  FileDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useSales } from "@/hooks/useSales";
import { useInvoices } from "@/hooks/useInvoices";
import { useInventory } from "@/hooks/useInventory";
import { useCustomers } from "@/hooks/useCustomers";
import { useExpenses } from "@/hooks/useExpenses";
import { useBusinessInfo } from "@/hooks/useBusinessInfo";
import { Receipt } from "lucide-react";
import { formatCategory } from "@/lib/formatCategory";
import { useMemo, useState } from "react";
import { format, subMonths, isAfter, isBefore, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ShareButton } from "@/components/ShareButton";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import mibuksLogo from "@/assets/test.png";

const Reports = () => {
  const { t, locale } = useLanguage();
  const { business, loading: businessLoading } = useUserProfile();
  const businessId = business?.id;
  const { sales, loading: salesLoading } = useSales(businessId);
  const { invoices, loading: invoicesLoading } = useInvoices(businessId);
  const { inventory, loading: inventoryLoading } = useInventory(businessId);
  const { customers, loading: customersLoading } = useCustomers(businessId);
  const { expenses, loading: expensesLoading } = useExpenses(businessId);
  const { businessInfo } = useBusinessInfo(businessId);

  const isMobile = useIsMobile();

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [activePreset, setActivePreset] = useState<string>("last30");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const applyPreset = (preset: string) => {
    const now = new Date();
    setActivePreset(preset);
    switch (preset) {
      case "today":
        setDateRange({ from: startOfDay(now), to: endOfDay(now) });
        setCalendarOpen(false);
        break;
      case "yesterday": {
        const y = subDays(now, 1);
        setDateRange({ from: startOfDay(y), to: endOfDay(y) });
        setCalendarOpen(false);
        break;
      }
      case "last7":
        setDateRange({ from: startOfDay(subDays(now, 6)), to: endOfDay(now) });
        setCalendarOpen(false);
        break;
      case "last30":
        setDateRange({ from: startOfDay(subDays(now, 29)), to: endOfDay(now) });
        setCalendarOpen(false);
        break;
      case "thisWeek":
        setDateRange({ from: startOfWeek(now), to: endOfWeek(now) });
        setCalendarOpen(false);
        break;
      case "lastWeek": {
        const lw = subWeeks(now, 1);
        setDateRange({ from: startOfWeek(lw), to: endOfWeek(lw) });
        setCalendarOpen(false);
        break;
      }
      case "thisMonth":
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        setCalendarOpen(false);
        break;
      case "lastMonth": {
        const lm = subMonths(now, 1);
        setDateRange({ from: startOfMonth(lm), to: endOfMonth(lm) });
        setCalendarOpen(false);
        break;
      }
      case "custom":
        // keep current range, just open the picker
        setCalendarOpen(true);
        break;
    }
  };

  const reportData = useMemo(() => {
    if (salesLoading || invoicesLoading || inventoryLoading || customersLoading || expensesLoading || businessLoading) {
      return {
        salesData: [],
        productData: [],
        topCustomers: [],
        expenseCategoryData: [],
        summary: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, activeCustomers: 0, totalExpenses: 0, netProfit: 0 },
        filteredSales: [],
        filteredInvoices: [],
        filteredExpenses: [],
      };
    }

    const currency = businessInfo?.currency || "SLL";
    const formatCurrency = (amount: number) => {
      if (currency === "SLL") {
        return `Le ${amount.toLocaleString()}`;
      }
      return `${currency} ${amount.toLocaleString()}`;
    };

    // Filter data by date range
    const startDate = dateRange?.from ? startOfDay(dateRange.from) : subMonths(new Date(), 6);
    const endDate = dateRange?.to ? endOfDay(dateRange.to) : new Date();

    const filteredSales = sales.filter((sale) => {
      const saleDate = new Date(sale.sale_date);
      return isAfter(saleDate, startDate) && isBefore(saleDate, endDate);
    });

    const filteredInvoices = invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.invoice_date);
      return isAfter(invoiceDate, startDate) && isBefore(invoiceDate, endDate);
    });

    // Generate sales data for the date range
    const salesData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthSales = filteredSales.filter((sale) => {
        const saleDate = new Date(sale.sale_date);
        return saleDate >= monthStart && saleDate <= monthEnd;
      });

      const monthInvoices = filteredInvoices.filter((invoice) => {
        const invoiceDate = new Date(invoice.invoice_date);
        return invoiceDate >= monthStart && invoiceDate <= monthEnd && invoice.status === "paid";
      });

      const salesRevenue = monthSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      const invoiceRevenue = monthInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);
      const totalRevenue = salesRevenue + invoiceRevenue;
      const totalOrders = monthSales.length + monthInvoices.length;

      salesData.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        sales: totalRevenue,
        orders: totalOrders,
      });
    }

    // Generate product distribution data from inventory
    const totalInventoryValue = inventory.reduce((sum, item) => sum + Number(item.unit_price) * item.stock_quantity, 0);

    const categoryData: { [key: string]: number } = {};
    inventory.forEach((item) => {
      const category = item.category || "Other";
      const value = Number(item.unit_price) * item.stock_quantity;
      categoryData[category] = (categoryData[category] || 0) + value;
    });

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
    const productData = Object.entries(categoryData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7) // Top 7 categories
      .map(([name, value], index) => ({
        name,
        value: totalInventoryValue > 0 ? Number(((value / totalInventoryValue) * 100).toFixed(1)) : 0,
        color: colors[index] || colors[colors.length - 1],
      }));

    // Generate top customers data from filtered data
    const customerRevenue: { [key: string]: { name: string; revenue: number; orders: number } } = {};

    filteredSales.forEach((sale) => {
      if (sale.customer?.name) {
        const customerId = sale.customer.id;
        if (!customerRevenue[customerId]) {
          customerRevenue[customerId] = {
            name: sale.customer.name,
            revenue: 0,
            orders: 0,
          };
        }
        customerRevenue[customerId].revenue += Number(sale.total_amount);
        customerRevenue[customerId].orders += 1;
      }
    });

    filteredInvoices.forEach((invoice) => {
      if (invoice.customer?.name && invoice.status === "paid") {
        const customerId = invoice.customer.id;
        if (!customerRevenue[customerId]) {
          customerRevenue[customerId] = {
            name: invoice.customer.name,
            revenue: 0,
            orders: 0,
          };
        }
        customerRevenue[customerId].revenue += Number(invoice.total_amount);
        customerRevenue[customerId].orders += 1;
      }
    });

    const topCustomers = Object.values(customerRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Filter expenses by date range
    const filteredExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.expense_date);
      return isAfter(expenseDate, startDate) && isBefore(expenseDate, endDate);
    });

    // Expense category distribution
    const expenseCategoryTotals: { [key: string]: number } = {};
    filteredExpenses.forEach((exp) => {
      const cat = exp.category || "Uncategorized";
      expenseCategoryTotals[cat] = (expenseCategoryTotals[cat] || 0) + Number(exp.amount);
    });
    const expenseCategoryData = Object.entries(expenseCategoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([name, value], index) => ({
        name: formatCategory(name),
        value,
        color: colors[index] || colors[colors.length - 1],
      }));

    // Calculate summary statistics from filtered data
    const totalRevenue =
      filteredSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0) +
      filteredInvoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const totalOrders = filteredSales.length + filteredInvoices.filter((inv) => inv.status === "paid").length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const activeCustomers = customers.length;
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      salesData,
      productData,
      topCustomers,
      expenseCategoryData,
      summary: { totalRevenue, totalOrders, avgOrderValue, activeCustomers, totalExpenses, netProfit },
      formatCurrency,
      filteredSales,
      filteredInvoices,
      filteredExpenses,
    };
  }, [
    sales,
    invoices,
    inventory,
    customers,
    expenses,
    businessInfo,
    salesLoading,
    invoicesLoading,
    inventoryLoading,
    customersLoading,
    expensesLoading,
    dateRange,
  ]);

  const isLoading = salesLoading || invoicesLoading || inventoryLoading || customersLoading || expensesLoading;

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: t("reports.noDataToExport"),
        description: t("reports.noDataDescription"),
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((header) => `"${row[header] || ""}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: t("reports.exportSuccessful"),
      description: `${filename} ${t("reports.exportSuccessDescription")}`,
    });
  };

  const addReportHeaderImages = (doc: jsPDF, title: string, metaLines: string[] = []) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftLogoWidth = 28;
    const leftLogoHeight = 12;
    const rightLogoWidth = 28;
    const rightLogoHeight = 12;

    try {
      doc.addImage(mibuksLogo, "PNG", 14, 10, leftLogoWidth, leftLogoHeight);
    } catch (error) {
      console.warn("Unable to add MiBuks logo to PDF:", error);
    }

    const businessLogo = (businessInfo as { logo?: string | null } | null)?.logo;
    if (businessLogo) {
      try {
        doc.addImage(businessLogo, "PNG", pageWidth - rightLogoWidth - 14, 10, rightLogoWidth, rightLogoHeight);
      } catch (error) {
        console.warn("Unable to add business logo to PDF:", error);
      }
    }

    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, 35, { align: "center" });
    doc.setFontSize(10);

    metaLines.forEach((line, index) => {
      doc.text(line, pageWidth / 2, 42 + index * 7, { align: "center" });
    });

    return 50 + metaLines.length * 7;
  };

const generateSalesReportPDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // First Page - Branded Cover
  // Add Logo (centered)
  try {
    doc.addImage(testLogo, 'PNG', pageWidth / 2 - 40, 30, 80, 40); // Adjust size as needed
  } catch (e) {
    console.log("Logo loading failed");
  }

  // Report Title
  doc.setFontSize(22);
  doc.text(t("reports.salesReport"), pageWidth / 2, 85, { align: "center" });

  // Business Name
  if (businessInfo?.business_name) {
    doc.setFontSize(14);
    doc.text(businessInfo.business_name, pageWidth / 2, 100, { align: "center" });
  }

  // Date and Period
  doc.setFontSize(11);
  doc.text(`${t("reports.generatedOn")}: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, pageWidth / 2, 115, { align: "center" });
  doc.text(
    `${t("reports.period")}: ${format(dateRange?.from || subMonths(new Date(), 6), "yyyy-MM-dd")} to ${format(dateRange?.to || new Date(), "yyyy-MM-dd")}`,
    pageWidth / 2,
    125,
    { align: "center" },
  );

  // Add a new page for the table
  doc.addPage();

  // Table on second page
  const tableData = reportData.filteredSales.map((sale) => [
    format(new Date(sale.sale_date), "yyyy-MM-dd"),
    sale.customer?.name || t("reports.walkInCustomer"),
    sale.total_amount.toString(),
    sale.payment_method,
    sale.notes || "",
  ]);

  autoTable(doc, {
    head: [[t("reports.pdf.saleDate"), t("reports.pdf.customer"), t("reports.pdf.totalAmount"), t("reports.pdf.paymentMethod"), t("reports.pdf.notes")]],
    body: tableData,
    startY: 20,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
  });

  return doc;
};

  const exportSalesReportPDF = () => {
    const doc = generateSalesReportPDF();
    doc.save(`Sales-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({
      title: "Export successful",
      description: t("reports.exportPdfSuccess"),
    });
  };

  const generateInventoryReportPDF = () => {
    const doc = new jsPDF();
    const metaLines = [
      `${t("reports.generatedOn")}: ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
      ...(businessInfo?.business_name ? [businessInfo.business_name] : []),
    ];
    const headerY = addReportHeaderImages(doc, t("reports.inventoryReport"), metaLines);

    const tableData = inventory.map((item) => [
      item.name,
      item.category || "Uncategorized",
      item.sku || "",
      item.stock_quantity.toString(),
      item.unit_price.toString(),
      (Number(item.unit_price) * item.stock_quantity).toFixed(2),
      item.is_active ? "Active" : "Inactive",
    ]);

    autoTable(doc, {
      head: [[
        t("reports.pdf.product"), 
        t("reports.pdf.category"), 
        t("reports.pdf.sku"), 
        t("reports.pdf.stock"), 
        t("reports.pdf.unitPrice"), 
        t("reports.pdf.totalValue"), 
        t("reports.pdf.status")
      ]],
      body: tableData,
      startY: headerY + 3,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    return doc;
  };

  const exportInventoryReportPDF = () => {
    const doc = generateInventoryReportPDF();
    doc.save(`Inventory-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({
      title: "Export successful",
      description: t("reports.exportPdfSuccess"),
    });
  };

  const generateCustomerReportPDF = () => {
    const doc = new jsPDF();
    const metaLines = [
      `${t("reports.generatedOn")}: ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
      ...(businessInfo?.business_name ? [businessInfo.business_name] : []),
    ];
    const headerY = addReportHeaderImages(doc, t("reports.customerReport"), metaLines);

    const tableData = customers.map((customer) => [
      customer.name,
      customer.phone || "",
      customer.email || "",
      customer.business_type || "",
      (customer.credit_limit || 0).toString(),
      (customer.current_balance || 0).toString(),
    ]);

    autoTable(doc, {
      head: [[
        t("reports.pdf.name"), 
        t("reports.pdf.phone"), 
        t("reports.pdf.email"), 
        t("reports.pdf.businessType"), 
        t("reports.pdf.creditLimit"), 
        t("reports.pdf.balance")
      ]],
      body: tableData,
      startY: headerY + 3,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    return doc;
  };

  const exportCustomerReportPDF = () => {
    const doc = generateCustomerReportPDF();
    doc.save(`Customer-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({
      title: "Export successful",
      description: t("reports.exportPdfSuccess"),
    });
  };

  const generateMonthlySummaryPDF = () => {
    const doc = new jsPDF();
    const metaLines = [
      `${t("reports.generatedOn")}: ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
      ...(businessInfo?.business_name ? [businessInfo.business_name] : []),
    ];
    const headerY = addReportHeaderImages(doc, t("reports.monthlySummaryReport"), metaLines);

    const tableData = [
      [
        `${format(dateRange?.from || subMonths(new Date(), 6), "yyyy-MM-dd")} to ${format(dateRange?.to || new Date(), "yyyy-MM-dd")}`,
        reportData.summary.totalRevenue.toString(),
        reportData.summary.totalOrders.toString(),
        Math.round(reportData.summary.avgOrderValue).toString(),
        reportData.summary.activeCustomers.toString(),
      ],
    ];

    autoTable(doc, {
      head: [["Period", "Total Revenue", "Total Orders", "Avg Order Value", "Active Customers"]],
      body: tableData,
      startY: headerY + 3,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    return doc;
  };

  const exportMonthlySummaryPDF = () => {
    const doc = generateMonthlySummaryPDF();
    doc.save(`Monthly-Summary-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({
      title: "Export successful",
      description: t("reports.exportPdfSuccess"),
    });
  };

  const exportSalesReport = () => {
    const salesData = reportData.filteredSales.map((sale) => ({
      [t("reports.csv.saleDate")]: format(new Date(sale.sale_date), "yyyy-MM-dd"),
      [t("reports.csv.customer")]: sale.customer?.name || t("reports.walkInCustomer"),
      [t("reports.csv.totalAmount")]: sale.total_amount,
      [t("reports.csv.paymentMethod")]: sale.payment_method,
      [t("reports.csv.notes")]: sale.notes || "",
    }));
    exportToCSV(salesData, "Sales-Report");
  };

  const exportInventoryReport = () => {
    const inventoryData = inventory.map((item) => ({
      [t("reports.csv.productName")]: item.name,
      [t("reports.csv.category")]: item.category || "Uncategorized",
      [t("reports.csv.sku")]: item.sku || "",
      [t("reports.csv.stockQuantity")]: item.stock_quantity,
      [t("reports.csv.unitPrice")]: item.unit_price,
      [t("reports.csv.costPrice")]: item.cost_price || 0,
      [t("reports.csv.totalValue")]: (Number(item.unit_price) * item.stock_quantity).toFixed(2),
      [t("reports.csv.minStockLevel")]: item.min_stock_level || 0,
      [t("reports.csv.status")]: item.is_active ? "Active" : "Inactive",
    }));
    exportToCSV(inventoryData, "Inventory-Report");
  };

  const exportCustomerReport = () => {
    const customerData = customers.map((customer) => ({
      [t("reports.csv.customer")]: customer.name,
      [t("reports.csv.phone")]: customer.phone || "",
      [t("reports.csv.email")]: customer.email || "",
      [t("reports.csv.address")]: customer.address || "",
      [t("reports.csv.businessType")]: customer.business_type || "",
      [t("reports.csv.creditLimit")]: customer.credit_limit || 0,
      [t("reports.csv.currentBalance")]: customer.current_balance || 0,
    }));
    exportToCSV(customerData, "Customer-Report");
  };

  const exportMonthlySummary = () => {
    const summaryData = [
      {
        [t("reports.csv.reportPeriod")]: `${format(dateRange?.from || subMonths(new Date(), 6), "yyyy-MM-dd")} to ${format(dateRange?.to || new Date(), "yyyy-MM-dd")}`,
        [t("reports.csv.totalRevenue")]: reportData.summary.totalRevenue,
        [t("reports.csv.totalOrders")]: reportData.summary.totalOrders,
        [t("reports.csv.avgOrderValue")]: Math.round(reportData.summary.avgOrderValue),
        [t("reports.csv.activeCustomers")]: reportData.summary.activeCustomers,
        [t("reports.csv.generatedOn")]: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      },
    ];
    exportToCSV(summaryData, "Monthly-Summary");
  };

  const generateExpenseReportPDF = () => {
    const doc = new jsPDF();
    const metaLines = [
      `${t("reports.generatedOn")}: ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
      `${t("reports.period")}: ${format(dateRange?.from || subMonths(new Date(), 6), "yyyy-MM-dd")} ${t("pagination.to")} ${format(dateRange?.to || new Date(), "yyyy-MM-dd")}`,
      ...(businessInfo?.business_name ? [businessInfo.business_name] : []),
    ];
    const headerY = addReportHeaderImages(doc, t("reports.expenseReport") || "Expense Report", metaLines);

    const tableData = reportData.filteredExpenses.map((exp) => [
      format(new Date(exp.expense_date), "yyyy-MM-dd"),
      exp.description,
      formatCategory(exp.category) || "Uncategorized",
      exp.supplier?.name || "-",
      exp.payment_method || "cash",
      Number(exp.amount).toLocaleString(),
    ]);

    autoTable(doc, {
      head: [["Date", "Description", "Category", "Supplier", "Payment", "Amount"]],
      body: tableData,
      startY: headerY + 3,
      theme: "grid",
      headStyles: { fillColor: [239, 68, 68] },
      foot: [["", "", "", "", "Total", reportData.summary.totalExpenses.toLocaleString()]],
      footStyles: { fillColor: [243, 244, 246], textColor: 0, fontStyle: "bold" },
    });

    return doc;
  };

  const exportExpenseReportPDF = () => {
    const doc = generateExpenseReportPDF();
    doc.save(`Expense-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({ title: "Export successful", description: t("reports.exportPdfSuccess") });
  };

  const exportExpenseReport = () => {
    const data = reportData.filteredExpenses.map((exp) => ({
      Date: format(new Date(exp.expense_date), "yyyy-MM-dd"),
      Description: exp.description,
      Category: formatCategory(exp.category) || "Uncategorized",
      Supplier: exp.supplier?.name || "",
      "Payment Method": exp.payment_method || "cash",
      Amount: exp.amount,
      Notes: exp.notes || "",
    }));
    exportToCSV(data, "Expense-Report");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm">{t("reports.loadingReports")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t("reports.title")}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("reports.description")}
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full md:w-auto">
          {/* Quick preset filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "today", labelKey: "reports.preset.today" },
              { key: "yesterday", labelKey: "reports.preset.yesterday" },
              { key: "last7", labelKey: "reports.preset.last7" },
              { key: "last30", labelKey: "reports.preset.last30" },
              { key: "thisMonth", labelKey: "reports.preset.thisMonth" },
              { key: "lastMonth", labelKey: "reports.preset.lastMonth" },
            ].map((preset) => {
              const label = t(preset.labelKey) || preset.labelKey; // Better fallback
              return (
                <Button
                  key={preset.key}
                  size="sm"
                  variant={activePreset === preset.key ? "default" : "outline"}
                  onClick={() => applyPreset(preset.key)}
                  className="rounded-full text-xs h-8 whitespace-nowrap"
                >
                  {label}
                </Button>
              );
            })}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant={activePreset === "custom" ? "default" : "outline"}
                  onClick={() => setActivePreset("custom")}
                  className="rounded-full text-xs h-8 whitespace-nowrap"
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {t("reports.preset.custom") || "Custom"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 max-w-[95vw]"
                align={isMobile ? "center" : "start"}
                side="bottom"
              >
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(r) => {
                    setDateRange(r);
                    setActivePreset("custom");
                  }}
                  numberOfMonths={isMobile ? 1 : 2}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Active range summary */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <CalendarIcon className="h-3.5 w-3.5" />
            {dateRange?.from ? (
              dateRange.to ? (
                <span>
                  {format(dateRange.from, "LLL dd, y")} – {format(dateRange.to, "LLL dd, y")}
                </span>
              ) : (
                <span>{format(dateRange.from, "LLL dd, y")}</span>
              )
            ) : (
              <span>{t("reports.selectDateRange")}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">


          <Popover>
            <PopoverTrigger asChild>
              <Button variant="gradient" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                {t("reports.exportReport")}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[90vw] max-w-sm bg-background border shadow-lg z-[60]"
              align="end"
              side="bottom"
              sideOffset={8}
            >
              <div className="space-y-4">
                <p className="text-sm font-semibold">{t("reports.exportReports")}</p>

                {/* Sales Report */}
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">{t("reports.salesReport")}</span>
                  <div className="flex gap-2">
                    <ShareButton
                      documentType="report"
                      documentData={{
                        reportType: "Sales Report",
                        period: `${format(dateRange?.from || subMonths(new Date(), 6), "yyyy-MM-dd")} to ${format(dateRange?.to || new Date(), "yyyy-MM-dd")}`,
                      }}
                      generatePDF={generateSalesReportPDF}
                      subject={`Sales Report - ${format(new Date(), "yyyy-MM-dd")}`}
                      fileName={`Sales-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`}
                      iconOnly
                    />
                    <Button variant="ghost" size="icon" onClick={exportSalesReportPDF} className="h-8 w-8">
                      <FileDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={exportSalesReport} className="h-8 w-8">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Inventory Report */}
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">{t("reports.inventoryReport")}</span>
                  <div className="flex gap-2">
                    <ShareButton
                      documentType="report"
                      documentData={{
                        reportType: "Inventory Report",
                        period: `${format(new Date(), "yyyy-MM-dd")}`,
                      }}
                      generatePDF={generateInventoryReportPDF}
                      subject={`Inventory Report - ${format(new Date(), "yyyy-MM-dd")}`}
                      fileName={`Inventory-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`}
                      iconOnly
                    />
                    <Button variant="ghost" size="icon" onClick={exportInventoryReportPDF} className="h-8 w-8">
                      <FileDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={exportInventoryReport} className="h-8 w-8">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Customer Report */}
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">{t("reports.customerReport")}</span>
                  <div className="flex gap-2">
                    <ShareButton
                      documentType="report"
                      documentData={{
                        reportType: "Customer Report",
                        period: `${format(new Date(), "yyyy-MM-dd")}`,
                      }}
                      generatePDF={generateCustomerReportPDF}
                      subject={`Customer Report - ${format(new Date(), "yyyy-MM-dd")}`}
                      fileName={`Customer-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`}
                      iconOnly
                    />
                    <Button variant="ghost" size="icon" onClick={exportCustomerReportPDF} className="h-8 w-8">
                      <FileDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={exportCustomerReport} className="h-8 w-8">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Expense Report */}
               {/* Expense Report */}
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">{t("reports.expenseReport") || "Expense Report"}</span>
                  <div className="flex gap-2">
                    <ShareButton
                      documentType="report"
                      documentData={{
                        reportType: "Expense Report",
                        period: `${format(dateRange?.from || subMonths(new Date(), 6), "yyyy-MM-dd")} to ${format(dateRange?.to || new Date(), "yyyy-MM-dd")}`,
                      }}
                      generatePDF={generateExpenseReportPDF}
                      subject={`Expense Report - ${format(new Date(), "yyyy-MM-dd")}`}
                      fileName={`Expense-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`}
                      iconOnly
                    />
                    <Button variant="ghost" size="icon" onClick={exportExpenseReportPDF} className="h-8 w-8">
                      <FileDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={exportExpenseReport} className="h-8 w-8">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Monthly Summary */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">{t("reports.monthlySummary")}</span>
                  <div className="flex gap-2">
                    <ShareButton
                      documentType="report"
                      documentData={{
                        reportType: "Monthly Summary",
                        period: `${format(dateRange?.from || subMonths(new Date(), 6), "yyyy-MM-dd")} to ${format(dateRange?.to || new Date(), "yyyy-MM-dd")}`,
                      }}
                      generatePDF={generateMonthlySummaryPDF}
                      subject={`Monthly Summary - ${format(new Date(), "yyyy-MM-dd")}`}
                      fileName={`Monthly-Summary-${format(new Date(), "yyyy-MM-dd")}.pdf`}
                      iconOnly
                    />
                    <Button variant="ghost" size="icon" onClick={exportMonthlySummaryPDF} className="h-8 w-8">
                      <FileDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={exportMonthlySummary} className="h-8 w-8">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-prosperity-green" />
              <span className="text-sm font-medium">{t("reports.periodTotalRevenue")}</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {reportData.formatCurrency
                ? reportData.formatCurrency(reportData.summary.totalRevenue)
                : reportData.summary.totalRevenue.toLocaleString(locale)}
            </div>
            <p className="text-xs text-prosperity-green mt-1">{t("reports.liveDataFromSales")}</p>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{t("reports.totalOrders")}</span>
            </div>
            <div className="text-2xl font-bold mt-2">{reportData.summary.totalOrders.toLocaleString(locale)}</div>
            <p className="text-xs text-primary mt-1">{t("reports.salesPlusInvoices")}</p>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-fintech-blue" />
              <span className="text-sm font-medium">{t("reports.avgOrderValue")}</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {reportData.formatCurrency
                ? reportData.formatCurrency(Math.round(reportData.summary.avgOrderValue))
                : Math.round(reportData.summary.avgOrderValue).toLocaleString(locale)}
            </div>
            <p className="text-xs text-fintech-blue mt-1">{t("reports.averagePerTransaction")}</p>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {/* <Calendar className="h-5 w-5 text-warning" /> */}
              <span className="text-sm font-medium">{t("reports.activeCustomers")}</span>
            </div>
            <div className="text-2xl font-bold mt-2">{reportData.summary.activeCustomers.toLocaleString(locale)}</div>
            <p className="text-xs text-warning mt-1">{t("reports.totalRegisteredCustomers")}</p>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-destructive" />
              <span className="text-sm font-medium">{t("reports.totalExpenses") || "Total Expenses"}</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {reportData.formatCurrency
                ? reportData.formatCurrency(reportData.summary.totalExpenses)
                : reportData.summary.totalExpenses.toLocaleString(locale)}
            </div>
            <p className="text-xs text-destructive mt-1">{reportData.filteredExpenses.length} {t("reports.entries") || "entries"}</p>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${reportData.summary.netProfit >= 0 ? "text-prosperity-green" : "text-destructive"}`} />
              <span className="text-sm font-medium">{t("reports.netProfit") || "Net Profit"}</span>
            </div>
            <div className={`text-2xl font-bold mt-2 ${reportData.summary.netProfit >= 0 ? "" : "text-destructive"}`}>
              {reportData.formatCurrency
                ? reportData.formatCurrency(reportData.summary.netProfit)
                : reportData.summary.netProfit.toLocaleString(locale)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("reports.revenueMinusExpenses") || "Revenue − Expenses"}</p>
          </CardContent>
        </Card>
      </div>


      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card className="professional-card">
          <CardHeader>
            <CardTitle>{t("reports.salesTrend6Months")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {reportData.salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis
                      tickFormatter={(value) => {
                        const currency = businessInfo?.currency || "SLL";
                        const prefix = currency === "SLL" ? "Le" : currency;
                        return `${prefix} ${(value / 1000).toFixed(0)}K`;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t("reports.noSalesData")}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Distribution */}
        <Card className="professional-card">
          <CardHeader>
            <CardTitle>{t("reports.inventoryValueDistribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {reportData.productData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.productData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                    >
                      {reportData.productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t("reports.noInventoryData")}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Orders */}
        <Card className="professional-card">
          <CardHeader>
            <CardTitle>{t("reports.monthlyOrderVolume")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {reportData.salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Bar dataKey="orders" fill="hsl(var(--prosperity-green))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t("reports.noOrderData")}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="professional-card">
          <CardHeader>
            <CardTitle>{t("reports.topCustomersByRevenue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topCustomers.length > 0 ? (
                reportData.topCustomers.map((customer, index) => (
                  <div key={customer.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.orders.toLocaleString(locale)} {t("reports.orders")}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-prosperity-green">
                      {reportData.formatCurrency ? reportData.formatCurrency(customer.revenue) : customer.revenue.toLocaleString(locale)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t("reports.noCustomerRevenueData")}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expense Category Distribution */}
        <Card className="professional-card">
          <CardHeader>
            <CardTitle>{t("reports.expensesByCategory") || "Expenses by Category"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {reportData.expenseCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.expenseCategoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tickFormatter={(v) => {
                      const currency = businessInfo?.currency || "SLL";
                      const prefix = currency === "SLL" ? "Le" : currency;
                      return `${prefix} ${(v / 1000).toFixed(0)}K`;
                    }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {reportData.expenseCategoryData.map((entry, index) => (
                        <Cell key={`exp-cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t("reports.noExpenseData") || "No expense data for this period"}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Export Options */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle>{t("reports.exportReports")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button variant="outline" onClick={exportSalesReport} className="h-16 flex flex-col gap-2">
              <FileText className="h-5 w-5" />
              {t("reports.salesReport")}
            </Button>
            <Button variant="outline" onClick={exportInventoryReport} className="h-16 flex flex-col gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("reports.inventoryReport")}
            </Button>
            <Button variant="outline" onClick={exportCustomerReport} className="h-16 flex flex-col gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("reports.customerReport")}
            </Button>
            <Button variant="outline" onClick={exportExpenseReport} className="h-16 flex flex-col gap-2">
              <Receipt className="h-5 w-5" />
              {t("reports.expenseReport") || "Expense Report"}
            </Button>
            <Button variant="outline" onClick={exportMonthlySummary} className="h-16 flex flex-col gap-2">
              <CalendarIcon className="h-5 w-5" />
              {t("reports.monthlySummary")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
