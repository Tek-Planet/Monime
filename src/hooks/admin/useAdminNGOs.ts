import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

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

export const adminNGOsKeys = {
  all: ['admin', 'ngos'] as const,
  detail: (ngoId: string) => ['admin', 'ngos', ngoId] as const,
  businesses: (ngoId: string) => ['admin', 'ngos', ngoId, 'businesses'] as const,
  businessCount: (ngoId: string) => ['admin', 'ngos', ngoId, 'businessCount'] as const,
}

async function fetchNGOs(): Promise<NGO[]> {
  const { data, error } = await supabase
    .from('ngos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

async function fetchNGO(ngoId: string): Promise<NGO> {
  const { data, error } = await supabase
    .from('ngos')
    .select('*')
    .eq('id', ngoId)
    .single()

  if (error) throw error
  return data
}

async function fetchNGOBusinesses(ngoId: string, limit?: number) {
  let query = supabase
    .from('businesses')
    .select('*')
    .eq('ngo_id', ngoId)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

async function fetchNGOBusinessCount(ngoId: string): Promise<number> {
  const { count, error } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('ngo_id', ngoId)

  if (error) throw error
  return count || 0
}

export function useAdminNGOs() {
  return useQuery({
    queryKey: adminNGOsKeys.all,
    queryFn: fetchNGOs,
  })
}

export function useAdminNGO(ngoId: string | undefined) {
  return useQuery({
    queryKey: adminNGOsKeys.detail(ngoId || ''),
    queryFn: () => fetchNGO(ngoId!),
    enabled: !!ngoId,
  })
}

export function useNGOBusinesses(ngoId: string | undefined, limit?: number) {
  return useQuery({
    queryKey: [...adminNGOsKeys.businesses(ngoId || ''), limit],
    queryFn: () => fetchNGOBusinesses(ngoId!, limit),
    enabled: !!ngoId,
  })
}

export function useNGOBusinessCount(ngoId: string | undefined) {
  return useQuery({
    queryKey: adminNGOsKeys.businessCount(ngoId || ''),
    queryFn: () => fetchNGOBusinessCount(ngoId!),
    enabled: !!ngoId,
  })
}

interface NGOBusinessesPaginatedFilters {
  ngoId: string
  search?: string
  typeFilter?: string
  page?: number
  pageSize?: number
}

interface NGOBusinessesPaginatedResult {
  businesses: {
    id: string
    business_name: string
    business_type: string | null
    email: string | null
    phone: string | null
    created_at: string
  }[]
  totalCount: number
}

async function fetchNGOBusinessesPaginated(filters: NGOBusinessesPaginatedFilters): Promise<NGOBusinessesPaginatedResult> {
  const { ngoId, search, typeFilter, page = 1, pageSize = 10 } = filters

  let query = supabase
    .from('businesses')
    .select('id, business_name, business_type, email, phone, created_at', { count: 'exact' })
    .eq('ngo_id', ngoId)

  if (search) {
    query = query.or(`business_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  if (typeFilter && typeFilter !== 'all') {
    query = query.eq('business_type', typeFilter)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false })

  if (error) throw error

  return {
    businesses: data || [],
    totalCount: count || 0,
  }
}

export function useNGOBusinessesPaginated(filters: NGOBusinessesPaginatedFilters) {
  return useQuery({
    queryKey: [...adminNGOsKeys.businesses(filters.ngoId), filters],
    queryFn: () => fetchNGOBusinessesPaginated(filters),
    enabled: !!filters.ngoId,
  })
}

export function useUnassignBusinessFromNGO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (businessId: string) => {
      const { error } = await supabase
        .from('businesses')
        .update({ ngo_id: null })
        .eq('id', businessId)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Business unassigned from NGO')
      queryClient.invalidateQueries({ queryKey: ['admin', 'ngos'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] })
    },
    onError: (error) => {
      console.error('Error unassigning business:', error)
      toast.error('Failed to unassign business')
    },
  })
}

interface CreateNGOData {
  name: string
  description: string
  contact_email: string
  contact_phone: string
  address: string
}

export function useCreateNGO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateNGOData) => {
      const { error } = await supabase.from('ngos').insert([data])
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('NGO created successfully')
      queryClient.invalidateQueries({ queryKey: adminNGOsKeys.all })
    },
    onError: (error) => {
      console.error('Error creating NGO:', error)
      toast.error('Failed to create NGO')
    },
  })
}

interface UpdateNGOData {
  id: string
  data: Partial<CreateNGOData & { is_active: boolean }>
}

export function useUpdateNGO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: UpdateNGOData) => {
      const { error } = await supabase.from('ngos').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      toast.success('NGO updated successfully')
      queryClient.invalidateQueries({ queryKey: adminNGOsKeys.all })
      queryClient.invalidateQueries({ queryKey: adminNGOsKeys.detail(variables.id) })
    },
    onError: (error) => {
      console.error('Error updating NGO:', error)
      toast.error('Failed to update NGO')
    },
  })
}
