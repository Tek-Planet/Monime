import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
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

export const adminActivityLogsKeys = {
  all: ['admin', 'activity-logs'] as const,
  list: (params: { limit?: number; ngoId?: string }) => 
    ['admin', 'activity-logs', params] as const,
}

async function fetchActivityLogs(limit: number, ngoId?: string): Promise<ActivityLog[]> {
  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (ngoId) {
    const { data: ngoBusinesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('ngo_id', ngoId)

    const businessIds = ngoBusinesses?.map(b => b.id) || []
    if (businessIds.length === 0) {
      return []
    }
    query = query.in('business_id', businessIds)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export function useAdminActivityLogs(limit = 50, ngoId?: string) {
  const queryClient = useQueryClient()
  const queryKey = adminActivityLogsKeys.list({ limit, ngoId })

  const query = useQuery({
    queryKey,
    queryFn: () => fetchActivityLogs(limit, ngoId),
  })

  // Subscribe to realtime updates
  useEffect(() => {
    const subscription = supabase
      .channel('activity_logs_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'activity_logs' }, 
        () => {
          queryClient.invalidateQueries({ queryKey })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient, queryKey])

  return query
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
