import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useExpenses } from "@/hooks/useExpenses";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { EXPENSE_CATEGORIES } from "@/lib/formatCategory";
import { useBranchContext } from "@/contexts/BranchContext";
const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().optional(),
  supplier_id: z.string().optional(),
  payment_method: z.string().default("cash"),
  expense_date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function AddExpenseModal({ open, onOpenChange, onClose }: AddExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const { createExpense } = useExpenses();
  const { suppliers } = useSuppliers();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { selectedBranchId } = useBranchContext();
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      supplier_id: "",
      payment_method: "cash",
      expense_date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
    try {
      setLoading(true);
      await createExpense({
        description: values.description,
        amount: parseFloat(values.amount),
        category: values.category || undefined,
        supplier_id: values.supplier_id || undefined,
        payment_method: values.payment_method as "cash" | "bank_transfer" | "mobile_money" | "credit",
        expense_date: values.expense_date,
        notes: values.notes || undefined,
        branch_id: selectedBranchId || undefined,
      });
      toast({
        title: t("modal.success"),
        description: t("expense.addedSuccess"),
      });
      form.reset();
      onClose();
    } catch (error) {
      toast({
        title: t("modal.error"),
        description: t("expense.failedToAdd"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { value: "cash", label: t("payment.cash") },
    { value: "bank_transfer", label: t("payment.bankTransfer") },
    { value: "mobile_money", label: t("payment.mobileMoney") },
    { value: "credit", label: t("payment.credit") },
  ];


  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("expense.description")} *</FormLabel>
              <FormControl>
                <Input placeholder={t("expense.enterDescription")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.amount")} *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expense_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expense.date")} *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("expense.category")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("expense.selectCategory")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="supplier_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("expense.supplier")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("expense.selectSupplier")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("sale.paymentMethod")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("expense.selectPaymentMethod")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("invoice.notes")}</FormLabel>
              <FormControl>
                <Textarea placeholder={t("expense.additionalNotes")} className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            {t("modal.cancel")}
          </Button>
          <Button type="submit" variant="gradient" disabled={loading} className="w-full sm:w-auto">
            {loading ? t("modal.adding") : t("expense.addExpense")}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="text-left flex-shrink">
            <DrawerTitle>{t("expense.addNew")}</DrawerTitle>
            <DrawerDescription>{t("expense.recordNew")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto flex-1">{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink">
          <DialogTitle>{t("expense.addNew")}</DialogTitle>
          <DialogDescription>{t("expense.recordNew")}</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1">{formContent}</div>
      </DialogContent>
    </Dialog>
  );
}