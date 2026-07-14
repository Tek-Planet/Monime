import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { TopNavigation } from '@/components/TopNavigation'
import { ProfileCompletionBanner } from '@/components/ProfileCompletionBanner'
import { AccessibilityToolbar } from '@/components/AccessibilityToolbar'
import { ChatBotWidget } from '@/components/ChatBotWidget'
import { Button } from '@/components/ui/button' // Assuming you use shadcn/ui Button
import { ArrowLeft } from 'lucide-react' // Common icon library

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

  // Handle global redirects for third-party checkout integrations (like Monime)
  // This avoids 404 Page Not Found errors on SPA sub-routes in local/custom hosting
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const subscription = params.get('subscription')
    const payment = params.get('payment')

    if (subscription) {
      navigate(`/settings${location.search}`, { replace: true })
    } else if (payment) {
      navigate(`/invoices${location.search}`, { replace: true })
    }
  }, [location.search, navigate])

  // Show back button on sub-routes (more than one segment after the root)
  // Adjust the condition based on your route structure if needed
const isSubScreen = location.pathname !== '/';
  const handleBack = () => {
    navigate(-1)
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNavigation />

          {/* Back Button Area - Clean and consistent with header */}
          {isSubScreen && (
            <div className="px-3 sm:px-6 pt-4 pb-2 border-b border-border/60 bg-background/80 backdrop-blur-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            </div>
          )}

          <ProfileCompletionBanner />

          <main className="flex-1 p-3 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <AccessibilityToolbar />
      <ChatBotWidget />
    </SidebarProvider>
  )
}