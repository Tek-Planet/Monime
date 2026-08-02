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
import { cn, parseLocalDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ShareButton } from "@/components/ShareButton";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { createModernPDFDocument, renderModernTable, addPDFPageFooters } from "@/lib/pdfTemplate";

const Reports = () => {
  const { t, locale } = useLanguage();
  const { business, loading: businessLoading, profilePhoto } = useUserProfile();
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
    const startDate = dateRange?.from ? startOfDay(dateRange.from) : startOfDay(subMonths(new Date(), 6));
    const endDate = dateRange?.to ? endOfDay(dateRange.to) : endOfDay(new Date());

    const filteredSales = sales.filter((sale) => {
      const saleDate = parseLocalDate(sale.sale_date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const filteredInvoices = invoices.filter((invoice) => {
      const invoiceDate = parseLocalDate(invoice.invoice_date);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });

    // Generate sales data for the date range
    const salesData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthSales = filteredSales.filter((sale) => {
        const saleDate = parseLocalDate(sale.sale_date);
        return saleDate >= monthStart && saleDate <= monthEnd;
      });

      const monthInvoices = filteredInvoices.filter((invoice) => {
        const invoiceDate = parseLocalDate(invoice.invoice_date);
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
      const expenseDate = parseLocalDate(expense.expense_date);
      return expenseDate >= startDate && expenseDate <= endDate;
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

  const generateSalesReportPDF = async () => {
    const currency = businessInfo?.currency || "SLL";
    const logoUrl = profilePhoto?.url || null;

    const fromDateStr = format(dateRange?.from || subMonths(new Date(), 6), "PPP");
    const toDateStr = format(dateRange?.to || new Date(), "PPP");

    const { doc, startY } = await createModernPDFDocument({
      docType: "report",
      title: t("reports.salesReport") || "SALES REPORT",
      subtitle: `${t("reports.period") || "Period"}: ${fromDateStr} - ${toDateStr}`,
      date: format(new Date(), "PPP"),
      business: {
        business_name: business?.business_name || businessInfo?.business_name || t("business.defaultname"),
        address: business?.address || null,
        phone: business?.phone || null,
        email: business?.email || null,
        currency: currency,
        logoUrl: logoUrl,
      },
      summaryCards: [
        { label: "TOTAL REVENUE", value: `${currency} ${reportData.summary.totalRevenue.toLocaleString()}` },
        { label: "TOTAL ORDERS", value: `${reportData.summary.totalOrders}` },
        { label: "AVG ORDER VALUE", value: `${currency} ${Math.round(reportData.summary.avgOrderValue).toLocaleString()}` },
      ],
    });

    const tableData = reportData.filteredSales.map((sale, idx) => [
      `${idx + 1}`,
      format(new Date(sale.sale_date), "yyyy-MM-dd"),
      sale.customer?.name || t("reports.walkInCustomer"),
      sale.payment_method?.replace("_", " ").toUpperCase() || "CASH",
      `${currency} ${sale.total_amount.toLocaleString()}`,
      sale.notes || "-",
    ]);

    renderModernTable(doc, {
      startY: startY,
      head: [["#", t("reports.pdf.saleDate") || "Date", t("reports.pdf.customer") || "Customer", t("reports.pdf.paymentMethod") || "Payment Method", t("reports.pdf.totalAmount") || "Total Amount", t("reports.pdf.notes") || "Notes"]],
      body: tableData.length > 0 ? tableData : [["-", "No sales found in this period", "-", "-", "-", "-"]],
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 28 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 32 },
        4: { cellWidth: 35, halign: "right" },
        5: { cellWidth: 35 },
      },
    });

    addPDFPageFooters(doc, {
      title: "SALES REPORT",
      business: { business_name: business?.business_name || businessInfo?.business_name },
    });

    return doc;
  };

  const exportSalesReportPDF = async () => {
    const doc = await generateSalesReportPDF();
    doc.save(`Sales-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({
      title: "Export successful",
      description: t("reports.exportPdfSuccess"),
    });
  };

  const generateInventoryReportPDF = async () => {
    const currency = businessInfo?.currency || "SLL";
    const logoUrl = profilePhoto?.url || null;

    const totalStockValue = inventory.reduce((acc, item) => acc + (Number(item.unit_price) * item.stock_quantity), 0);
    const lowStockCount = inventory.filter((i) => i.stock_quantity <= (i.min_stock_level || 5)).length;

    const { doc, startY } = await createModernPDFDocument({
      docType: "report",
      title: t("reports.inventoryReport") || "INVENTORY REPORT",
      subtitle: `Stock Status & Valuation Summary`,
      date: format(new Date(), "PPP"),
      business: {
        business_name: business?.business_name || businessInfo?.business_name || t("business.defaultname"),
        address: business?.address || null,
        phone: business?.phone || null,
        email: business?.email || null,
        currency: currency,
        logoUrl: logoUrl,
      },
      summaryCards: [
        { label: "TOTAL PRODUCTS", value: `${inventory.length}` },
        { label: "TOTAL STOCK VALUE", value: `${currency} ${totalStockValue.toLocaleString()}` },
        { label: "LOW STOCK ITEMS", value: `${lowStockCount}` },
      ],
    });

    const tableData = inventory.map((item, idx) => [
      `${idx + 1}`,
      item.name,
      item.category || "Uncategorized",
      item.sku || "-",
      `${item.stock_quantity}`,
      `${currency} ${Number(item.unit_price).toLocaleString()}`,
      `${currency} ${(Number(item.unit_price) * item.stock_quantity).toLocaleString()}`,
      item.is_active ? "Active" : "Inactive",
    ]);

    renderModernTable(doc, {
      startY: startY,
      head: [["#", t("reports.pdf.product") || "Product", t("reports.pdf.category") || "Category", t("reports.pdf.sku") || "SKU", t("reports.pdf.stock") || "Stock", t("reports.pdf.unitPrice") || "Unit Price", t("reports.pdf.totalValue") || "Total Value", t("reports.pdf.status") || "Status"]],
      body: tableData.length > 0 ? tableData : [["-", "No inventory items found", "-", "-", "-", "-", "-", "-"]],
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 28 },
        3: { cellWidth: 20 },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 28, halign: "right" },
        6: { cellWidth: 32, halign: "right" },
        7: { cellWidth: 20, halign: "center" },
      },
    });

    addPDFPageFooters(doc, {
      title: "INVENTORY REPORT",
      business: { business_name: business?.business_name || businessInfo?.business_name },
    });

    return doc;
  };

  const exportInventoryReportPDF = async () => {
    const doc = await generateInventoryReportPDF();
    doc.save(`Inventory-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({
      title: "Export successful",
      description: t("reports.exportPdfSuccess"),
    });
  };

  const generateCustomerReportPDF = async () => {
    const currency = businessInfo?.currency || "SLL";
    const logoUrl = profilePhoto?.url || null;

    const totalBalance = customers.reduce((acc, c) => acc + (c.current_balance || 0), 0);
    const totalCreditLimit = customers.reduce((acc, c) => acc + (c.credit_limit || 0), 0);

    const { doc, startY } = await createModernPDFDocument({
      docType: "report",
      title: t("reports.customerReport") || "CUSTOMER REPORT",
      subtitle: `Customer Directory & Account Balances`,
      date: format(new Date(), "PPP"),
      business: {
        business_name: business?.business_name || businessInfo?.business_name || t("business.defaultname"),
        address: business?.address || null,
        phone: business?.phone || null,
        email: business?.email || null,
        currency: currency,
        logoUrl: logoUrl,
      },
      summaryCards: [
        { label: "TOTAL CUSTOMERS", value: `${customers.length}` },
        { label: "TOTAL OUTSTANDING BALANCE", value: `${currency} ${totalBalance.toLocaleString()}` },
        { label: "TOTAL CREDIT LIMIT", value: `${currency} ${totalCreditLimit.toLocaleString()}` },
      ],
    });

    const tableData = customers.map((customer, idx) => [
      `${idx + 1}`,
      customer.name,
      customer.phone || "-",
      customer.email || "-",
      customer.business_type || "-",
      `${currency} ${(customer.credit_limit || 0).toLocaleString()}`,
      `${currency} ${(customer.current_balance || 0).toLocaleString()}`,
    ]);

    renderModernTable(doc, {
      startY: startY,
      head: [["#", t("reports.pdf.name") || "Name", t("reports.pdf.phone") || "Phone", t("reports.pdf.email") || "Email", t("reports.pdf.businessType") || "Business Type", t("reports.pdf.creditLimit") || "Credit Limit", t("reports.pdf.balance") || "Balance"]],
      body: tableData.length > 0 ? tableData : [["-", "No customers registered", "-", "-", "-", "-", "-"]],
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 28 },
        3: { cellWidth: 35 },
        4: { cellWidth: 28 },
        5: { cellWidth: 28, halign: "right" },
        6: { cellWidth: 28, halign: "right" },
      },
    });

    addPDFPageFooters(doc, {
      title: "CUSTOMER REPORT",
      business: { business_name: business?.business_name || businessInfo?.business_name },
    });

    return doc;
  };

  const exportCustomerReportPDF = async () => {
    const doc = await generateCustomerReportPDF();
    doc.save(`Customer-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({
      title: "Export successful",
      description: t("reports.exportPdfSuccess"),
    });
  };

  const generateMonthlySummaryPDF = async () => {
    const currency = businessInfo?.currency || "SLL";
    const logoUrl = profilePhoto?.url || null;

    const fromDateStr = format(dateRange?.from || subMonths(new Date(), 6), "PPP");
    const toDateStr = format(dateRange?.to || new Date(), "PPP");
    const netProfit = reportData.summary.totalRevenue - reportData.summary.totalExpenses;

    const { doc, startY } = await createModernPDFDocument({
      docType: "report",
      title: t("reports.monthlySummaryReport") || "MONTHLY FINANCIAL SUMMARY",
      subtitle: `${t("reports.period") || "Period"}: ${fromDateStr} - ${toDateStr}`,
      date: format(new Date(), "PPP"),
      business: {
        business_name: business?.business_name || businessInfo?.business_name || t("business.defaultname"),
        address: business?.address || null,
        phone: business?.phone || null,
        email: business?.email || null,
        currency: currency,
        logoUrl: logoUrl,
      },
      summaryCards: [
        { label: "TOTAL REVENUE", value: `${currency} ${reportData.summary.totalRevenue.toLocaleString()}` },
        { label: "TOTAL EXPENSES", value: `${currency} ${reportData.summary.totalExpenses.toLocaleString()}` },
        { label: "NET PROFIT", value: `${currency} ${netProfit.toLocaleString()}` },
        { label: "TOTAL ORDERS", value: `${reportData.summary.totalOrders}` },
      ],
    });

    const tableData = [
      ["1", "Total Revenue", `${currency} ${reportData.summary.totalRevenue.toLocaleString()}`, "Gross sales generated in period"],
      ["2", "Total Expenses", `${currency} ${reportData.summary.totalExpenses.toLocaleString()}`, "Operating cost and supplier payouts"],
      ["3", "Net Income / Profit", `${currency} ${netProfit.toLocaleString()}`, netProfit >= 0 ? "Profitable period" : "Operating deficit"],
      ["4", "Active Customers", `${reportData.summary.activeCustomers}`, "Unique purchasing customers"],
      ["5", "Average Order Value", `${currency} ${Math.round(reportData.summary.avgOrderValue).toLocaleString()}`, "Average revenue per order"],
    ];

    renderModernTable(doc, {
      startY: startY,
      head: [["#", "Financial Metric", "Amount / Count", "Notes & Status"]],
      body: tableData,
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 50, fontStyle: "bold" },
        2: { cellWidth: 45, halign: "right", fontStyle: "bold" },
        3: { cellWidth: "auto" },
      },
    });

    addPDFPageFooters(doc, {
      title: "MONTHLY SUMMARY",
      business: { business_name: business?.business_name || businessInfo?.business_name },
    });

    return doc;
  };

  const exportMonthlySummaryPDF = async () => {
    const doc = await generateMonthlySummaryPDF();
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

  const generateExpenseReportPDF = async () => {
    const currency = businessInfo?.currency || "SLL";
    const logoUrl = profilePhoto?.url || null;

    const fromDateStr = format(dateRange?.from || subMonths(new Date(), 6), "PPP");
    const toDateStr = format(dateRange?.to || new Date(), "PPP");

    const { doc, startY } = await createModernPDFDocument({
      docType: "report",
      title: t("reports.expenseReport") || "EXPENSE REPORT",
      subtitle: `${t("reports.period") || "Period"}: ${fromDateStr} - ${toDateStr}`,
      date: format(new Date(), "PPP"),
      business: {
        business_name: business?.business_name || businessInfo?.business_name || t("business.defaultname"),
        address: business?.address || null,
        phone: business?.phone || null,
        email: business?.email || null,
        currency: currency,
        logoUrl: logoUrl,
      },
      summaryCards: [
        { label: "TOTAL EXPENSES", value: `${currency} ${reportData.summary.totalExpenses.toLocaleString()}` },
        { label: "TOTAL TRANSACTIONS", value: `${reportData.filteredExpenses.length}` },
      ],
    });

    const tableData = reportData.filteredExpenses.map((exp, idx) => [
      `${idx + 1}`,
      format(new Date(exp.expense_date), "yyyy-MM-dd"),
      exp.description,
      formatCategory(exp.category) || "Uncategorized",
      exp.supplier?.name || "-",
      exp.payment_method?.toUpperCase() || "CASH",
      `${currency} ${Number(exp.amount).toLocaleString()}`,
    ]);

    renderModernTable(doc, {
      startY: startY,
      head: [["#", "Date", "Description", "Category", "Supplier", "Payment Method", "Amount"]],
      body: tableData.length > 0 ? tableData : [["-", "No expenses recorded", "-", "-", "-", "-", "-"]],
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 25 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 28 },
        4: { cellWidth: 28 },
        5: { cellWidth: 25 },
        6: { cellWidth: 30, halign: "right" },
      },
    });

    addPDFPageFooters(doc, {
      title: "EXPENSE REPORT",
      business: { business_name: business?.business_name || businessInfo?.business_name },
    });

    return doc;
  };

  const exportExpenseReportPDF = async () => {
    const doc = await generateExpenseReportPDF();
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
