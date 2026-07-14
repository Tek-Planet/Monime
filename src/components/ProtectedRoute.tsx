import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useAdminType } from '@/hooks/admin/useAdminType'
import { Navigate, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { needsOnboarding, business, loading: profileLoading } = useUserProfile()
  const { adminType, loading: adminLoading } = useAdminType()
  const location = useLocation()

  // Wait for all data to load before making routing decisions
  if (authLoading || profileLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  const isInviteUserWithoutPassword =
    !!user.user_metadata?.business_id && user.user_metadata?.password_set !== true

  if (isInviteUserWithoutPassword && location.pathname !== '/auth') {
    return <Navigate to="/auth?type=invite" replace />
  }

  // Admins don't need to complete onboarding
  const isAdmin = adminType === 'system_admin' || adminType === 'ngo_admin'

  // Admins should never see the onboarding page - redirect to dashboard or admin
  if (isAdmin && location.pathname === '/onboarding') {
    return <Navigate to={business ? '/' : '/admin'} replace />
  }

  // Only redirect admins to admin panel if they don't have an associated business
  if (isAdmin && !business && location.pathname === '/') {
    return <Navigate to="/admin" replace />
  }

  // If user needs onboarding and they're not already on the onboarding page (non-admins only)
  if (!isAdmin && needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // If user completed onboarding but is still on onboarding page (non-admins only)
  if (!isAdmin && !needsOnboarding && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
