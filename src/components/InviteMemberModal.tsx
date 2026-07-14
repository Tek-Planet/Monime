import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers'
import { useBranchContext } from '@/contexts/BranchContext'
import { useLanguage } from '@/contexts/LanguageContext'

interface InviteMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInviteSent?: () => void
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

export function InviteMemberModal({ open, onOpenChange, onInviteSent }: InviteMemberModalProps) {
  const { t } = useLanguage()
  const { inviteMember } = useOrganizationMembers()
  const { allBranches, hasBranches, branchesEnabled } = useBranchContext()
  const [email, setEmail] = useState('')
  const [selectedPages, setSelectedPages] = useState<string[]>(['dashboard'])
  // FIX: Default to empty to force a selection
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Reset form state when modal is closed
  useEffect(() => {
    if (!open) {
      setEmail('')
      setSelectedPages(['dashboard'])
      setSelectedBranchId('')
      setLoading(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // FIX: Add validation for branch selection
    if (!email || selectedPages.length === 0 || (hasBranches && !selectedBranchId)) {
      return
    }

    setLoading(true)
    const branchId = selectedBranchId === 'hq' ? null : selectedBranchId
    console.log(branchId)
    await inviteMember(email, selectedPages, branchId)
    setLoading(false)
    
    onOpenChange(false)
    onInviteSent?.()
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('team.inviteMember')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t('team.emailAddress')} *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('team.emailPlaceholder')}
              required
            />
          </div>

          {branchesEnabled && hasBranches && (
            <div>
              <Label htmlFor="branch">{t('branches.assignToBranch')} *</Label>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger id="branch">
                  {/* FIX: Placeholder is now shown by default */}
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
              <p className="text-xs text-muted-foreground mt-1">
                {selectedBranchId === 'hq' 
                  ? t('branches.hqAccessDescription')
                  : selectedBranchId
                  ? t('branches.branchAccessDescription')
                  : t('branches.assignPrompt') // New translation key needed
                }
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>{t('team.pageAccess')} *</Label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={selectAll}>{t('modal.selectAll')}</Button>
                <Button type="button" variant="ghost" size="sm" onClick={deselectAll}>{t('modal.clear')}</Button>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
              {AVAILABLE_PAGES.map((page) => (
                <div key={page.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={page.value}
                    checked={selectedPages.includes(page.value)}
                    onCheckedChange={() => togglePage(page.value)}
                  />
                  <label htmlFor={page.value} className="text-sm font-medium leading-none cursor-pointer">{t(`nav.${page.value}` as any) || page.label}</label>
                </div>
              ))}
            </div>
            {selectedPages.length === 0 && (
              <p className="text-sm text-destructive mt-2">{t('team.selectAtLeastOne')}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">{t('modal.cancel')}</Button>
            <Button
              type="submit"
              // FIX: Button is disabled until a branch/hq is selected
              disabled={loading || !email || selectedPages.length === 0 || (hasBranches && !selectedBranchId)}
              className="flex-1"
            >
              {loading ? t('team.sending') : t('team.sendInvitation')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
