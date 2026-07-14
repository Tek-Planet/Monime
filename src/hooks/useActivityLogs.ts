import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface ActivityLog {
  id: string
  user_id: string
  business_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export function useActivityLogs(limit = 50, ngoId?: string) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        let query = supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)

        // Filter by NGO's businesses if ngoId is provided
        if (ngoId) {
          const { data: ngoBusinesses } = await supabase
            .from('businesses')
            .select('id')
            .eq('ngo_id', ngoId)

          const businessIds = ngoBusinesses?.map(b => b.id) || []
          if (businessIds.length > 0) {
            query = query.in('business_id', businessIds)
          } else {
            // No businesses, return empty logs
            setLogs([])
            setLoading(false)
            return
          }
        }

        const { data, error } = await query

        if (error) throw error
        setLogs(data || [])
      } catch (error) {
        console.error('Error fetching activity logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()

    const subscription = supabase
      .channel('activity_logs_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'activity_logs' }, 
        () => {
          fetchLogs()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [limit, ngoId])

  return { logs, loading }
}

export async function logActivity(
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: any
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  try {
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    })
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}
