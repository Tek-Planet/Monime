import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/integrations/supabase/client'

interface BusinessInfo {
  business_name: string
  business_type: string
  currency: string
}

export function useBusinessInfo(businessId?: string) {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (businessId) {
        const { data, error } = await supabase
          .from('businesses')
          .select('business_name, business_type, currency')
          .eq('id', businessId)
          .single()

        if (data && !error) {
          setBusinessInfo({
            business_name: data.business_name,
            business_type: data.business_type || 'retail',
            currency: data.currency || 'SLL'
          })
          setLoading(false)
          return
        }
      }

      // Fallback to default
      setBusinessInfo({
        business_name: t('business.defaultname'),
        business_type: 'retail',
        currency: 'SLL'
      })
      setLoading(false)
    }

    fetchBusinessInfo()
  }, [t, businessId])

  return { businessInfo, loading }
}