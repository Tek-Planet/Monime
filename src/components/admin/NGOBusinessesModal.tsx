import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Building, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Business {
  id: string
  business_name: string
  business_type: string | null
  email: string | null
  phone: string | null
  created_at: string
}

interface NGOBusinessesModalProps {
  ngoId: string
  ngoName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NGOBusinessesModal({ ngoId, ngoName, open, onOpenChange }: NGOBusinessesModalProps) {
  const { t } = useLanguage()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) fetchBusinesses()
  }, [open, ngoId])

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase.from('businesses').select('*').eq('ngo_id', ngoId).order('created_at', { ascending: false })
      if (error) throw error
      setBusinesses(data || [])
    } catch (error) {
      console.error('Error fetching businesses:', error)
      toast.error(t("admin.failedLoadBusinesses"))
    } finally {
      setLoading(false)
    }
  }

  const handleUnassign = async (businessId: string) => {
    try {
      const { error } = await supabase.from('businesses').update({ ngo_id: null }).eq('id', businessId)
      if (error) throw error
      toast.success(t("admin.businessUnassigned"))
      fetchBusinesses()
    } catch (error) {
      console.error('Error unassigning business:', error)
      toast.error(t("admin.failedUnassignBusiness"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-w-[90vw] max-h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {t("admin.businesses")} - {ngoName}
          </DialogTitle>
          <DialogDescription>{t("admin.viewManageBusinesses")}</DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 py-4">
          {loading ? (
            <p className="text-muted-foreground">{t("admin.loadingBusinesses")}</p>
          ) : businesses.length === 0 ? (
            <p className="text-muted-foreground">{t("admin.noBusinessesAssigned")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("common.type")}</TableHead>
                  <TableHead>{t("admin.contact")}</TableHead>
                  <TableHead>{t("admin.joined")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell className="font-medium">{business.business_name}</TableCell>
                    <TableCell>
                      {business.business_type ? <Badge variant="outline">{business.business_type}</Badge> : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {business.email && <div>{business.email}</div>}
                        {business.phone && <div>{business.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(business.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleUnassign(business.id)} className="h-10 w-10 p-0">
                        <X className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-12 text-base min-w-[100px]">{t("common.close")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
