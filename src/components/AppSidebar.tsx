import { LayoutDashboard, FileText, Users, Package, TrendingUp, CreditCard, BarChart3, Settings, Truck, Receipt, Shield, UserCog, Building2, Activity, PieChart, Wallet, Crown, Megaphone } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { usePageAccess } from '@/hooks/usePageAccess'
import { useAdminType } from '@/hooks/useAdminType'
import { useSubscription } from '@/hooks/useSubscription'
import logo from '@/assets/logo.png'

const PAGE_ROUTE_MAP: Record<string, string> = {
  'dashboard': '/',
  'sales': '/sales',
  'invoices': '/invoices',
  'customers': '/customers',
  'inventory': '/inventory',
  'suppliers': '/suppliers',
  'expenses': '/expenses',
  'credit': '/credit',
  'reports': '/reports',
  'settings': '/settings'
}

const getMenuItems = (t: (key: string) => string) => [
  { title: t('nav.dashboard'), url: '/', icon: LayoutDashboard, pageKey: 'dashboard' },
  { title: t('nav.sales'), url: '/sales', icon: TrendingUp, pageKey: 'sales' },
  { title: t('nav.invoices'), url: '/invoices', icon: FileText, pageKey: 'invoices' },
  { title: t('nav.customers'), url: '/customers', icon: Users, pageKey: 'customers' },
  { title: t('nav.inventory'), url: '/inventory', icon: Package, pageKey: 'inventory' },
  { title: t('nav.suppliers'), url: '/suppliers', icon: Truck, pageKey: 'suppliers' },
  { title: t('nav.expenses'), url: '/expenses', icon: Receipt, pageKey: 'expenses' },
  // { title: t('nav.credit'), url: '/credit', icon: CreditCard, pageKey: 'credit' },
  { title: t('nav.reports'), url: '/reports', icon: BarChart3, pageKey: 'reports' },
  { title: t('nav.settings'), url: '/settings', icon: Settings, pageKey: 'settings' },
]

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar()
  const location = useLocation()
  const { t } = useLanguage()
  const isMobile = useIsMobile()
  const { hasPageAccess, loading } = usePageAccess()
  const { adminType } = useAdminType()
  const hasAdminAccess = adminType === 'system_admin' || adminType === 'ngo_admin'
  const { isPremiumPage, hasPremiumAccess } = useSubscription()
  const currentPath = location.pathname
  const isCollapsed = state === 'collapsed'
  const menuItems = getMenuItems(t)

  const isActive = (path: string) => currentPath === path

  const handleNavClick = () => {
    // Close sidebar on mobile when a navigation item is clicked
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  // Filter menu items based on page access
  const visibleMenuItems = menuItems.filter(item => {
    if (loading) return true // Show all while loading
    return hasPageAccess(item.pageKey)
  })

  return (
    <Sidebar side="left" className={isCollapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarContent className="bg-card border-r pt-[env(safe-area-inset-top)]">
        {/* Logo */}
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center gap-2">
            <img src={logo} alt="MiBuks Logo" className="w-8 h-8" />
            {!isCollapsed && (
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">MiBuks</h2>
                <p className="text-xs text-muted-foreground">{t('app.businessHub')}</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : ''}>
            {t('nav.mainmenu')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-3 py-2 text-sm"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                      {!isCollapsed && isPremiumPage(item.pageKey) && !hasPremiumAccess && (
                        <Crown className="w-3 h-3 text-yellow-500 ml-auto flex-shrink-0" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasAdminAccess && (
          <SidebarGroup>
            <SidebarGroupLabel className={isCollapsed ? 'sr-only' : ''}>
              {t('nav.admin')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin')}>
                    <NavLink
                      to="/admin"
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-3 py-2 text-sm"
                    >
                      <Shield className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{t('admin.overview')}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {adminType === 'system_admin' && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive('/admin/users')}>
                        <NavLink
                          to="/admin/users"
                          onClick={handleNavClick}
                          className="flex items-center gap-3 px-3 py-2 text-sm"
                        >
                          <UserCog className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{t('admin.usersMenu')}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive('/admin/ngos')}>
                        <NavLink
                          to="/admin/ngos"
                          onClick={handleNavClick}
                          className="flex items-center gap-3 px-3 py-2 text-sm"
                        >
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{t('admin.ngos')}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive('/admin/all-businesses')}>
                        <NavLink
                          to="/admin/all-businesses"
                          onClick={handleNavClick}
                          className="flex items-center gap-3 px-3 py-2 text-sm"
                        >
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{t('admin.businesses')}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
                {adminType === 'ngo_admin' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive('/admin/businesses')}>
                      <NavLink
                        to="/admin/businesses"
                        onClick={handleNavClick}
                        className="flex items-center gap-3 px-3 py-2 text-sm"
                      >
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{t('admin.businesses')}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/activity-logs')}>
                    <NavLink
                      to="/admin/activity-logs"
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-3 py-2 text-sm"
                    >
                      <Activity className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{t('admin.activityLogs')}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/analytics')}>
                    <NavLink
                      to="/admin/analytics"
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-3 py-2 text-sm"
                    >
                      <PieChart className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{t('admin.analytics')}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/fund-disbursements')}>
                    <NavLink
                      to="/admin/fund-disbursements"
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-3 py-2 text-sm"
                    >
                      <Wallet className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{t('admin.fundDisbursements')}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {adminType === 'system_admin' && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive('/admin/subscriptions')}>
                        <NavLink
                          to="/admin/subscriptions"
                          onClick={handleNavClick}
                          className="flex items-center gap-3 px-3 py-2 text-sm"
                        >
                          <CreditCard className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{t('adminSub.title')}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive('/admin/marketers')}>
                        <NavLink
                          to="/admin/marketers"
                          onClick={handleNavClick}
                          className="flex items-center gap-3 px-3 py-2 text-sm"
                        >
                          <Megaphone className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{t('marketer.title')}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}