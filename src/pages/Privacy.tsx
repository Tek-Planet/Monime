import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ArrowLeft, Building, Shield, Eye, Lock, FileText, Users, Database, Bell, Mail } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Privacy() {
  const { t } = useLanguage()
  
  const sections = [
    {
      id: 'introduction',
      icon: Shield,
      title: t('privacy.introduction'),
      content: t('privacy.introductionContent')
    },
    {
      id: 'information-collected',
      icon: Database,
      title: t('privacy.infoCollected'),
      content: t('privacy.infoCollectedContent')
    },
    {
      id: 'how-we-use',
      icon: Eye,
      title: t('privacy.howWeUse'),
      content: t('privacy.howWeUseContent')
    },
    {
      id: 'data-security',
      icon: Lock,
      title: t('privacy.dataSecurity'),
      content: t('privacy.dataSecurityContent')
    },
    {
      id: 'data-sharing',
      icon: Users,
      title: t('privacy.dataSharing'),
      content: t('privacy.dataSharingContent')
    },
    {
      id: 'your-rights',
      icon: FileText,
      title: t('privacy.yourRights'), // Note: Ensure this key exists or add it
      content: t('privacy.yourRightsContent')
    },
    {
      id: 'cookies',
      icon: Database,
      title: t('privacy.cookies'),
      content: t('privacy.cookiesContent')
    },
    {
      id: 'changes',
      icon: Bell,
      title: t('privacy.changes'),
      content: t('privacy.changesContent')
    },
    {
      id: 'contact',
      icon: Mail,
      title: t('privacy.contact'),
      content: t('privacy.contactContent')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
      <div className="absolute top-1/4 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -right-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-3xl space-y-8 relative z-10 py-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <Link 
            to="/auth" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 mb-6 hover-lift"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('privacy.backToLogin')}
          </Link>
          
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
            <div className="p-2 bg-gradient-primary rounded-xl shadow-glow">
              <Building className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              MiBuks
            </h1>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">{t('privacy.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('privacy.lastUpdated')}: December 2024
          </p>
        </div>

        {/* Privacy Policy Card */}
        <Card className="professional-card animate-scale-in border-0 shadow-elegant">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              {t('privacy.yourPrivacyMatters')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('privacy.yourPrivacyMattersDesc')}
            </p>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full space-y-2">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <AccordionItem 
                    key={section.id} 
                    value={section.id}
                    className="border border-border/50 rounded-lg px-4 data-[state=open]:bg-muted/30"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-left">{section.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-line pt-2 pb-4">
                      {section.content}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-border/30">
            <Link 
              to="/support" 
              className="text-sm text-primary hover:text-primary-hover transition-colors"
            >
              Need Help? Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
