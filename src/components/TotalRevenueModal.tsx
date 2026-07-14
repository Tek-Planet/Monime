import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, FileText } from "lucide-react";
import { Sale } from "@/hooks/useSales";
import { Invoice } from "@/hooks/useInvoices";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMemo } from "react";

interface TotalRevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  paidInvoices: Invoice[];
  totalRevenue: number;
  salesRevenue: number;
  invoiceRevenue: number;
}

interface RevenueTransaction {
  id: string;
  type: "sale" | "invoice";
  customer_name: string | null;
  date: string;
  amount: number;
  invoice_number?: string;
}

export function TotalRevenueModal({
  isOpen,
  onClose,
  sales,
  paidInvoices,
  totalRevenue,
  salesRevenue,
  invoiceRevenue,
}: TotalRevenueModalProps) {
  const { t } = useLanguage();

  const transactions = useMemo(() => {
    const saleTransactions: RevenueTransaction[] = sales.map((sale) => ({
      id: sale.id,
      type: "sale" as const,
      customer_name: sale.customer?.name || null,
      date: sale.sale_date,
      amount: sale.total_amount,
    }));

    const invoiceTransactions: RevenueTransaction[] = paidInvoices.map((invoice) => ({
      id: invoice.id,
      type: "invoice" as const,
      customer_name: invoice.customer?.name || null,
      date: invoice.invoice_date,
      amount: Number(invoice.total_amount) || 0,
      invoice_number: invoice.invoice_number,
    }));

    return [...saleTransactions, ...invoiceTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [sales, paidInvoices]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-prosperity-green" />
            Revenue Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Revenue Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-prosperity-green/10 border-prosperity-green/20">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-prosperity-green">Le {totalRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Sales Revenue</p>
                <p className="text-lg font-semibold">Le {salesRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Invoice Revenue</p>
                <p className="text-lg font-semibold">Le {invoiceRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <div>
            <h3 className="font-semibold mb-3">Transaction History ({transactions.length})</h3>

            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No revenue transactions yet</p>
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="md:hidden space-y-2">
                  {transactions.map((transaction) => (
                    <Card key={`${transaction.type}-${transaction.id}`} className="border">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{transaction.customer_name || "Walk-in Customer"}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-prosperity-green">
                              Le {transaction.amount.toLocaleString()}
                            </p>
                            {transaction.type === "sale" ? (
                              <Badge variant="success" className="text-xs">Sale</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                {transaction.invoice_number}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={`${transaction.type}-${transaction.id}`}>
                          <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                          <TableCell>{transaction.customer_name || "Walk-in Customer"}</TableCell>
                          <TableCell>
                            {transaction.type === "sale" ? (
                              <Badge variant="success">Sale</Badge>
                            ) : (
                              <Badge variant="secondary">
                                <FileText className="h-3 w-3 mr-1" />
                                {transaction.invoice_number}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium text-prosperity-green">
                            Le {transaction.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
