import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  Building2, 
  Utensils, 
  Store, 
  Briefcase, 
  Check, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  ShoppingBag,
  TrendingUp,
  Package,
  FileText,
  Users,
  Clock,
  Receipt,
  CreditCard,
  BarChart3,
  Truck,
  CheckCircle2
} from 'lucide-react'
import { LocationPicker } from '@/components/maps/LocationPicker'
import { 
  BUSINESS_TYPES, 
  BusinessArchetype, 
  getBusinessArchetype, 
  ARCHETYPE_CONFIGS,
  getArchetypeConfig,
  getQuickAccessModules,
  isProfessionalServices
} from '@/lib/businessArchetypes'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  TrendingUp,
  Users,
  Briefcase,
  Clock,
  Receipt,
  CreditCard,
  BarChart3,
  Utensils,
  Package,
  Truck,
}

interface BusinessDetailsFormProps {
  onComplete: (data: {
    businessName: string
    businessType: string
    address: string
    phone: string
    email: string
    currency: string
    latitude?: number
    longitude?: number
    referralCode?: string
  }) => void
  loading?: boolean
  onProgressUpdate?: (percent: number) => void
}

export function BusinessDetailsForm({ onComplete, loading = false, onProgressUpdate }: BusinessDetailsFormProps) {
  const [activeTab, setActiveTab] = useState<'category' | 'details'>('category')
  const [selectedArchetype, setSelectedArchetype] = useState<BusinessArchetype>('retail')
  const [businessType, setBusinessType] = useState('provision_store')
  const [businessName, setBusinessName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [currency, setCurrency] = useState('SLL')
  const [latitude, setLatitude] = useState<number | undefined>()
  const [longitude, setLongitude] = useState<number | undefined>()
  const [referralCode, setReferralCode] = useState('')
  const { toast } = useToast()

  // Track completion of the 5 profile sections (0% to 100%):
  const sectionStatus = useMemo(() => {
    const isCategorySelected = Boolean(selectedArchetype)
    const isTypeSelected = Boolean(businessType)
    const isIdentityEntered = businessName.trim().length > 0
    const isContactEntered = phone.trim().length > 0
    const isLocationEntered = address.trim().length > 0 || latitude !== undefined

    const sections = [
      { id: 'category', label: 'Category', completed: isCategorySelected, weight: 20 },
      { id: 'type', label: 'Type', completed: isTypeSelected, weight: 20 },
      { id: 'identity', label: 'Name', completed: isIdentityEntered, weight: 20 },
      { id: 'contact', label: 'Contact', completed: isContactEntered, weight: 20 },
      { id: 'location', label: 'Location', completed: isLocationEntered, weight: 20 },
    ]

    const percent = sections.reduce((acc, sec) => acc + (sec.completed ? sec.weight : 0), 0)

    let helperText = "Select your business category to begin tailoring features"
    if (percent < 40) {
      helperText = "Pick your specific business type for tailored metrics & tools"
    } else if (percent < 60) {
      helperText = "Enter your business name to personalize your workspace"
    } else if (percent < 80) {
      helperText = "Provide your phone number to receive alerts and invoices"
    } else if (percent < 100) {
      helperText = "Add your address or pin shop location to finish"
    } else {
      helperText = "All profile sections completed! Ready to launch your dashboard 🚀"
    }

    return { sections, percent, helperText }
  }, [selectedArchetype, businessType, businessName, phone, address, latitude])

  useEffect(() => {
    onProgressUpdate?.(sectionStatus.percent)
  }, [sectionStatus.percent, onProgressUpdate])

  const currencies = [
    { value: 'SLL', label: 'Sierra Leonean Leone (SLL)' },
    { value: 'NGN', label: 'Nigerian Naira (NGN)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' }
  ]

  // Filter business types based on chosen archetype
  const filteredTypes = BUSINESS_TYPES.filter(t => t.archetype === selectedArchetype)
  const currentTypeConfig = BUSINESS_TYPES.find(t => t.value === businessType) || filteredTypes[0]
  const archetypeConfig = getArchetypeConfig(businessType || selectedArchetype)
  const quickAccessModules = getQuickAccessModules(businessType || selectedArchetype)
  const isPro = isProfessionalServices(businessType)

  const handleArchetypeSelect = (arch: BusinessArchetype) => {
    setSelectedArchetype(arch)
    // Select default type for this archetype
    const firstType = BUSINESS_TYPES.find(t => t.archetype === arch)
    if (firstType) {
      setBusinessType(firstType.value)
    }
  }

  const handleNextToDetails = () => {
    if (!businessType) {
      toast({
        title: "Please choose your business type",
        description: "Select the specific type of business you operate.",
        variant: "destructive"
      })
      return
    }
    setActiveTab('details')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!businessName.trim() || !businessType) {
      toast({
        title: "Missing information",
        description: "Please enter your business name and verify your business type.",
        variant: "destructive"
      })
      return
    }

    onComplete({
      businessName: businessName.trim(),
      businessType,
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      currency,
      latitude,
      longitude,
      referralCode: referralCode.trim() || undefined,
    })
  }

  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-elegant border-border/60">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Building2 className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Set Up Your Business Profile</CardTitle>
        <CardDescription className="text-sm max-w-md mx-auto">
          Tailor MiBuks with customized metrics and features built specifically for your industry.
        </CardDescription>

        {/* Real-time Percentage-Based Profile Progress Tracker */}
        <div className="pt-4 pb-1 px-1 sm:px-2 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">
                {sectionStatus.percent}% Completed
              </span>
              <span className="font-semibold text-foreground hidden sm:inline">
                Profile Setup Progress
              </span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {sectionStatus.sections.filter(s => s.completed).length} / {sectionStatus.sections.length} Sections
            </span>
          </div>

          <div className="relative">
            <Progress value={sectionStatus.percent} className="h-2.5 bg-muted/80" />
          </div>

          {/* Section pills */}
          <div className="grid grid-cols-5 gap-1.5 pt-0.5">
            {sectionStatus.sections.map((sec) => (
              <div
                key={sec.id}
                className={`flex items-center justify-center gap-1 py-1 px-1 rounded-md text-[10px] font-semibold transition-all border ${
                  sec.completed
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-muted/40 text-muted-foreground border-border/50'
                }`}
              >
                <span>{sec.completed ? '✓' : '○'}</span>
                <span className="truncate">{sec.label}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground text-center font-medium">
            {sectionStatus.helperText}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('category')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'category'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              {sectionStatus.sections[0].completed && sectionStatus.sections[1].completed ? '✓' : '1'}
            </span>
            Industry & Personalization
          </button>
          <div className="w-6 h-0.5 bg-border" />
          <button
            type="button"
            onClick={() => handleNextToDetails()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'details'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              {sectionStatus.sections[2].completed && sectionStatus.sections[3].completed && sectionStatus.sections[4].completed ? '✓' : '2'}
            </span>
            Business Details
          </button>
        </div>
      </CardHeader>

      <CardContent className="max-h-[68vh] overflow-y-auto px-6 py-2">
        {activeTab === 'category' ? (
          <div className="space-y-6 animate-fade-in">
            {/* Section 1: Choose Archetype */}
            <div>
              <Label className="text-sm font-bold text-foreground block mb-2">
                1. Select your business category:
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Food & Hospitality */}
                <button
                  type="button"
                  onClick={() => handleArchetypeSelect('food')}
                  className={`relative p-4 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
                    selectedArchetype === 'food'
                      ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                      : 'border-border/70 hover:border-primary/50 bg-card'
                  }`}
                >
                  {selectedArchetype === 'food' && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mb-3">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm leading-tight">Food & Hospitality</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                      Restaurants, Chop Bars, Bakeries, Lounges, Caterers & Food Spots.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border/40">
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">Key Metrics:</span>
                    <span className="text-[11px] text-muted-foreground font-medium">Plates Served, Food Revenue, Orders</span>
                  </div>
                </button>

                {/* Provision Store & Retail */}
                <button
                  type="button"
                  onClick={() => handleArchetypeSelect('retail')}
                  className={`relative p-4 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
                    selectedArchetype === 'retail'
                      ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                      : 'border-border/70 hover:border-primary/50 bg-card'
                  }`}
                >
                  {selectedArchetype === 'retail' && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                      <Store className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm leading-tight">Provision & Retail</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                      Provision stores, Supermarkets, Boutiques, Pharmacies & Kiosks.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border/40">
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">Key Metrics:</span>
                    <span className="text-[11px] text-muted-foreground font-medium">Stock Value, Units Sold, Store Credits</span>
                  </div>
                </button>

                {/* Services & Trades */}
                <button
                  type="button"
                  onClick={() => handleArchetypeSelect('service')}
                  className={`relative p-4 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
                    selectedArchetype === 'service'
                      ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                      : 'border-border/70 hover:border-primary/50 bg-card'
                  }`}
                >
                  {selectedArchetype === 'service' && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm leading-tight">Services & Trades</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                      Salons, Barbershops, Tailoring, Mechanics, Consulting & Freelancers.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border/40">
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">Key Metrics:</span>
                    <span className="text-[11px] text-muted-foreground font-medium">Jobs Done, Client Invoices, Active Clients</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Section 2: Specific Business Type Selection */}
            <div>
              <Label className="text-sm font-bold text-foreground block mb-2">
                2. Specify your exact business type:
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredTypes.map((type) => {
                  const isSelected = businessType === type.value
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setBusinessType(type.value)}
                      className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                          : 'border-border/70 bg-card hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold leading-tight">{type.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">{type.description}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Section 3: Live Personalization Preview Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary text-primary-foreground shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground">Tailored Dashboard Preview:</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-2 bg-background/80 border-primary/30 text-primary font-bold">
                      {currentTypeConfig.label}
                    </Badge>
                    {isPro && (
                      <Badge className="text-[10px] py-0 px-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                        Professional Suite
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {archetypeConfig.tagline}
                  </p>
                </div>
              </div>

              {/* Tailored Metrics Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 rounded-md bg-background/80 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block font-medium">Metric 1</span>
                  <span className="text-xs font-bold text-foreground truncate block">{archetypeConfig.metric1Title}</span>
                </div>
                <div className="p-2 rounded-md bg-background/80 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block font-medium">Metric 2</span>
                  <span className="text-xs font-bold text-foreground truncate block">{archetypeConfig.metric2Title}</span>
                </div>
                <div className="p-2 rounded-md bg-background/80 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block font-medium">Metric 3</span>
                  <span className="text-xs font-bold text-foreground truncate block">{archetypeConfig.metric3Title}</span>
                </div>
                <div className="p-2 rounded-md bg-background/80 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block font-medium">Metric 4</span>
                  <span className="text-xs font-bold text-foreground truncate block">{archetypeConfig.metric4Title}</span>
                </div>
              </div>

              {/* Tailored Quick Access preview */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>Tailored Quick Access:</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {isPro ? 'Relevant to professional service businesses' : `Aligned with ${currentTypeConfig.label}`}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {quickAccessModules.map((mod) => {
                    const IconComponent = ICON_MAP[mod.iconName] || Briefcase
                    return (
                      <div
                        key={mod.label + mod.route}
                        className="flex items-center gap-2 p-2 rounded-lg bg-background/90 border border-border/50 transition-all shadow-2xs hover:border-primary/40"
                      >
                        <div className={`p-1.5 rounded-md shrink-0 ${mod.color}`}>
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-semibold text-foreground truncate block leading-tight">
                            {mod.label}
                          </span>
                          <span className="text-[9px] text-muted-foreground truncate block leading-tight">
                            {mod.description}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {currentTypeConfig.defaultUnits?.length > 0 && (
                <div className="pt-1.5 flex items-center gap-1.5 flex-wrap border-t border-border/40">
                  <span className="text-[10px] font-medium text-muted-foreground">Common billing units:</span>
                  {currentTypeConfig.defaultUnits.slice(0, 5).map((unit) => (
                    <span key={unit} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground/80 font-medium">
                      {unit}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={handleNextToDetails}
              className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2"
            >
              Continue to Business Details
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-bold bg-primary/10 text-primary">
                  {currentTypeConfig.label}
                </Badge>
                <span className="text-xs text-muted-foreground">({archetypeConfig.badge})</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('category')}
                className="h-7 text-xs text-primary hover:text-primary/80"
              >
                Change
              </Button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="businessName" className="text-xs font-bold text-foreground">
                  Business Name *
                </Label>
                {businessName.trim() && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> Section Completed (+20%)
                  </span>
                )}
              </div>
              <Input
                id="businessName"
                placeholder="e.g. Salone Fresh Kitchen / City Provisions"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={loading}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency" className="text-xs font-bold text-foreground">
                Operating Currency
              </Label>
              <Select value={currency} onValueChange={setCurrency} disabled={loading}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="address" className="text-xs font-bold text-foreground">
                  Business Address
                </Label>
                {(address.trim() || latitude !== undefined) && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> Section Completed (+20%)
                  </span>
                )}
              </div>
              <Textarea
                id="address"
                placeholder="Street address, market zone, or city location"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="businessPhone" className="text-xs font-bold text-foreground">
                    Business Phone
                  </Label>
                  {phone.trim() && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Completed (+20%)
                    </span>
                  )}
                </div>
                <Input
                  id="businessPhone"
                  type="tel"
                  placeholder="+232..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="businessEmail" className="text-xs font-bold text-foreground">
                  Business Email
                </Label>
                <Input
                  id="businessEmail"
                  type="email"
                  placeholder="contact@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Pin Location on Map (Optional)
              </Label>
              <p className="text-[11px] text-muted-foreground mb-1.5">
                Helps local customers and delivery partners discover your exact shop or eatery location.
              </p>
              <LocationPicker
                latitude={latitude}
                longitude={longitude}
                onLocationChange={handleLocationChange}
                height="160px"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="referralCode" className="text-xs font-bold text-foreground">
                Marketer / Referral Code (Optional)
              </Label>
              <Input
                id="referralCode"
                placeholder="e.g. MKT-ABC123"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                disabled={loading}
                className="h-10 uppercase"
              />
              <p className="text-[11px] text-muted-foreground">
                Enter code if an agent or partner introduced you to MiBuks.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('category')}
                disabled={loading}
                className="w-1/3 h-11"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-2/3 h-11 font-semibold"
              >
                {loading ? "Setting up..." : "Complete Setup & Launch 🚀"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
