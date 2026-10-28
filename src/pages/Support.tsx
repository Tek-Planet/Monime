import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Building,
  HelpCircle,
  Mail,
  Phone,
  MessageCircle,
  Send,
  FileQuestion,
  Users,
  Package,
  CreditCard,
  Shield,
  Trash2,
  ExternalLink,
  MessageSquare,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/hooks/useUserProfile'

export default function Support() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const navigate = useNavigate()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '',
    email: user?.email || '',
    category: 'general',
    subject: '',
    message: '',
  })

  const contactChannels = [
    {
      title: 'WhatsApp Support',
      subtitle: 'Fastest response time',
      value: '+233 20 080 0555',
      actionLabel: 'Chat on WhatsApp',
      icon: MessageSquare,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      badge: 'Recommended',
      badgeClass: 'bg-emerald-600 text-white',
      href: 'https://wa.me/233200800555?text=Hello%20MiBuks%20Support%2C%20I%20need%20assistance%20with%20my%20account',
    },
    {
      title: 'Telephone Helpline',
      subtitle: 'Mon - Sat (8:00 AM - 6:00 PM)',
      value: '+233 20 080 0555',
      actionLabel: 'Call Toll-Free',
      icon: Phone,
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      badge: 'Direct Call',
      badgeClass: 'bg-blue-600 text-white',
      href: 'tel:+233200800555',
    },
    {
      title: 'Email Help Desk',
      subtitle: 'Guaranteed 24hr response',
      value: 'info@mibukssl.com',
      actionLabel: 'Send an Email',
      icon: Mail,
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      btnColor: 'bg-purple-600 hover:bg-purple-700 text-white',
      badge: '24/7 Desk',
      badgeClass: 'bg-purple-600 text-white',
      href: 'mailto:info@mibukssl.com?subject=Customer%20Support%20Request%20-%20MiBuks',
    },
  ]

  const faqs = [
    {
      id: 'create-account',
      category: 'account',
      icon: Users,
      question: t('support.faq.createAccount') || 'How do I create and set up my business profile?',
      answer:
        t('support.faq.createAccountAns') ||
        'Go to Settings > Business Profile to complete your business information, currency, logo, and physical address. A complete profile enables automated branded receipts.',
    },
    {
      id: 'add-team',
      category: 'team',
      icon: Users,
      question: t('support.faq.addTeam') || 'How do I add staff members and set their permissions?',
      answer:
        t('support.faq.addTeamAns') ||
        'As an owner, navigate to Settings > Team. Enter your staff member\'s email, select their assigned role (Manager, Cashier, Inventory Clerk), and assign them to an active branch.',
    },
    {
      id: 'record-sale',
      category: 'sales',
      icon: CreditCard,
      question: t('support.faq.recordSale') || 'How do I record walk-in sales and credit payments?',
      answer:
        t('support.faq.recordSaleAns') ||
        'From the Sales tab, select items from inventory or enter custom items, choose payment method (Cash, Mobile Money, or Credit), and tap Complete Sale to generate receipts instantly.',
    },
    {
      id: 'generate-invoice',
      category: 'sales',
      icon: FileQuestion,
      question: t('support.faq.generateInvoice') || 'How do I generate, download, or share an invoice?',
      answer:
        t('support.faq.generateInvoiceAns') ||
        'Go to Invoices, click "Create Invoice", select your customer and itemize services or products. Once saved, you can record payments, download branded PDFs, or share via WhatsApp.',
    },
    {
      id: 'track-inventory',
      category: 'inventory',
      icon: Package,
      question: t('support.faq.trackInventory') || 'How do I track stock levels and receive low-stock alerts?',
      answer:
        t('support.faq.trackInventoryAns') ||
        'Add products in Inventory with initial stock and alert thresholds. You will receive real-time notifications in your dashboard whenever items fall below minimum thresholds.',
    },
    {
      id: 'payment-methods',
      category: 'billing',
      icon: CreditCard,
      question: t('support.faq.paymentMethods') || 'What payment options are supported for subscription plans?',
      answer:
        t('support.faq.paymentMethodsAns') ||
        'We support Orange Money, Africell Money via Flutterwave, Monime Mobile Checkout, and major debit/credit cards in Sierra Leone Leones (SLL) and USD.',
    },
    {
      id: 'export-data',
      category: 'security',
      icon: FileQuestion,
      question: t('support.faq.exportData') || 'How can I backup or export my business records?',
      answer:
        t('support.faq.exportDataAns') ||
        'Go to Settings > Data Management. You can download an encrypted backup of your customers, sales transactions, inventory records, and financial statements anytime.',
    },
    {
      id: 'data-security',
      category: 'security',
      icon: Shield,
      question: t('support.faq.dataSecurity') || 'How is my business financial data kept safe?',
      answer:
        t('support.faq.dataSecurityAns') ||
        'All data is encrypted in transit and at rest using bank-grade 256-bit SSL encryption. You can also configure the 4-digit PIN lock in Settings to prevent unauthorized device access.',
    },
    {
      id: 'delete-account',
      category: 'account',
      icon: Trash2,
      question: t('support.faq.deleteAccount') || 'How do I delete my account and erase business data?',
      answer:
        t('support.faq.deleteAccountAns') ||
        'Under Settings > Danger Zone, select "Delete Account". This permanently wipes your business documents, sales history, and personal profile in compliance with privacy laws.',
    },
  ]

  const filteredFaqs =
    selectedCategory === 'all' ? faqs : faqs.filter(faq => faq.category === selectedCategory)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error(t('support.fillAllFields') || 'Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)

    // Simulate ticketing transmission
    await new Promise(resolve => setTimeout(resolve, 1200))

    toast.success(
      t('support.messageSent') ||
        'Your support request has been submitted. A specialist will follow up with you within 24 hours.'
    )
    setFormData({
      name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '',
      email: user?.email || '',
      category: 'general',
      subject: '',
      message: '',
    })
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-subtle relative overflow-hidden py-6 sm:py-10 px-3 sm:px-6">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-primary opacity-5 pointer-events-none"></div>
      <div className="absolute top-1/4 -left-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 relative z-10">
        {/* Navigation Back Link */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (user ? navigate('/') : navigate('/auth'))}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors rounded-xl px-3 min-h-[40px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{user ? 'Back to Dashboard' : t('support.backToLogin') || 'Back to Sign In'}</span>
          </Button>

          <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 py-1 px-3 bg-card border-border/60">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs">Live Support: Mon - Sat 8AM - 6PM</span>
          </Badge>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-3 animate-fade-in max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-primary text-white rounded-2xl shadow-glow mb-1">
            <Building className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            MiBuks Customer Support Desk
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Get instant help with your business setup, billing, sales, invoices, and staff management.
          </p>
        </div>

        {/* Clearly Labeled Option Cards (Channels) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          {contactChannels.map(channel => {
            const Icon = channel.icon
            return (
              <Card
                key={channel.title}
                className="professional-card border border-border/70 hover:border-primary/40 transition-all flex flex-col justify-between p-5 bg-card/80 backdrop-blur-sm shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={cn('p-2.5 rounded-xl border', channel.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge className={cn('text-[11px] font-medium px-2 py-0.5', channel.badgeClass)}>
                      {channel.badge}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">{channel.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{channel.subtitle}</p>
                  </div>
                  <p className="font-semibold text-sm text-foreground bg-muted/60 p-2 rounded-lg text-center select-all">
                    {channel.value}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-border/50">
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      'w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-xs min-h-[44px]',
                      channel.btnColor
                    )}
                  >
                    <span>{channel.actionLabel}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Main 2-Column Section: FAQs on Left, Ticket Form on Right */}
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* FAQ Knowledge Base */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="professional-card border border-border/70 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
                    <CardDescription className="text-xs">
                      Instant answers to standard questions about MiBuks features.
                    </CardDescription>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-3">
                  {[
                    { id: 'all', label: 'All Topics' },
                    { id: 'sales', label: 'Sales & Invoices' },
                    { id: 'inventory', label: 'Inventory' },
                    { id: 'billing', label: 'Billing' },
                    { id: 'team', label: 'Team' },
                    { id: 'security', label: 'Security' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        'shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all cursor-pointer min-h-[36px]',
                        selectedCategory === cat.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-muted/70 text-muted-foreground border-border/60 hover:text-foreground'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <Accordion type="single" collapsible className="w-full space-y-2.5">
                  {filteredFaqs.map(faq => {
                    const Icon = faq.icon
                    return (
                      <AccordionItem
                        key={faq.id}
                        value={faq.id}
                        className="border border-border/60 rounded-xl px-3.5 data-[state=open]:bg-muted/40 transition-colors"
                      >
                        <AccordionTrigger className="hover:no-underline py-3 text-left">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-primary/10 rounded-lg shrink-0 text-primary">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-xs sm:text-sm text-foreground">
                              {faq.question}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-xs sm:text-sm pt-1 pb-4 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Request Form */}
          <div className="lg:col-span-5">
            <Card className="professional-card border border-border/70 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Send Support Inquiry</CardTitle>
                    <CardDescription className="text-xs">
                      Submit a direct ticket to our customer care specialists.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="support-name" className="text-xs font-semibold">
                      Your Full Name *
                    </Label>
                    <Input
                      id="support-name"
                      placeholder="e.g. Mariama Sesay"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      disabled={isSubmitting}
                      className="min-h-[44px] bg-muted/40 rounded-xl text-xs sm:text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="support-email" className="text-xs font-semibold">
                      Contact Email *
                    </Label>
                    <Input
                      id="support-email"
                      type="email"
                      placeholder="mariama@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      disabled={isSubmitting}
                      className="min-h-[44px] bg-muted/40 rounded-xl text-xs sm:text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="support-category" className="text-xs font-semibold">
                      Issue Category *
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={value => setFormData({ ...formData, category: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="support-category" className="min-h-[44px] bg-muted/40 rounded-xl text-xs sm:text-sm">
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">💼 General Business Inquiry</SelectItem>
                        <SelectItem value="technical">⚙️ Technical or System Issue</SelectItem>
                        <SelectItem value="billing">💳 Subscription & Billing</SelectItem>
                        <SelectItem value="inventory">📦 Inventory & Stock Question</SelectItem>
                        <SelectItem value="feature">💡 Feature Request / Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="support-subject" className="text-xs font-semibold">
                      Subject *
                    </Label>
                    <Input
                      id="support-subject"
                      placeholder="Short summary of what you need"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      disabled={isSubmitting}
                      className="min-h-[44px] bg-muted/40 rounded-xl text-xs sm:text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="support-message" className="text-xs font-semibold">
                      Detailed Message *
                    </Label>
                    <Textarea
                      id="support-message"
                      placeholder="Please provide details about the issue or question..."
                      rows={4}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      disabled={isSubmitting}
                      className="bg-muted/40 rounded-xl text-xs sm:text-sm"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full min-h-[44px] bg-gradient-primary hover:opacity-95 text-white font-semibold rounded-xl shadow-md transition-all duration-200 mt-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Submitting Ticket...</span>
                      </div>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        <span>Submit Support Ticket</span>
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-border/40 space-y-2">
          <p className="text-xs text-muted-foreground">
            MiBuks Business Support • Freetown, Sierra Leone • Open Mon–Sat 8:00 AM – 6:00 PM
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/settings" className="hover:text-primary transition-colors">
              Account Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
