import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserDetailsForm } from '@/components/onboarding/UserDetailsForm'
import { BusinessDetailsForm } from '@/components/onboarding/BusinessDetailsForm'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, CheckCircle } from 'lucide-react'

type OnboardingStep = 'user-details' | 'business-details' | 'complete'

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('user-details')
  const [loading, setLoading] = useState(false)
  const [isInvitedMember, setIsInvitedMember] = useState(false)
  const [userDetails, setUserDetails] = useState<{
    firstName: string
    lastName: string
    phone: string
  } | null>(null)
  
  const { user } = useAuth()
  const { refetch } = useUserProfile()
  const { toast } = useToast()
  const { t } = useLanguage()
  const navigate = useNavigate()

  // Check if user is an invited member (not a business owner)
  useEffect(() => {
    const checkMembershipStatus = async () => {
      if (!user) return

      const { data: memberData } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (memberData) {
        setIsInvitedMember(true)
      }
    }

    checkMembershipStatus()
  }, [user])

  const steps = [
    { id: 'user-details', title: t("onboarding.step.personalInfo"), description: t("onboarding.step.personalInfoDesc") },
    { id: 'business-details', title: t("onboarding.step.businessInfo"), description: t("onboarding.step.businessInfoDesc") },
    { id: 'complete', title: t("onboarding.step.complete"), description: t("onboarding.step.completeDesc") }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const handleUserDetailsComplete = async (data: { firstName: string; lastName: string; phone: string }) => {
    setUserDetails(data)
    
    // If invited member, skip business details and save profile directly
    if (isInvitedMember) {
      if (!user) return
      
      setLoading(true)
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone
          }, {
            onConflict: 'user_id'
          })

        if (profileError) throw profileError

        // Refetch user profile
        await refetch()
        
        toast({
          title: t("onboarding.profileComplete"),
          description: t("onboarding.profileCompleteDesc")
        })

        window.dispatchEvent(new Event('user-data-updated'))
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 300)
      } catch (error: any) {
        toast({
          title: t("onboarding.setupFailed"),
          description: error.message || t("onboarding.setupFailedDesc"),
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    } else {
      setCurrentStep('business-details')
    }
  }

  const handleBusinessDetailsComplete = async (businessData: {
    businessName: string
    businessType: string
    address: string
    phone: string
    email: string
    currency: string
    latitude?: number
    longitude?: number
    referralCode?: string
  }) => {
    if (!user || !userDetails) return

    setLoading(true)
    
    try {
      // Save user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: userDetails.firstName,
          last_name: userDetails.lastName,
          phone: userDetails.phone
        }, {
          onConflict: 'user_id'
        })

      if (profileError) throw profileError

      // Save business details
      const { error: businessError } = await supabase
        .from('businesses')
        .upsert({
          owner_id: user.id,
          business_name: businessData.businessName,
          business_type: businessData.businessType,
          address: businessData.address,
          phone: businessData.phone,
          email: businessData.email,
          currency: businessData.currency,
          latitude: businessData.latitude,
          longitude: businessData.longitude
        }, {
          onConflict: 'owner_id'
        })

        if (businessError) throw businessError

        // Link referral code if provided (via SECURITY DEFINER RPC since marketers table is not readable by owners)
        if (businessData.referralCode) {
          const { data: biz } = await supabase
            .from('businesses')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle()

          if (biz) {
            const { data: linked, error: linkError } = await supabase.rpc('link_business_to_marketer', {
              _business_id: biz.id,
              _referral_code: businessData.referralCode,
            })
            if (linkError || !linked) {
              toast({
                title: t("onboarding.referralCodeInvalid") || "Invalid referral code",
                description: "We could not find an active marketer for that code. You can ask an admin to link it later.",
                variant: "destructive"
              })
            }
          }
        }

      // Refetch user profile to update onboarding status
      const refetchResult = await refetch()
      
      if (refetchResult && !refetchResult.needsOnboarding) {
        toast({
          title: t("onboarding.setupComplete"),
          description: t("onboarding.setupCompleteDesc")
        })

        // Invalidate profile cache across the app, then redirect
        window.dispatchEvent(new Event('user-data-updated'))
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 300)
      } else {
        throw new Error("Failed to complete onboarding setup")
      }

    } catch (error: any) {
      toast({
        title: t("onboarding.setupFailed"),
        description: error.message || t("onboarding.setupFailedDesc"),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep === 'business-details') {
      setCurrentStep('user-details')
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'user-details':
        return (
          <UserDetailsForm
            onComplete={handleUserDetailsComplete}
            loading={loading}
          />
        )
      case 'business-details':
        return (
          <BusinessDetailsForm
            onComplete={handleBusinessDetailsComplete}
            loading={loading}
          />
        )
      case 'complete':
        return (
          <div className="text-center space-y-6 max-w-lg mx-auto">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-16 w-16 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{t("onboarding.completeTitle")}</h2>
              <p className="text-muted-foreground">
                {t("onboarding.completeDesc")}
              </p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("onboarding.title")}</h1>
            {currentStep === 'business-details' && (
              <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t("onboarding.back")}</span>
                <span className="sm:hidden">{t("onboarding.back")}</span>
              </Button>
            )}
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
              <span>{t("onboarding.step")} {currentStepIndex + 1} {t("onboarding.of")} {steps.length}</span>
              <span>{Math.round(progress)}% {t("onboarding.complete")}</span>
            </div>
            <Progress value={progress} className="h-1.5 sm:h-2" />
          </div>

          {/* Steps */}
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 text-center ${
                  index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center text-xs sm:text-sm font-semibold ${
                  index < currentStepIndex ? 'bg-primary text-primary-foreground' :
                  index === currentStepIndex ? 'bg-primary/20 text-primary border-2 border-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index < currentStepIndex ? '✓' : index + 1}
                </div>
                <div className="text-[10px] sm:text-xs font-medium hidden sm:block">{step.title}</div>
                <div className="text-[10px] font-medium sm:hidden">{step.title.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}