import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCategory } from "@/lib/formatCategory";
import { Expense } from "@/hooks/useExpenses";
import { format } from "date-fns";

interface ViewExpenseModalProps {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function ViewExpenseModal({ expense, open, onOpenChange, onClose }: ViewExpenseModalProps) {
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  if (!expense) return null;

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return t("payment.cash");
    switch (method) {
      case "cash":
        return t("payment.cash");
      case "mobile_money":
        return t("payment.mobileMoney");
      case "bank_transfer":
        return t("payment.bankTransfer");
      case "credit":
        return t("payment.credit");
      default:
        return formatCategory(method);
    }
  };

  const content = (
    <div className="space-y-6 overflow-y-auto flex-1">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{t("expense.description")}</h3>
          <p className="text-lg font-semibold">{expense.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("expense.amount")}</h3>
            <p className="text-xl font-bold text-primary">SLL {Number(expense.amount).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("expense.date")}</h3>
            <p className="text-lg">{format(new Date(expense.expense_date), "MMMM dd, yyyy")}</p>
          </div>
        </div>

        {expense.category && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("expense.category")}</h3>
            <Badge variant="outline" className="mt-1">
              {formatCategory(expense.category)}
            </Badge>
          </div>
        )}

        {expense.supplier?.name && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("expense.supplier")}</h3>
            <p className="text-lg">{expense.supplier.name}</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{t("sale.paymentMethod")}</h3>
          <Badge variant="secondary" className="mt-1">
            {getPaymentMethodLabel(expense.payment_method)}
          </Badge>
        </div>

        {expense.notes && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("invoice.notes")}</h3>
            <p className="text-sm bg-muted p-3 rounded-md mt-1">{expense.notes}</p>
          </div>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
        <div>
          <span className="font-medium">{t("common.created")}:</span>
          <br />
          {format(new Date(expense.created_at), "MMM dd, yyyy HH:mm")}
        </div>
        <div>
          <span className="font-medium">{t("common.updated")}:</span>
          <br />
          {format(new Date(expense.updated_at), "MMM dd, yyyy HH:mm")}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button onClick={onClose}>{t("modal.close")}</Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="text-left flex-shrink-0">
            <DrawerTitle>{t("expense.expenseDetails")}</DrawerTitle>
            <DrawerDescription>{t("expense.viewComplete")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto flex-1">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="text-left flex-shrink-0">
          <DialogTitle>{t("expense.expenseDetails")}</DialogTitle>
          <DialogDescription>{t("expense.viewComplete")}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}