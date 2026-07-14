import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus } from 'lucide-react'
import { useCreateAdminUser } from '@/hooks/admin/useAdminUsers'
import { useLanguage } from '@/contexts/LanguageContext'

interface AddAdminUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddAdminUserModal({ open, onOpenChange }: AddAdminUserModalProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '' })
  const createAdminMutation = useCreateAdminUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    createAdminMutation.mutate(formData, {
      onSuccess: () => {
        setFormData({ email: '', password: '', firstName: '', lastName: '' })
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t("admin.addNewAdminUser")}
          </DialogTitle>
          <DialogDescription>{t("admin.createAdminDesc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 grid gap-4 sm:gap-6 py-4">
            <h3 className="text-base sm:text-lg font-semibold">{t("admin.accountDetails")}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")} *</Label>
              <Input id="email" type="email" placeholder="admin@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-12 text-base" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("admin.password")} *</Label>
              <Input id="password" type="password" placeholder={t("admin.minChars")} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="h-12 text-base" required minLength={6} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("admin.firstName")}</Label>
                <Input id="firstName" placeholder="John" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="h-12 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("admin.lastName")}</Label>
                <Input id="lastName" placeholder="Doe" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="h-12 text-base" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createAdminMutation.isPending} className="order-2 sm:order-1 h-12 text-base">{t("common.cancel")}</Button>
            <Button type="submit" disabled={createAdminMutation.isPending} className="order-1 sm:order-2 min-w-[100px] h-12 text-base">
              {createAdminMutation.isPending ? t("admin.creating") : t("admin.createAdminBtn")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
