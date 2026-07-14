import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { AdminUser, useDeleteUser } from '@/hooks/admin/useAdminUsers';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
}

export function DeleteUserDialog({ open, onOpenChange, user }: DeleteUserDialogProps) {
  const { t } = useLanguage();
  const deleteUserMutation = useDeleteUser();

  const handleDelete = () => {
    if (!user) return;
    deleteUserMutation.mutate(user.id, { onSuccess: () => onOpenChange(false) });
  };

  const userName = user?.first_name || user?.last_name ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim() : user?.email;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px] max-w-[90vw] p-4 sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.deleteUser")}</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {t("admin.deleteUserConfirm")} <strong>{userName}</strong>? {t("admin.deleteUserWarning")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <AlertDialogCancel disabled={deleteUserMutation.isPending} className="order-2 sm:order-1 h-12 text-base">{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleteUserMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 order-1 sm:order-2 h-12 text-base min-w-[100px]">
            {deleteUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("admin.deleteUser")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}