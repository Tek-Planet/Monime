import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Star, Shield, TrendingUp, Clock, MapPin } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import heroImage from '@/assets/hero-business.jpg'

export function WelcomeSection() {
  const { t } = useLanguage()
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('dashboard.goodMorning')
    if (hour < 17) return t('dashboard.goodAfternoon')
    return t('dashboard.goodEvening')
  }

  return (
    <Card className="professional-card overflow-hidden mb-6 bg-gradient-primary text-white">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
          {/* Content */}
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <div className="space-y-6">
              {/* Header with Time & Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{currentTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>Freetown, Sierra Leone</span>
                  </div>
                </div>
                <p className="text-white/70 text-sm">{currentDate}</p>
              </div>

              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  {getGreeting()}! 👋
                </h2>
                <h3 className="text-xl lg:text-2xl font-semibold text-white/90 mb-3">
                  {t('dashboard.welcome')}
                </h3>
                <p className="text-lg text-white/80 leading-relaxed">
                  Your comprehensive business management platform for Sierra Leone provision shops. 
                  Track sales, manage inventory of rice, oil, maggi, garri and more - access credit for restocking.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-white/20">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">{t('sales.title')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-white/20">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">Secure Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-white/20">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">{t('credit.title')}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex items-center gap-2 bg-white text-primary hover:bg-white/90">
                  {t('onboarding.getStarted')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  {t('dashboard.viewAll')} {t('nav.reports')}
                </Button>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <img 
              src={heroImage} 
              alt="MiBuks Business Dashboard" 
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-primary/20"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}