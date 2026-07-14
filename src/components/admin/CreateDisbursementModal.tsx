import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Wallet } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface CreateDisbursementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ngoId: string
  onSuccess: () => void
}

interface Business {
  id: string
  business_name: string
}

export function CreateDisbursementModal({ open, onOpenChange, ngoId, onSuccess }: CreateDisbursementModalProps) {
  const { t } = useLanguage()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    business_id: '', amount: '', disbursement_type: 'grant' as 'grant' | 'loan' | 'credit',
    purpose: '', disbursement_date: new Date().toISOString().split('T')[0],
    repayment_start_date: '', repayment_end_date: '', repayment_frequency: '', interest_rate: '', notes: '',
  })

  useEffect(() => {
    if (open && ngoId) fetchBusinesses()
  }, [open, ngoId])

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase.from('businesses').select('id, business_name').eq('ngo_id', ngoId).order('business_name')
      if (error) throw error
      setBusinesses(data || [])
    } catch (error) {
      console.error('Error fetching businesses:', error)
      toast({ variant: 'destructive', title: t("admin.error"), description: t("admin.failedFetchBusinesses") })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const disbursementData: any = {
        ngo_id: ngoId, business_id: formData.business_id, amount: parseFloat(formData.amount),
        disbursement_type: formData.disbursement_type, purpose: formData.purpose,
        disbursement_date: formData.disbursement_date, notes: formData.notes || null,
        created_by: user.id, status: 'pending',
      }
      if (formData.disbursement_type === 'loan') {
        disbursementData.repayment_start_date = formData.repayment_start_date || null
        disbursementData.repayment_end_date = formData.repayment_end_date || null
        disbursementData.repayment_frequency = formData.repayment_frequency || null
        disbursementData.interest_rate = formData.interest_rate ? parseFloat(formData.interest_rate) : 0
      }
      const { error } = await supabase.from('fund_disbursements').insert(disbursementData)
      if (error) throw error
      toast({ title: t("admin.success"), description: t("admin.disbursementCreatedSuccess") })
      onSuccess(); onOpenChange(false); resetForm()
    } catch (error) {
      console.error('Error creating disbursement:', error)
      toast({ variant: 'destructive', title: t("admin.error"), description: t("admin.failedCreateDisbursement") })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      business_id: '', amount: '', disbursement_type: 'grant', purpose: '',
      disbursement_date: new Date().toISOString().split('T')[0],
      repayment_start_date: '', repayment_end_date: '', repayment_frequency: '', interest_rate: '', notes: '',
    })
  }

  const isLoan = formData.disbursement_type === 'loan'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t("admin.createDisbursement")}
          </DialogTitle>
          <DialogDescription>{t("admin.createDisbursementDesc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 grid gap-4 sm:gap-6 py-4">
            <h3 className="text-base sm:text-lg font-semibold">{t("admin.disbursementDetails")}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="business">{t("admin.selectBusiness")}</Label>
              <Select value={formData.business_id} onValueChange={(value) => setFormData({ ...formData, business_id: value })} required>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder={t("admin.selectBusinessPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>{business.business_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t("admin.amountLabel")}</Label>
                <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="h-12 text-base" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">{t("admin.disbursementType")}</Label>
                <Select value={formData.disbursement_type} onValueChange={(value: any) => setFormData({ ...formData, disbursement_type: value })} required>
                  <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grant">{t("admin.grant")}</SelectItem>
                    <SelectItem value="loan">{t("admin.loan")}</SelectItem>
                    <SelectItem value="credit">{t("admin.creditType")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">{t("admin.purpose")}</Label>
              <Textarea id="purpose" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} required rows={3} className="text-base" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disbursement_date">{t("admin.disbursementDate")}</Label>
              <Input id="disbursement_date" type="date" value={formData.disbursement_date} onChange={(e) => setFormData({ ...formData, disbursement_date: e.target.value })} className="h-12 text-base" required />
            </div>

            {isLoan && (
              <>
                <h3 className="text-base sm:text-lg font-semibold">{t("admin.loanTerms")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="repayment_start">{t("admin.repaymentStartDate")}</Label>
                    <Input id="repayment_start" type="date" value={formData.repayment_start_date} onChange={(e) => setFormData({ ...formData, repayment_start_date: e.target.value })} className="h-12 text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repayment_end">{t("admin.repaymentEndDate")}</Label>
                    <Input id="repayment_end" type="date" value={formData.repayment_end_date} onChange={(e) => setFormData({ ...formData, repayment_end_date: e.target.value })} className="h-12 text-base" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">{t("admin.repaymentFrequency")}</Label>
                    <Select value={formData.repayment_frequency} onValueChange={(value) => setFormData({ ...formData, repayment_frequency: value })}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder={t("admin.selectFrequency")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">{t("admin.weekly")}</SelectItem>
                        <SelectItem value="monthly">{t("admin.monthly")}</SelectItem>
                        <SelectItem value="quarterly">{t("admin.quarterly")}</SelectItem>
                        <SelectItem value="annually">{t("admin.annually")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interest_rate">{t("admin.interestRate")}</Label>
                    <Input id="interest_rate" type="number" step="0.01" value={formData.interest_rate} onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })} className="h-12 text-base" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">{t("admin.notesOptional")}</Label>
              <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="text-base" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="order-2 sm:order-1 h-12 text-base">{t("common.cancel")}</Button>
            <Button type="submit" disabled={loading} className="order-1 sm:order-2 min-w-[100px] h-12 text-base">
              {loading ? t("admin.creating") : t("admin.createDisbursementBtn")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
