import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText } from "lucide-react";
import { Sale } from "@/hooks/useSales";
import { Invoice } from "@/hooks/useInvoices";
import { useLanguage } from "@/contexts/LanguageContext";

interface TodaySalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  todaySales: Sale[];
  todayInvoices: Invoice[];
}

export const TodaySalesModal = ({
  isOpen,
  onClose,
  todaySales,
  todayInvoices,
}: TodaySalesModalProps) => {
  const { t } = useLanguage();

  const todaySalesAmount = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const todayInvoicesAmount = todayInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const totalTodayAmount = todaySalesAmount + todayInvoicesAmount;

  // Combine and sort transactions
  const allTransactions = [
    ...todaySales.map((sale) => ({
      id: sale.id,
      type: "sale" as const,
      customer_name: sale.customer?.name || "Walk-in Customer",
      amount: sale.total_amount,
      payment_method: sale.payment_method,
      date: sale.sale_date,
    })),
    ...todayInvoices.map((invoice) => ({
      id: invoice.id,
      type: "invoice" as const,
      customer_name: invoice.customer?.name || "Walk-in Customer",
      amount: Number(invoice.total_amount),
      payment_method: invoice.status || "draft",
      date: invoice.invoice_date,
      invoice_number: invoice.invoice_number,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t("sales.todaySales")} - {new Date().toLocaleDateString()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-primary">Le {totalTodayAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Sales</p>
                <p className="text-lg font-bold text-green-600">Le {todaySalesAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Invoices</p>
                <p className="text-lg font-bold text-blue-600">Le {todayInvoicesAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Count */}
          <div className="text-sm text-muted-foreground">
            {todaySales.length} sales, {todayInvoices.length} invoices today
          </div>

          {/* Transaction History */}
          {allTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions today
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-2">
                {allTransactions.map((transaction) => (
                  <Card key={`${transaction.type}-${transaction.id}`} className="border">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{transaction.customer_name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {transaction.type === "sale" ? (
                              <Badge variant="success" className="text-xs">Sale</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                INV
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="font-bold text-primary">Le {transaction.amount.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTransactions.map((transaction) => (
                      <TableRow key={`${transaction.type}-${transaction.id}`}>
                        <TableCell className="font-medium">{transaction.customer_name}</TableCell>
                        <TableCell>
                          {transaction.type === "sale" ? (
                            <Badge variant="success">Sale</Badge>
                          ) : (
                            <Badge variant="secondary">
                              <FileText className="h-3 w-3 mr-1" />
                              Invoice
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
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
      </DialogContent>
    </Dialog>
  );
};
