import React, { useState } from "react";
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
import { AlertTriangle, Trash2, Info, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "default";
  onConfirm: () => Promise<void> | void;
  itemName?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  variant = "destructive",
  onConfirm,
  itemName,
}: ConfirmDialogProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Confirm action error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    if (variant === "destructive") {
      return (
        <div className="mx-auto sm:mx-0 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mb-2 sm:mb-0">
          <Trash2 className="h-6 w-6" />
        </div>
      );
    }
    if (variant === "warning") {
      return (
        <div className="mx-auto sm:mx-0 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-2 sm:mb-0">
          <AlertTriangle className="h-6 w-6" />
        </div>
      );
    }
    return (
      <div className="mx-auto sm:mx-0 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mb-2 sm:mb-0">
        <Info className="h-6 w-6" />
      </div>
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[440px] p-6 gap-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {getIcon()}
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <AlertDialogHeader className="p-0 space-y-1 text-center sm:text-left">
              <AlertDialogTitle className="text-xl font-semibold tracking-tight">
                {title || t("common.confirmAction") || "Are you sure?"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                {description ||
                  (itemName
                    ? `${t("common.deleteConfirmItem") || "Are you sure you want to delete"} "${itemName}"? ${t("common.actionCannotBeUndone") || "This action cannot be undone."}`
                    : t("common.confirmDescription") || "This action cannot be undone.")}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
        </div>

        <AlertDialogFooter className="sm:justify-end gap-2 pt-2 border-t border-border/40">
          <AlertDialogCancel disabled={loading} className="mt-0">
            {cancelText || t("common.cancel") || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={
              variant === "destructive"
                ? "bg-rose-600 hover:bg-rose-700 focus:ring-rose-600 text-white font-medium"
                : variant === "warning"
                ? "bg-amber-600 hover:bg-amber-700 text-white font-medium"
                : "bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            }
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmText || (variant === "destructive" ? t("common.delete") || "Delete" : t("common.confirm") || "Confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
