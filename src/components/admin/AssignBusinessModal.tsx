import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useUnassignedBusinesses, useAssignBusinessToNGO } from '@/hooks/admin/useAdminBusinesses'
import { Building } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface AssignBusinessModalProps {
  ngoId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AssignBusinessModal({ ngoId, open, onOpenChange, onSuccess }: AssignBusinessModalProps) {
  const { t } = useLanguage()
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('')
  const { data: businesses = [], isLoading } = useUnassignedBusinesses(open)
  const assignMutation = useAssignBusinessToNGO()

  const handleAssign = async () => {
    if (!selectedBusinessId) return
    assignMutation.mutate({ businessId: selectedBusinessId, ngoId }, { onSuccess: () => { onSuccess(); onOpenChange(false); setSelectedBusinessId(''); } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Building className="h-5 w-5" />{t('admin.assignBusinessToNgo')}</DialogTitle>
          <DialogDescription>{t('admin.selectBusinessToAssign')}</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 grid gap-4 sm:gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="business">{t('admin.selectBusiness')}</Label>
            {isLoading ? <Skeleton className="h-12 w-full" /> : (
              <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                <SelectTrigger className="h-12 text-base"><SelectValue placeholder={t('admin.chooseBusiness')} /></SelectTrigger>
                <SelectContent>
                  {businesses.length === 0 ? <SelectItem value="none" disabled>{t('admin.noUnassignedBusinesses')}</SelectItem> : businesses.map((b) => <SelectItem key={b.id} value={b.id}>{b.business_name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="order-2 sm:order-1 h-12 text-base">{t('common.cancel')}</Button>
          <Button onClick={handleAssign} disabled={assignMutation.isPending || !selectedBusinessId} className="order-1 sm:order-2 min-w-[100px] h-12 text-base">{assignMutation.isPending ? t('admin.assigning') : t('admin.assign')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}