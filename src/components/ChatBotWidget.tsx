import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  ArrowLeft,
  Package,
  FileText,
  TrendingUp,
  CreditCard,
  Users,
  ShieldCheck,
  PhoneCall,
  Mail,
  MessageSquare,
  RotateCcw,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import ReactMarkdown from 'react-markdown'

type Message = { role: 'user' | 'assistant'; content: string }

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-support`

const HELP_CATEGORIES = [
  {
    id: 'inventory',
    icon: Package,
    title: 'Inventory & Stock',
    desc: 'Add items, track stock quantities & receive low stock alerts',
    prompt: 'How do I add new inventory products and track low stock in MiBuks?',
  },
  {
    id: 'invoices',
    icon: FileText,
    title: 'Invoices & Receipts',
    desc: 'Create, customize, download PDF & record customer payments',
    prompt: 'How do I create and manage invoices, record payments, and download PDFs?',
  },
  {
    id: 'sales',
    icon: TrendingUp,
    title: 'Sales & Cash Flow',
    desc: 'Record cash sales, track pending credit & view daily totals',
    prompt: 'How do I record walk-in sales and manage credit customers?',
  },
  {
    id: 'subscription',
    icon: CreditCard,
    title: 'Billing & Upgrades',
    desc: 'Upgrade plan, Flutterwave/Monime payments & premium features',
    prompt: 'How do I upgrade my subscription plan and what payment methods can I use?',
  },
  {
    id: 'team',
    icon: Users,
    title: 'Staff & Multi-Branch',
    desc: 'Add team members, roles & manage branch locations',
    prompt: 'How do I add staff members, assign roles, and enable multi-branch features?',
  },
  {
    id: 'security',
    icon: ShieldCheck,
    title: 'PIN Lock & Data Backup',
    desc: 'Configure app PIN lock, offline sync & cloud security',
    prompt: 'How do I set up my PIN lock, enable offline mode, and keep data secure?',
  },
]

const QUICK_CONTACTS = [
  {
    name: 'WhatsApp Support',
    desc: 'Fastest reply (Human agent)',
    icon: MessageSquare,
    href: 'https://wa.me/233200800555?text=Hello%20MiBuks%20Support%2C%20I%20need%20help%20with%20my%20account',
    badge: 'Fast',
    badgeColor: 'bg-emerald-600 text-white',
  },
  {
    name: 'Helpline Call',
    desc: '+233 20 080 0555',
    icon: PhoneCall,
    href: 'tel:+233200800555',
    badge: 'Voice',
    badgeColor: 'bg-blue-600 text-white',
  },
  {
    name: 'Email Desk',
    desc: 'info@mibukssl.com',
    icon: Mail,
    href: 'mailto:info@mibukssl.com?subject=MiBuks%20Support%20Request',
    badge: '24/7',
    badgeColor: 'bg-purple-600 text-white',
  },
]

const QUICK_CHIPS = [
  'How to record a sale?',
  'How to create an invoice?',
  'How to add inventory?',
  'Upgrade to Pro plan',
  'Connect to WhatsApp agent',
]

export function ChatBotWidget() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Track mobile visual viewport so virtual keyboard never obstructs the input
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return

    const updateViewport = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height)
      }
    }

    updateViewport()
    window.visualViewport.addEventListener('resize', updateViewport)
    window.visualViewport.addEventListener('scroll', updateViewport)

    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewport)
      window.visualViewport?.removeEventListener('scroll', updateViewport)
    }
  }, [])

  // Auto-scroll to bottom smoothly
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Focus input when opened (desktop) or when switching to message mode
  useEffect(() => {
    if (open && window.innerWidth >= 640) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  const executeSend = useCallback(async (textToSend: string) => {
    const text = textToSend.trim()
    if (!text || isLoading) return

    // If user clicks WhatsApp escalate option
    if (text.toLowerCase().includes('whatsapp agent') || text.toLowerCase().includes('human agent')) {
      window.open('https://wa.me/233200800555?text=Hello%20MiBuks%20Support%2C%20I%20would%20like%20to%20speak%20with%20an%20agent', '_blank')
    }

    const userMsg: Message = { role: 'user', content: text }
    const allMessages = [...messages, userMsg]
    setMessages(allMessages)
    setInput('')
    setIsLoading(true)

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Something went wrong' }))
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: err.error || 'Sorry, I had trouble reaching the support service. You can also contact us directly on WhatsApp or Email below.',
          },
        ])
        setIsLoading(false)
        return
      }

      const contentType = resp.headers.get('content-type') || ''

      // JSON response
      if (contentType.includes('application/json')) {
        const data = await resp.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
        setIsLoading(false)
        return
      }

      // Streaming AI response
      if (!resp.body) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'No response received. Please try again.' }])
        setIsLoading(false)
        return
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let textBuffer = ''
      let assistantSoFar = ''
      let streamDone = false

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      const updateLast = (content: string) => {
        setMessages(prev => prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m)))
      }

      while (!streamDone) {
        const { done, value } = await reader.read()
        if (done) break
        textBuffer += decoder.decode(value, { stream: true })

        let newlineIndex: number
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex)
          textBuffer = textBuffer.slice(newlineIndex + 1)

          if (line.endsWith('\r')) line = line.slice(0, -1)
          if (line.startsWith(':') || line.trim() === '') continue
          if (!line.startsWith('data: ')) continue

          const jsonStr = line.slice(6).trim()
          if (jsonStr === '[DONE]') {
            streamDone = true
            break
          }

          try {
            const parsed = JSON.parse(jsonStr)
            const content = parsed.choices?.[0]?.delta?.content as string | undefined
            if (content) {
              assistantSoFar += content
              updateLast(assistantSoFar)
            }
          } catch {
            textBuffer = line + '\n' + textBuffer
            break
          }
        }
      }

      if (textBuffer.trim()) {
        for (const raw of textBuffer.split('\n')) {
          if (!raw) continue
          let clean = raw
          if (clean.endsWith('\r')) clean = clean.slice(0, -1)
          if (clean.startsWith(':') || clean.trim() === '') continue
          if (!clean.startsWith('data: ')) continue
          const jsonStr = clean.slice(6).trim()
          if (jsonStr === '[DONE]') continue
          try {
            const parsed = JSON.parse(jsonStr)
            const content = parsed.choices?.[0]?.delta?.content as string | undefined
            if (content) {
              assistantSoFar += content
              updateLast(assistantSoFar)
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I couldn\'t connect to the support server right now. Please tap WhatsApp or call our helpline below for immediate help.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, messages])

  const handleResetChat = () => {
    setMessages([])
    setInput('')
  }

  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640

  return (
    <>
      {/* Chat & Support Panel */}
      {open && (
        <div
          className={cn(
            'fixed z-[100] flex flex-col bg-background shadow-2xl overflow-hidden transition-all duration-200',
            // Mobile: Full screen avoiding keyboard via visualViewport height
            'inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[420px] sm:h-[620px] sm:max-h-[85vh] sm:rounded-2xl sm:border sm:border-border/80'
          )}
          style={
            viewportHeight && isSmallScreen
              ? {
                  height: `${viewportHeight}px`,
                  maxHeight: `${viewportHeight}px`,
                  top: 0,
                  bottom: 'auto',
                }
              : undefined
          }
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 bg-[#7059e8] bg-gradient-to-r from-[#7059e8] to-[#8b5cf6] text-white shrink-0 sm:rounded-t-2xl shadow-sm">
            <div className="flex items-center gap-2.5">
              {messages.length > 0 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 bg-white/10 h-9 w-9 rounded-full flex items-center justify-center cursor-pointer"
                  onClick={handleResetChat}
                  aria-label="Back to topics"
                  title="Back to topics"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              ) : (
                <div className="p-2 bg-white/20 rounded-xl">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm sm:text-base leading-tight text-white">MiBuks Customer Support</p>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                </div>
                <p className="text-xs text-white/80 leading-tight">Guided help & instant answers</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 bg-white/10 h-8 px-2 text-xs flex items-center gap-1 rounded-lg"
                  onClick={handleResetChat}
                  title="Return to Support Options"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Topics</span>
                </Button>
              )}

              {/* Close Button - Clearly visible on BOTH mobile and desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/25 bg-white/15 h-9 w-9 rounded-full flex items-center justify-center cursor-pointer shadow-xs"
                onClick={() => setOpen(false)}
                aria-label="Close customer support"
              >
                <X className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>

          {/* Quick Helpline Strip */}
          <div className="bg-muted/70 px-3 py-2 border-b border-border/50 shrink-0 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
            {QUICK_CONTACTS.map(contact => {
              const ContactIcon = contact.icon
              return (
                <a
                  key={contact.name}
                  href={contact.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card hover:bg-card/80 border border-border/60 text-xs font-medium text-foreground shrink-0 transition-colors shadow-2xs"
                >
                  <ContactIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate max-w-[100px]">{contact.name}</span>
                  <Badge variant="secondary" className={cn('text-[10px] px-1 py-0 h-4 leading-none', contact.badgeColor)}>
                    {contact.badge}
                  </Badge>
                </a>
              )
            })}
          </div>

          {/* Body: Guided Options OR Chat History */}
          <ScrollArea className="flex-1 p-3 sm:p-4 overflow-y-auto" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-4 pb-2 animate-fade-in">
                {/* Greeting & Clear explanation */}
                <div className="bg-card border border-border/70 rounded-xl p-3.5 shadow-2xs space-y-1.5 text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">How can we help your business today?</h3>
                  <p className="text-xs text-muted-foreground">
                    Tap a clearly labeled topic below for instant step-by-step guidance, or type your question below.
                  </p>
                </div>

                {/* Clearly Labeled Options Menu */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Common Support Categories
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {HELP_CATEGORIES.map(category => {
                      const CategoryIcon = category.icon
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => executeSend(category.prompt)}
                          className="flex items-start gap-3 p-3 text-left rounded-xl border border-border/60 bg-card hover:bg-primary/5 hover:border-primary/40 active:bg-primary/10 transition-all cursor-pointer group shadow-2xs touch-manipulation min-h-[52px]"
                        >
                          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <CategoryIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
                                {category.title}
                              </p>
                              <span className="text-muted-foreground text-xs group-hover:translate-x-0.5 transition-transform">
                                →
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {category.desc}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Direct Human Agent Action Card */}
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Need to talk to a human agent?</p>
                      <p className="text-[11px] text-muted-foreground">Our Freetown customer support team is online</p>
                    </div>
                  </div>
                  <a
                    href="https://wa.me/233200800555?text=Hello%20MiBuks%20Support%2C%20I%20need%20assistance%20with%20my%20business%20account"
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium inline-flex items-center gap-1 shadow-xs"
                  >
                    <span>WhatsApp</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ) : (
              /* Message Stream */
              <div className="space-y-3.5 pb-2">
                {messages.map((msg, i) => (
                  <div key={i} className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className="p-1.5 bg-primary/10 rounded-lg h-fit mt-0.5 shrink-0 text-primary">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-2xs',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-xs font-medium'
                          : 'bg-muted/80 border border-border/60 text-foreground rounded-bl-xs'
                      )}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>p+p]:mt-2 [&>ul]:mt-1.5 [&>ol]:mt-1.5 [&>li]:mt-0.5">
                          <ReactMarkdown>{msg.content || 'Thinking...'}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="p-1.5 bg-primary/10 rounded-lg h-fit mt-0.5 shrink-0 text-primary">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-2.5 items-center">
                    <div className="p-1.5 bg-primary/10 rounded-lg shrink-0 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted/80 border border-border/60 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Preparing step-by-step answer...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Quick Query Chips (Visible above the input for effortless 1-tap questions) */}
          <div className="px-3 pt-2 pb-1.5 bg-background border-t border-border/40 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {QUICK_CHIPS.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => executeSend(chip)}
                  disabled={isLoading}
                  className="shrink-0 text-[11px] font-medium bg-muted/70 hover:bg-muted text-foreground border border-border/50 rounded-full px-2.5 py-1 transition-colors touch-manipulation cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer - Guaranteed Keyboard Safe */}
          <div className="p-3 bg-background border-t border-border/60 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <form
              onSubmit={e => {
                e.preventDefault()
                executeSend(input)
              }}
              className="flex items-center gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onFocus={() => {
                  setTimeout(scrollToBottom, 200)
                }}
                placeholder="Ask a question or select a topic..."
                disabled={isLoading}
                className="flex-1 rounded-full text-xs sm:text-sm h-11 px-4 bg-muted/40 border-border/80 focus-visible:ring-primary min-h-[44px]"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="rounded-full h-11 w-11 bg-[#7059e8] hover:bg-[#5f48db] text-white shrink-0 shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white" />}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Trigger Button (Always solid brand purple on white and dark themes) */}
      {(!open || !isSmallScreen) && (
        <button
          onClick={() => setOpen(prev => !prev)}
          className={cn(
            'fixed bottom-20 right-4 sm:right-6 z-[90] h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation cursor-pointer',
            'bg-[#7059e8] hover:bg-[#5f48db] text-white border-2 border-white/30 shadow-purple-600/30 ring-4 ring-purple-500/10'
          )}
          aria-label={open ? 'Close customer support' : 'Open customer support'}
          data-accessibility-toolbar
        >
          {open ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-7 w-7 text-white" />}
        </button>
      )}
    </>
  )
}
