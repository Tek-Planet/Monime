import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface NGO {
  id: string
  name: string
  description: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useNGOs() {
  const [ngos, setNgos] = useState<NGO[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNGOs = async () => {
    try {
      const { data, error } = await supabase
        .from('ngos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNgos(data || [])
    } catch (error) {
      console.error('Error fetching NGOs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNGOs()
  }, [])

  return { ngos, loading, refetch: fetchNGOs }
}
