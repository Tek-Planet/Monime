import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Setup() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [adminExists, setAdminExists] = useState(false)

  useEffect(() => {
    checkAdminExists()
  }, [])

  const checkAdminExists = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .in('role', ['admin', 'system_admin'])
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        setAdminExists(true)
        // Redirect to home if admin already exists
        setTimeout(() => navigate('/'), 2000)
      }
    } catch (error) {
      console.error('Error checking admin:', error)
      toast.error(t('setup.checkAdminFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async () => {
    if (!user) {
      toast.error(t('setup.mustBeLoggedIn'))
      return
    }

    setCreating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error(t('setup.noActiveSession'))
        return
      }

      const response = await fetch(
        'https://lgstierfmiezdeqhwyap.supabase.co/functions/v1/create-first-admin',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t('setup.adminCreationFailed'))
      }

      toast.success(t('setup.adminCreated'))
      setTimeout(() => navigate('/admin'), 1500)
    } catch (error) {
      console.error('Error creating admin:', error)
      toast.error(error instanceof Error ? error.message : t('setup.adminCreationFailed'))
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (adminExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {t('setup.notAvailable')}
            </CardTitle>
            <CardDescription>
              {t('setup.redirecting')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center">{t('setup.title')}</CardTitle>
          <CardDescription className="text-center">
            {t('setup.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>{t('setup.important')}</strong> {t('setup.importantDesc')}
            </AlertDescription>
          </Alert>

          {user && (
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-1">{t('setup.creatingFor')}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          )}

          <Button 
            onClick={handleCreateAdmin} 
            disabled={creating || !user}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('setup.creating')}
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                {t('setup.becomeAdmin')}
              </>
            )}
          </Button>

          {!user && (
            <p className="text-sm text-center text-muted-foreground">
              {t('setup.pleaseSignIn')} <a href="/auth" className="text-primary hover:underline">{t('setup.signIn')}</a>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
