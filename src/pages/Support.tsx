import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Building, HelpCircle, Mail, Phone, MessageCircle, Send, FileQuestion, Users, Package, CreditCard, Shield, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Support() {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: ''
  })

  const faqs = [
    {
      id: 'create-account',
      icon: Users,
      question: t('support.faq.createAccount'),
      answer: t('support.faq.createAccountAns')
    },
    {
      id: 'add-team',
      icon: Users,
      question: t('support.faq.addTeam'),
      answer: t('support.faq.addTeamAns')
    },
    {
      id: 'record-sale',
      icon: CreditCard,
      question: t('support.faq.recordSale'),
      answer: t('support.faq.recordSaleAns')
    },
    {
      id: 'generate-invoice',
      icon: FileQuestion,
      question: t('support.faq.generateInvoice'),
      answer: t('support.faq.generateInvoiceAns')
    },
    {
      id: 'track-inventory',
      icon: Package,
      question: t('support.faq.trackInventory'),
      answer: t('support.faq.trackInventoryAns')
    },
    {
      id: 'payment-methods',
      icon: CreditCard,
      question: t('support.faq.paymentMethods'),
      answer: t('support.faq.paymentMethodsAns')
    },
    {
      id: 'export-data',
      icon: FileQuestion,
      question: t('support.faq.exportData'),
      answer: t('support.faq.exportDataAns')
    },
    {
      id: 'data-security',
      icon: Shield,
      question: t('support.faq.dataSecurity'),
      answer: t('support.faq.dataSecurityAns')
    },
    {
      id: 'delete-account',
      icon: Trash2,
      question: t('support.faq.deleteAccount'),
      answer: t('support.faq.deleteAccountAns')
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.category || !formData.subject || !formData.message) {
      toast.error(t('support.fillAllFields'))
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast.success(t('support.messageSent'))
    setFormData({ name: '', email: '', category: '', subject: '', message: '' })
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-subtle relative overflow-hidden py-8 px-4">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
      <div className="absolute top-1/4 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -right-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <Link 
            to="/auth" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 mb-6 hover-lift"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('support.backToLogin')}
          </Link>
          
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
            <div className="p-2 bg-gradient-primary rounded-xl shadow-glow">
              <Building className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              MiBuks
            </h1>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">{t('nav.support')}</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            {t('support.subtitle')}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* FAQ Section */}
          <Card className="professional-card animate-scale-in border-0 shadow-elegant">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <HelpCircle className="h-5 w-5 text-primary" />
                {t('support.faqTitle')}
              </CardTitle>
              <CardDescription>
                {t('support.faqDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full space-y-2">
                {faqs.map((faq) => {
                  const Icon = faq.icon
                  return (
                    <AccordionItem 
                      key={faq.id} 
                      value={faq.id}
                      className="border border-border/50 rounded-lg px-4 data-[state=open]:bg-muted/30"
                    >
                      <AccordionTrigger className="hover:no-underline text-left">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-primary/10 rounded-md shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm pt-2 pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <div className="space-y-6">
            {/* Contact Info Cards */}
            <div className="grid sm:grid-cols-3 gap-4 animate-fade-in">
              <Card className="professional-card border-0 shadow-elegant text-center p-4">
                <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-3">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <p className="font-medium text-sm">{t('support.email')}</p>
                <p className="text-xs text-muted-foreground">support@mibuks.com</p>
              </Card>
              
              <Card className="professional-card border-0 shadow-elegant text-center p-4">
                <div className="p-3 bg-prosperity-green/10 rounded-full w-fit mx-auto mb-3">
                  <Phone className="h-5 w-5 text-prosperity-green" />
                </div>
                <p className="font-medium text-sm">{t('support.phone')}</p>
                <p className="text-xs text-muted-foreground">+232 XX XXX XXXX</p>
              </Card>
              
              <Card className="professional-card border-0 shadow-elegant text-center p-4">
                <div className="p-3 bg-chart-3/10 rounded-full w-fit mx-auto mb-3">
                  <MessageCircle className="h-5 w-5 text-chart-3" />
                </div>
                <p className="font-medium text-sm">{t('support.whatsapp')}</p>
                <p className="text-xs text-muted-foreground">+232 XX XXX XXXX</p>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="professional-card animate-scale-in border-0 shadow-elegant">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Send className="h-5 w-5 text-primary" />
                  {t('support.sendMessageTitle')}
                </CardTitle>
                <CardDescription>
                  {t('support.sendMessageDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('support.form.name')}</Label>
                      <Input
                        id="name"
                        placeholder={t('support.form.namePlaceholder')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('support.form.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('support.form.emailPlaceholder')}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">{t('support.form.category')}</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('support.form.selectCategory')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">{t('support.form.cat.general')}</SelectItem>
                          <SelectItem value="technical">{t('support.form.cat.technical')}</SelectItem>
                          <SelectItem value="billing">{t('support.form.cat.billing')}</SelectItem>
                          <SelectItem value="feature">{t('support.form.cat.feature')}</SelectItem>
                          <SelectItem value="bug">{t('support.form.cat.bug')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">{t('support.form.subject')}</Label>
                      <Input
                        id="subject"
                        placeholder={t('support.form.subjectPlaceholder')}
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t('support.form.message')}</Label>
                    <Textarea
                      id="message"
                      placeholder={t('support.form.messagePlaceholder')}
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {t('support.form.sending')}
                      </div>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t('support.form.submit')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/30">
            <Link 
              to="/privacy" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {t('support.privacyPolicy')}
            </Link>
            <span className="text-border">•</span>
            <Link 
              to="/auth" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {t('support.signIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
