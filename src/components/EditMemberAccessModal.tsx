import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers'
import { useBranchContext } from '@/contexts/BranchContext'
import { useLanguage } from '@/contexts/LanguageContext'

interface EditMemberAccessModalProps {
  memberId: string
  onClose: () => void
}

const AVAILABLE_PAGES = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'customers', label: 'Customers' },
  { value: 'sales', label: 'Sales' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'credit', label: 'Credit' },
  { value: 'reports', label: 'Reports' }
]

export function EditMemberAccessModal({ memberId, onClose }: EditMemberAccessModalProps) {
  const { t } = useLanguage()
  const { members, updateMemberAccess, updateMemberBranch } = useOrganizationMembers()
  const { allBranches, hasBranches, branchesEnabled } = useBranchContext()
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const member = members.find(m => m.id === memberId)

  useEffect(() => {
    if (member) {
      setSelectedPages(member.accessible_pages)
      setSelectedBranchId(member.branch_id || null)
    }
  }, [member])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPages.length === 0) return

    setLoading(true)
    
    const pageAccessPromise = updateMemberAccess(memberId, selectedPages);
    
    let branchUpdatePromise = Promise.resolve();
    if (branchesEnabled && hasBranches && selectedBranchId !== member?.branch_id) {
        branchUpdatePromise = updateMemberBranch(memberId, selectedBranchId);
    }
    
    await Promise.all([pageAccessPromise, branchUpdatePromise]);

    setLoading(false)
    onClose()
  }

  const togglePage = (page: string) => {
    setSelectedPages(prev =>
      prev.includes(page)
        ? prev.filter(p => p !== page)
        : [...prev, page]
    )
  }

  const selectAll = () => {
    setSelectedPages(AVAILABLE_PAGES.map(p => p.value))
  }

  const deselectAll = () => {
    setSelectedPages([])
  }

  if (!member) return null

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('team.editMemberAccess')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              {t('team.editingAccessFor')}: <span className="font-medium">{member.email || member.display_name || `User ${member.user_id.slice(0, 8)}`}</span>
            </p>
          </div>

          {branchesEnabled && hasBranches && (
            <div>
              <Label htmlFor="branch">{t('branches.assignToBranch')}</Label>
              <Select value={selectedBranchId || 'hq'} onValueChange={(value) => setSelectedBranchId(value === 'hq' ? null : value)}>
                <SelectTrigger id="branch">
                  <SelectValue placeholder={t('branches.selectBranchOrHq')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hq">{t('branches.headquarters')} ({t('branches.allBranches')})</SelectItem>
                  {allBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.branch_name}
                      {branch.is_headquarters && ` (HQ)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>{t('team.pageAccess')}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                >
                  {t('modal.selectAll')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deselectAll}
                >
                  {t('modal.clear')}
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
              {AVAILABLE_PAGES.map((page) => (
                <div key={page.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${page.value}`}
                    checked={selectedPages.includes(page.value)}
                    onCheckedChange={() => togglePage(page.value)}
                  />
                  <label
                    htmlFor={`edit-${page.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {t(`nav.${page.value}` as any) || page.label}
                  </label>
                </div>
              ))}
            </div>
            {selectedPages.length === 0 && (
              <p className="text-sm text-destructive mt-2">
                {t('team.selectAtLeastOne')}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t('modal.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedPages.length === 0}
              className="flex-1"
            >
              {loading ? t('modal.saving') : t('team.saveChanges')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
