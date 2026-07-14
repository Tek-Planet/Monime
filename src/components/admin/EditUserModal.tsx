import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Edit } from 'lucide-react';
import { AdminUser, useUpdateUser } from '@/hooks/admin/useAdminUsers';
import { useLanguage } from '@/contexts/LanguageContext';

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
}

export function EditUserModal({ open, onOpenChange, user }: EditUserModalProps) {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const updateUserMutation = useUpdateUser();

  useEffect(() => {
    if (user) { setFirstName(user.first_name || ''); setLastName(user.last_name || ''); setIsAdmin(user.is_admin); }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    updateUserMutation.mutate({ userId: user.id, firstName, lastName, isAdmin }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5" />{t("admin.editUser")}</DialogTitle>
          <DialogDescription>{t("admin.editUserDesc")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 grid gap-4 sm:gap-6 py-4">
            <h3 className="text-base sm:text-lg font-semibold">{t("admin.userInformation")}</h3>
            <div className="space-y-2">
              <Label htmlFor="email">{t("admin.email")}</Label>
              <Input id="email" value={user?.email || ''} disabled className="bg-muted h-12 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("admin.firstName")}</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t("admin.enterFirstName")} className="h-12 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("admin.lastName")}</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t("admin.enterLastName")} className="h-12 text-base" />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="isAdmin" className="text-base">{t("admin.adminRole")}</Label>
                <p className="text-sm text-muted-foreground">{t("admin.grantAdminPrivileges")}</p>
              </div>
              <Switch id="isAdmin" checked={isAdmin} onCheckedChange={setIsAdmin} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="order-2 sm:order-1 h-12 text-base">{t("common.cancel")}</Button>
            <Button type="submit" disabled={updateUserMutation.isPending} className="order-1 sm:order-2 min-w-[100px] h-12 text-base">
              {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.saveChanges")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}