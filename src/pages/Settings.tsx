import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Settings, User, Bell, Shield, Database, Palette, Globe, Camera, Key, Download, Upload, Trash2, Save, Edit, Eye, EyeOff, Users, HelpCircle, FileText, Building2, MapPin } from 'lucide-react'
import { DocumentUpload } from '@/components/DocumentUpload'
import { ProfilePhotoUpload } from '@/components/ProfilePhotoUpload'
import { TeamManagement } from '@/components/TeamManagement'
import { BranchManagement } from '@/components/settings/BranchManagement'
import { PinSettings } from '@/components/settings/PinSettings'
import { LocationPicker } from '@/components/maps/LocationPicker'
import { useState, useEffect } from 'react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useBusinessInfo } from '@/hooks/useBusinessInfo'
import { useAuth } from '@/contexts/AuthContext'
import { usePageAccess } from '@/hooks/usePageAccess'
import { useLanguage, type Language } from '@/contexts/LanguageContext'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { useQueryClient } from '@tanstack/react-query'

const SettingsPage = () => {
  const { t, locale, language: contextLanguage, setLanguage: setContextLanguage } = useLanguage()
  const { user, signOut } = useAuth()
  const { profile, business, loading, profilePhotoUrl: hookPhotoUrl, profilePhotoFilePath: hookPhotoFilePath } = useUserProfile()
  const { isOwner } = usePageAccess()
  const { theme: currentTheme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEnablingBranches, setIsEnablingBranches] = useState(false)
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null)
  
  // Check if branches are enabled for this business
  const branchesEnabled = (business as any)?.branches_enabled ?? false

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  })

  // Business form state
  const [businessForm, setBusinessForm] = useState({
    business_name: '',
    business_type: '',
    address: '',
    phone: '',
    email: '',
    currency: 'SLL',
    tax_rate: 0,
    latitude: null as number | null,
    longitude: null as number | null
  })

  // Security form state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    lowStock: true,
    newOrders: true,
    payments: true,
    weeklyReports: false,
    monthlyReports: true
  })

  // App preferences
  const [preferences, setPreferences] = useState<{
    theme: string
    language: Language
    dateFormat: string
    timeFormat: string
    currency: string
    autoBackup: boolean
    compactView: boolean
  }>({
    theme: currentTheme || 'system',
    language: contextLanguage,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'SLL',
    autoBackup: true,
    compactView: false
  })

  // Sync language and theme preference with context
  useEffect(() => {
    setPreferences(prev => ({ 
      ...prev, 
      language: contextLanguage,
      theme: currentTheme || 'system'
    }))
  }, [contextLanguage, currentTheme])

  // Load data when component mounts
  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || ''
      })
    }
  }, [profile])

  // Use centralized photo from hook, but allow local override for immediate feedback
  const profilePhotoUrl = localPhotoUrl ?? hookPhotoUrl
  const profilePhotoFilePath = hookPhotoFilePath

  useEffect(() => {
    if (business) {
      setBusinessForm({
        business_name: business.business_name || '',
        business_type: business.business_type || '',
        address: business.address || '',
        phone: business.phone || '',
        email: business.email || '',
        currency: business.currency || 'SLL',
        tax_rate: Number((business as any).tax_rate) || 0,
        latitude: (business as any).latitude || null,
        longitude: (business as any).longitude || null
      })
    }
  }, [business])

  // Handle Flutterwave payment redirect verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sub = params.get('subscription')
    const status = params.get('status')
    const transaction_id = params.get('transaction_id')
    const tx_ref = params.get('tx_ref')

    if (sub === 'verify' && transaction_id && status !== 'cancelled') {
      ;(async () => {
        try {
          const { data, error } = await supabase.functions.invoke('verify-flutterwave-payment', {
            body: { transaction_id, tx_ref },
          })
          if (error) throw error
          if (data?.success) {
            toast.success('Subscription activated successfully')
            queryClient.invalidateQueries({ queryKey: ['subscription'] })
          } else {
            toast.error(data?.error || 'Payment verification failed')
          }
        } catch (err: any) {
          toast.error(err.message || 'Payment verification failed')
        } finally {
          window.history.replaceState({}, '', window.location.pathname)
        }
      })()
    } else if (sub === 'verify' && status === 'cancelled') {
      toast.error('Payment was cancelled')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [queryClient])


  // Save profile function
  const handleSaveProfile = async () => {
    if (!profile) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileForm)
        .eq('user_id', user?.id)

      if (error) throw error
      toast.success(t("settings.profileUpdated"))
      // Dispatch event to refresh profile data across the app (e.g., dismiss completion banner)
      window.dispatchEvent(new CustomEvent('user-data-updated'))
    } catch (error) {
      toast.error(t("settings.failedToUpdateProfile"))
    } finally {
      setIsSaving(false)
    }
  }

  // Save business function
  const handleSaveBusiness = async () => {
    setIsSaving(true)
    try {
      if (business) {
        // Only allow updates if user is the owner
        if (business.owner_id !== user?.id) {
          toast.error(t("settings.onlyOwnersCanUpdate"))
          setIsSaving(false)
          return
        }
        
        const { error } = await supabase
          .from('businesses')
          .update(businessForm)
          .eq('id', business.id)

        if (error) throw error
      } else {
        // Check if user is a member - if so, they shouldn't create a business
        const { data: membership } = await supabase
          .from('organization_members')
          .select('id')
          .eq('user_id', user?.id)
          .eq('is_active', true)
          .maybeSingle()
        
        if (membership) {
          toast.error(t("settings.teamMemberCantCreate"))
          setIsSaving(false)
          return
        }
        
        // Create new business if none exists (only for non-members)
        const { error } = await supabase
          .from('businesses')
          .insert([{
            ...businessForm,
            owner_id: user?.id
          }])

        if (error) throw error
      }

      toast.success(t("settings.businessUpdated"))
    } catch (error) {
      toast.error(t("settings.failedToUpdateBusiness"))
    } finally {
      setIsSaving(false)
    }
  }

  // Enable branches function - creates default HQ branch and migrates existing data
  const handleEnableBranches = async () => {
    if (!business || !isOwner) return
    
    setIsEnablingBranches(true)
    try {
      // Step 1: Create default headquarters branch from business info
      const { data: newBranch, error: branchError } = await supabase
        .from('branches')
        .insert([{
          business_id: business.id,
          branch_name: business.business_name || 'Headquarters',
          address: business.address || null,
          phone: business.phone || null,
          email: business.email || null,
          is_headquarters: true,
          is_active: true
        }])
        .select()
        .single()

      if (branchError) throw branchError

      const hqBranchId = newBranch.id

      // Step 2: Migrate existing data (with null branch_id) to the new HQ branch
      // Update all tables that have branch_id column
      // Note: invoice_items are migrated via the invoices table relationship
      const migrationPromises = [
        supabase.from('sales').update({ branch_id: hqBranchId }).eq('business_id', business.id).is('branch_id', null),
        supabase.from('sale_items').update({ branch_id: hqBranchId }).eq('business_id', business.id).is('branch_id', null),
        supabase.from('expenses').update({ branch_id: hqBranchId }).eq('business_id', business.id).is('branch_id', null),
        supabase.from('customers').update({ branch_id: hqBranchId }).eq('business_id', business.id).is('branch_id', null),
        supabase.from('suppliers').update({ branch_id: hqBranchId }).eq('business_id', business.id).is('branch_id', null),
        supabase.from('inventory').update({ branch_id: hqBranchId }).eq('business_id', business.id).is('branch_id', null),
        supabase.from('invoices').update({ branch_id: hqBranchId }).eq('business_id', business.id).is('branch_id', null),
        supabase.from('credit_transactions').update({ branch_id: hqBranchId }).eq('business_id', business.id).is('branch_id', null),
      ]

      // Execute migrations - some may fail due to RLS but we continue
      const results = await Promise.allSettled(migrationPromises)
      const failures = results.filter(r => r.status === 'rejected')
      if (failures.length > 0) {
        console.warn('Some data migrations failed:', failures)
      }

      // Step 3: Enable branches on the business
      const { error: enableError } = await supabase
        .from('businesses')
        .update({ branches_enabled: true })
        .eq('id', business.id)

      if (enableError) throw enableError

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      
      toast.success(t("branches.enabledSuccess"))
    } catch (error) {
      console.error('Error enabling branches:', error)
      toast.error(t("branches.enabledError"))
    } finally {
      setIsEnablingBranches(false)
    }
  }

  // Change password function
  const handleChangePassword = async () => {
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error(t("settings.passwordMismatch"))
      return
    }

    if (securityForm.newPassword.length < 6) {
      toast.error(t("settings.passwordTooShort"))
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: securityForm.newPassword
      })

      if (error) throw error

      toast.success(t("settings.passwordUpdated"))
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error(t("settings.failedToUpdatePassword"))
    } finally {
      setIsSaving(false)
    }
  }

  // Export data function
  const handleExportData = async () => {
    try {
      // This would typically call an API endpoint to generate and download data
      toast.success(t("settings.dataExportSent"))
    } catch (error) {
      toast.error(t("settings.failedToExportData"))
    }
  }

  // Delete account function
  const handleDeleteAccount = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      // Call the delete-user edge function to delete the user from auth.users
      // This will cascade and automatically delete all related data
      const { data, error } = await supabase.functions.invoke('delete-user')

      if (error) {
        console.error('Error deleting account:', error)
        toast.error(t("settings.failedToDeleteAccount"))
        return
      }

      // Sign out the user
      await signOut()
      
      toast.success(t("settings.accountDeleted"))
    } catch (error) {
      toast.error(t("settings.failedToDeleteAccount"))
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm">{t("settings.loadingSettings")}</p>
      </div>
    )
  }

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className={`inline-grid ${isOwner && branchesEnabled ? 'grid-cols-8' : isOwner ? 'grid-cols-7' : 'grid-cols-6'} min-w-full sm:min-w-0`}>
            <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t("settings.profile")}</span>
              <span className="sm:hidden">{t("settings.profile").substring(0, 4)}</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t("settings.business")}</span>
              <span className="sm:hidden">{t("settings.business").substring(0, 3)}</span>
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="team" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                {t("settings.team")}
              </TabsTrigger>
            )}
            {/* Only show Branches tab when branches feature is enabled */}
            {isOwner && branchesEnabled && (
              <TabsTrigger value="branches" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t("branches.management")}</span>
                <span className="sm:hidden">Branch</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="security" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t("settings.security")}</span>
              <span className="sm:hidden">{t("settings.security").substring(0, 3)}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t("settings.notifications")}</span>
              <span className="sm:hidden">{t("settings.notifications").substring(0, 5)}</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t("settings.preferences")}</span>
              <span className="sm:hidden">{t("settings.preferences").substring(0, 4)}</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Database className="h-3 w-3 sm:h-4 sm:w-4" />
              {t("settings.data")}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Tab */}
       <TabsContent value="profile">
  <div className="space-y-6">
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <User className="h-5 w-5" />
          {t("settings.profileInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture */}
        <ProfilePhotoUpload
          currentPhotoUrl={profilePhotoUrl ?? undefined}
          currentFilePath={profilePhotoFilePath}
          userInitials={getUserInitials()}
          onPhotoUpdate={setLocalPhotoUrl}
        />

        <Separator />

        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">{t("settings.firstName")}</Label>
            <Input
              id="firstName"
              value={profileForm.first_name}
              onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
              placeholder={t("settings.enterFirstName")}
            />
          </div>
          <div>
            <Label htmlFor="lastName">{t("settings.lastName")}</Label>
            <Input
              id="lastName"
              value={profileForm.last_name}
              onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
              placeholder={t("settings.enterLastName")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">{t("settings.emailAddress")}</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("settings.contactSupport")}
            </p>
          </div>
          <div>
            <Label htmlFor="phone">{t("settings.phoneNumber")}</Label>
            <Input
              id="phone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder={t("settings.enterPhone")}
            />
          </div>
        </div>

        <div className="flex">
          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {isSaving ? t("settings.saving") : t("settings.saveChanges")}
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Profile Documents Upload */}
    <DocumentUpload
      type="profile"
      title={t("settings.identityVerification")}
      description={t("settings.uploadIdentity")}
      documentTypes={[
        { value: 'selfie', label: t("settings.document.selfie") },
        { value: 'national_id', label: t("settings.document.nationalId") },
        { value: 'passport', label: t("settings.document.passport") },
        { value: 'drivers_license', label: t("settings.document.driversLicense") },
        { value: 'voter_id', label: t("settings.document.voterId") },
        { value: 'other_id', label: t("settings.document.other") }
      ]}
      maxFiles={5}
    />
  </div>
</TabsContent>

        {/* Business Tab */}
        <TabsContent value="business">
          <div className="space-y-6">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Settings className="h-5 w-5" />
                  {t("settings.businessInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">{t("settings.businessName")}</Label>
                    <Input
                      id="businessName"
                      value={businessForm.business_name}
                      onChange={(e) => setBusinessForm({ ...businessForm, business_name: e.target.value })}
                      placeholder={t("settings.enterBusinessName")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessType">{t("settings.businessType")}</Label>
                    <Select
                      value={businessForm.business_type}
                      onValueChange={(value) => setBusinessForm({ ...businessForm, business_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("settings.selectBusinessType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supermarket">{t("settings.supermarket")}</SelectItem>
                        <SelectItem value="convenience_store">{t("settings.convenienceStore")}</SelectItem>
                        <SelectItem value="grocery_store">{t("settings.groceryStore")}</SelectItem>
                        <SelectItem value="provision_shop">{t("settings.provisionShop")}</SelectItem>
                        <SelectItem value="mini_mart">{t("settings.miniMart")}</SelectItem>
                        <SelectItem value="retail">{t("settings.generalRetail")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="businessAddress">{t("settings.businessAddress")}</Label>
                  <Textarea
                    id="businessAddress"
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                    placeholder={t("settings.enterBusinessAddress")}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessPhone">{t("settings.businessPhone")}</Label>
                    <Input
                      id="businessPhone"
                      value={businessForm.phone}
                      onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                      placeholder={t("settings.enterBusinessPhone")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessEmail">{t("settings.businessEmail")}</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={businessForm.email}
                      onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                      placeholder={t("settings.enterBusinessEmail")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">{t("settings.currency")}</Label>
                    <Select
                      value={businessForm.currency}
                      onValueChange={(value) => setBusinessForm({ ...businessForm, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SLL">{t("settings.sll")}</SelectItem>
                        <SelectItem value="USD">{t("settings.usd")}</SelectItem>
                        <SelectItem value="EUR">{t("settings.eur")}</SelectItem>
                        <SelectItem value="GBP">{t("settings.gbp")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="taxRate">{t("settings.taxRate")}</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={businessForm.tax_rate}
                      onChange={(e) => setBusinessForm({ ...businessForm, tax_rate: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleSaveBusiness} 
                    disabled={isSaving}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? t("settings.saving") : t("settings.saveChanges")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Business Documents Upload */}
            <DocumentUpload
              type="business"
              title={t("settings.businessDocuments")}
              description={t("settings.businessDocsDesc")}
              documentTypes={[
                { value: 'certificate_of_registration', label: t("settings.document.certRegistration") },
                { value: 'certificate_of_incorporation', label: t("settings.document.certIncorporation") },
                { value: 'city_registration', label: t("settings.document.cityRegistration") },
                { value: 'nra_tax_registration', label: t("settings.document.nraTaxRegistration") },
                { value: 'nra_tax_clearance', label: t("settings.document.nraTaxClearance") },
                { value: 'nassit_clearance_certificate', label: t("settings.document.nassitClearance") },
                { value: 'business_license', label: t("settings.document.businessLicense") },
                { value: 'gst_certificate', label: t("settings.document.gstCertificate") },
                { value: 'other', label: t("settings.document.otherBusiness") }
              ]}
              maxFiles={10}
            />

            {/* Business Location Map */}
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MapPin className="h-5 w-5" />
                  {t("location.businessLocation")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("location.businessLocationDesc")}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <LocationPicker
                  latitude={businessForm.latitude}
                  longitude={businessForm.longitude}
                  onLocationChange={(lat, lng) => {
                    setBusinessForm({ ...businessForm, latitude: lat, longitude: lng })
                  }}
                />
                {(businessForm.latitude || businessForm.longitude) && (
                  <Button
                    onClick={handleSaveBusiness}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? t("settings.saving") : t("settings.saveChanges")}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Enable Multi-Branch Feature Card - Only show for owners */}
            {isOwner && (
              <Card className="professional-card">
                <CardHeader>
                   <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Building2 className="h-5 w-5" />
                    {t("branches.multiBranch")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t("branches.multiBranchDesc")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {branchesEnabled ? (
                    <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                      <Badge variant="default" className="bg-primary">
                        {t("common.enabled")}
                      </Badge>
                      <span className="text-sm">
                        {t("branches.enabledMessage")}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-muted rounded-lg space-y-3">
                        <p className="text-sm">
                          {t("branches.enableDescription")}
                        </p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                          <li>{t("branches.enableBenefit1")}</li>
                          <li>{t("branches.enableBenefit2")}</li>
                          <li>{t("branches.enableBenefit3")}</li>
                        </ul>
                      </div>
                      <Button 
                        onClick={handleEnableBranches}
                        disabled={isEnablingBranches}
                        className="w-full sm:w-auto"
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        {isEnablingBranches ? t("common.enabling") : t("branches.enableBranches")}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Business Location Photo */}
            <DocumentUpload
              type="business"
              title={t("settings.businessLocationPhoto")}
              description={t("settings.businessLocationDesc")}
              documentTypes={[
                { value: 'storefront_photo', label: t("settings.document.storefrontPhoto") },
                { value: 'interior_photo', label: t("settings.document.interiorPhoto") },
                { value: 'signage_photo', label: t("settings.document.signagePhoto") },
                { value: 'location_photo', label: t("settings.document.locationPhoto") }
              ]}
              maxFiles={5}
            />
          </div>
        </TabsContent>

        {/* Team Tab */}
        {isOwner && (
          <TabsContent value="team">
            <TeamManagement />
          </TabsContent>
        )}

        {/* Branches Tab - Only show when branches feature is enabled */}
        {isOwner && branchesEnabled && (
          <TabsContent value="branches">
            <BranchManagement />
          </TabsContent>
        )}

        {/* Security Tab */}
       <TabsContent value="security">
  <div className="space-y-6">
    {/* PIN Lock Settings */}
    <PinSettings />
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Key className="h-5 w-5" />
          {t("settings.changePassword")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="currentPassword">{t("settings.currentPassword")}</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showPassword ? "text" : "password"}
              value={securityForm.currentPassword}
              onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
              placeholder={t("settings.enterCurrentPassword")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="newPassword">{t("settings.newPassword")}</Label>
          <Input
            id="newPassword"
            type="password"
            value={securityForm.newPassword}
            onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
            placeholder={t("settings.enterNewPassword")}
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">{t("settings.confirmNewPassword")}</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={securityForm.confirmPassword}
            onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
            placeholder={t("settings.confirmNewPasswordPlaceholder")}
          />
        </div>

        <Button
          onClick={handleChangePassword}
          disabled={isSaving || !securityForm.newPassword}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {isSaving ? t("settings.updating") : t("settings.updatePassword")}
        </Button>
      </CardContent>
    </Card>

    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Shield className="h-5 w-5" />
          {t("settings.accountSecurity")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Label>{t("settings.twoFactor")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.addExtraLayer")}</p>
          </div>
          <Badge variant="outline">{t("common.comingSoon")}</Badge>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Label>{t("settings.loginHistory")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.viewRecentLogin")}</p>
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
            {t("settings.viewHistory")}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</TabsContent>


        {/* Notifications Tab */}
      <TabsContent value="notifications">
  <Card className="professional-card">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
        <Bell className="h-5 w-5" />
        {t("settings.notificationPreferences")}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full">
            <Label htmlFor="email-notifications" className="cursor-pointer">{t("settings.emailNotifications")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.receiveViaEmail")}</p>
          </div>
          <Switch
            id="email-notifications"
            checked={notifications.email}
            onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
          />
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full">
            <Label htmlFor="sms-notifications" className="cursor-pointer">{t("settings.smsNotifications")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.receiveViaSms")}</p>
          </div>
          <Switch
            id="sms-notifications"
            checked={notifications.sms}
            onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
          />
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full">
            <Label htmlFor="low-stock" className="cursor-pointer">{t("settings.lowStockAlerts")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.notifyWhenLowStock")}</p>
          </div>
          <Switch
            id="low-stock"
            checked={notifications.lowStock}
            onCheckedChange={(checked) => setNotifications({ ...notifications, lowStock: checked })}
          />
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full">
            <Label htmlFor="new-orders" className="cursor-pointer">{t("settings.newOrderAlerts")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.notifyNewOrders")}</p>
          </div>
          <Switch
            id="new-orders"
            checked={notifications.newOrders}
            onCheckedChange={(checked) => setNotifications({ ...notifications, newOrders: checked })}
          />
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full">
            <Label htmlFor="payments" className="cursor-pointer">{t("settings.paymentAlerts")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.notifyPayments")}</p>
          </div>
          <Switch
            id="payments"
            checked={notifications.payments}
            onCheckedChange={(checked) => setNotifications({ ...notifications, payments: checked })}
          />
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full">
            <Label htmlFor="weekly-reports" className="cursor-pointer">{t("settings.weeklyReports")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.receiveWeeklySummary")}</p>
          </div>
          <Switch
            id="weekly-reports"
            checked={notifications.weeklyReports}
            onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
          />
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full">
            <Label htmlFor="monthly-reports" className="cursor-pointer">{t("settings.monthlyReports")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.receiveMonthlyAnalytics")}</p>
          </div>
          <Switch
            id="monthly-reports"
            checked={notifications.monthlyReports}
            onCheckedChange={(checked) => setNotifications({ ...notifications, monthlyReports: checked })}
          />
        </div>
      </div>

      <Button className="flex items-center gap-2 w-full sm:w-auto">
        <Save className="h-4 w-4" />
        {t("settings.saveNotificationPrefs")}
      </Button>
    </CardContent>
  </Card>
</TabsContent>


        {/* Preferences Tab */}
       <TabsContent value="preferences">
  <Card className="professional-card">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
        <Palette className="h-5 w-5" />
        {t("settings.appPreferences")}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="theme">{t("settings.theme")}</Label>
          <Select
            value={preferences.theme}
            onValueChange={(value) => {
              setPreferences({ ...preferences, theme: value })
              setTheme(value)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("settings.light")}</SelectItem>
              <SelectItem value="dark">{t("settings.dark")}</SelectItem>
              <SelectItem value="system">{t("settings.system")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="language">{t("settings.language")}</Label>
          <Select
            value={preferences.language}
            onValueChange={(value) => {
              const lang = value as Language
              setPreferences({ ...preferences, language: lang })
              setContextLanguage(lang)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("language.english")}</SelectItem>
              <SelectItem value="krio">{t("language.krio")}</SelectItem>
              <SelectItem value="fr">{t("language.french")}</SelectItem>
              <SelectItem value="ar">{t("language.arabic")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dateFormat">{t("settings.dateFormat")}</Label>
          <Select
            value={preferences.dateFormat}
            onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="timeFormat">{t("settings.timeFormat")}</Label>
          <Select
            value={preferences.timeFormat}
            onValueChange={(value) => setPreferences({ ...preferences, timeFormat: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12h">{t("settings.12hour")}</SelectItem>
              <SelectItem value="24h">{t("settings.24hour")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Label htmlFor="auto-backup" className="cursor-pointer">{t("settings.autoBackup")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.autoBackupDesc")}</p>
          </div>
          <Switch
            id="auto-backup"
            checked={preferences.autoBackup}
            onCheckedChange={(checked) => setPreferences({ ...preferences, autoBackup: checked })}
          />
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Label htmlFor="compact-view" className="cursor-pointer">{t("settings.compactView")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.compactViewDesc")}</p>
          </div>
          <Switch
            id="compact-view"
            checked={preferences.compactView}
            onCheckedChange={(checked) => setPreferences({ ...preferences, compactView: checked })}
          />
        </div>
      </div>

      <Button className="flex items-center gap-2 w-full sm:w-auto">
        <Save className="h-4 w-4" />
        {t("settings.savePreferences")}
      </Button>
    </CardContent>
  </Card>
</TabsContent>


        {/* Data Tab */}
        <TabsContent value="data">
  <div className="space-y-6">
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Database className="h-5 w-5" />
          {t("settings.dataManagement")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Label>{t("settings.exportData")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.exportDataDesc")}</p>
          </div>
          <Button variant="outline" onClick={handleExportData} className="w-full sm:w-auto shrink-0">
            <Download className="h-4 w-4 mr-2" />
            {t("settings.exportData")}
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Label>{t("settings.dataBackup")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("settings.lastBackup")}: {preferences.autoBackup ? t("settings.todayAt230") : t("settings.manualBackupRequired")}
            </p>
          </div>
          <Button variant="outline" className="w-full sm:w-auto shrink-0">
            <Upload className="h-4 w-4 mr-2" />
            {t("settings.createBackup")}
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Help & Legal Section */}
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <HelpCircle className="h-5 w-5" />
          {t("settings.helpAndLegal")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Label>{t("settings.privacyPolicy")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.learnDataProtection")}</p>
          </div>
          <Button variant="outline" asChild className="w-full sm:w-auto shrink-0">
            <Link to="/privacy">
              <FileText className="h-4 w-4 mr-2" />
              {t("settings.viewPrivacyPolicy")}
            </Link>
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Label>{t("settings.getHelp")}</Label>
            <p className="text-sm text-muted-foreground">{t("settings.contactSupportOrFaq")}</p>
          </div>
          <Button variant="outline" asChild className="w-full sm:w-auto shrink-0">
            <Link to="/support">
              <HelpCircle className="h-4 w-4 mr-2" />
              {t("settings.supportCenter")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card className="professional-card border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive text-base sm:text-lg">
          <Trash2 className="h-5 w-5" />
          {t("settings.dangerZone")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Label>{t("settings.deleteAccount")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("settings.deleteAccountDesc")}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
               <Button variant="destructive" disabled={isSaving} className="w-full sm:w-auto shrink-0">
                 <Trash2 className="h-4 w-4 mr-2" />
                 {isSaving ? t("settings.deleting") : t("settings.deleteAccount")}
               </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("settings.areYouSure")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("settings.deleteAccountWarning")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("settings.yesDeleteAccount")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  </div>
</TabsContent>

      </Tabs>
    </div>
  );
};

export default SettingsPage;