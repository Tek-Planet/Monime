import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { NGO } from '@/hooks/useNGOs'
import { Building } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface EditNGOModalProps {
  ngo: NGO
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditNGOModal({ ngo, open, onOpenChange, onSuccess }: EditNGOModalProps) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: ngo.name, description: ngo.description || '', contact_email: ngo.contact_email || '',
    contact_phone: ngo.contact_phone || '', address: ngo.address || '', is_active: ngo.is_active
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('ngos').update(formData).eq('id', ngo.id)
      if (error) throw error
      toast.success(t('admin.ngoUpdated'))
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating NGO:', error)
      toast.error(t('admin.failedToUpdateNgo'))
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Building className="h-5 w-5" />{t('admin.editNgoTitle')}</DialogTitle>
          <DialogDescription>{t('admin.updateNgoInfo')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 grid gap-4 sm:gap-6 py-4">
            <h3 className="text-base sm:text-lg font-semibold">{t('admin.ngoDetails')}</h3>
            <div className="space-y-2"><Label htmlFor="name">{t('admin.name')}</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-12 text-base" required /></div>
            <div className="space-y-2"><Label htmlFor="description">{t('admin.description')}</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="text-base" /></div>
            <h3 className="text-base sm:text-lg font-semibold">{t('admin.contactInformation')}</h3>
            <div className="space-y-2"><Label htmlFor="contact_email">{t('ngo.contactEmail')}</Label><Input id="contact_email" type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} className="h-12 text-base" /></div>
            <div className="space-y-2"><Label htmlFor="contact_phone">{t('ngo.contactPhone')}</Label><Input id="contact_phone" value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} className="h-12 text-base" /></div>
            <div className="space-y-2"><Label htmlFor="address">{t('admin.address')}</Label><Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-12 text-base" /></div>
            <div className="flex items-center space-x-2"><Checkbox id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })} /><Label htmlFor="is_active" className="text-base">{t('admin.active')}</Label></div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="order-2 sm:order-1 h-12 text-base">{t('common.cancel')}</Button>
            <Button type="submit" disabled={loading} className="order-1 sm:order-2 min-w-[100px] h-12 text-base">{loading ? t('admin.updating') : t('admin.updateNgo')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}