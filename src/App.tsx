import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BranchProvider } from "@/contexts/BranchContext";
import { PinLockProvider } from "@/contexts/PinLockContext";
import { PinLockScreen } from "@/components/PinLockScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageAccessGuard } from "@/components/PageAccessGuard";
import { Layout } from "@/components/Layout";
import { UpdateGate } from "@/components/UpdateGate";
import Index from "./pages/Index";
import Invoices from "./pages/Invoices";
import Credit from "./pages/Credit";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import ExpensesPage from "./pages/Expenses";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/admin/Users";
import AdminNGOs from "./pages/admin/NGOs";
import AdminNGODetails from "./pages/admin/NGODetails";
import AdminNGOBusinesses from "./pages/admin/NGOBusinesses";
import AdminActivityLogs from "./pages/admin/ActivityLogs";
import AdminAnalytics from "./pages/admin/Analytics";
import NGOAdminBusinesses from "./pages/admin/NGOAdminBusinesses";
import AllBusinesses from "./pages/admin/AllBusinesses";
import SeedDatabase from "./pages/admin/SeedDatabase";
import BusinessDetails from "./pages/admin/BusinessDetails";
import FundDisbursements from "./pages/admin/FundDisbursements";
import AdminSubscriptions from "./pages/admin/Subscriptions";
import AdminMarketers from "./pages/admin/Marketers";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import Setup from "./pages/Setup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
      <AuthProvider>
          <BranchProvider>
            <PinLockProvider>
            <PinLockScreen />
            <UpdateGate />
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/support" element={<Support />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<PageAccessGuard pageKey="dashboard"><Index /></PageAccessGuard>} />
                <Route path="invoices" element={
                  <PageAccessGuard pageKey="invoices">
                    <Invoices />
                  </PageAccessGuard>
                } />
                <Route path="customers" element={
                  <PageAccessGuard pageKey="customers">
                    <Customers />
                  </PageAccessGuard>
                } />
                <Route path="inventory" element={
                  <PageAccessGuard pageKey="inventory">
                    <Inventory />
                  </PageAccessGuard>
                } />
                <Route path="sales" element={
                  <PageAccessGuard pageKey="sales">
                    <Sales />
                  </PageAccessGuard>
                } />
                <Route path="suppliers" element={
                  <PageAccessGuard pageKey="suppliers">
                    <Suppliers />
                  </PageAccessGuard>
                } />
                <Route path="expenses" element={
                  <PageAccessGuard pageKey="expenses">
                    <ExpensesPage />
                  </PageAccessGuard>
                } />
                <Route path="reports" element={
                  <PageAccessGuard pageKey="reports">
                    <Reports />
                  </PageAccessGuard>
                } />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="credit" element={
                  <PageAccessGuard pageKey="credit">
                    <Credit />
                  </PageAccessGuard>
                } />
                <Route path="admin" element={<Admin />} />
                <Route path="admin/users" element={<AdminUsers />} />
                <Route path="admin/ngos" element={<AdminNGOs />} />
                <Route path="admin/ngos/:ngoId" element={<AdminNGODetails />} />
                <Route path="admin/ngos/:ngoId/businesses" element={<AdminNGOBusinesses />} />
                <Route path="admin/businesses" element={<NGOAdminBusinesses />} />
                <Route path="admin/all-businesses" element={<AllBusinesses />} />
                <Route path="admin/businesses/:businessId" element={<BusinessDetails />} />
                <Route path="admin/seed-database" element={<SeedDatabase />} />
                <Route path="admin/activity-logs" element={<AdminActivityLogs />} />
                <Route path="admin/analytics" element={<AdminAnalytics />} />
                <Route path="admin/fund-disbursements" element={<FundDisbursements />} />
                <Route path="admin/subscriptions" element={<AdminSubscriptions />} />
                <Route path="admin/marketers" element={<AdminMarketers />} />
              </Route>
              <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </PinLockProvider>
        </BranchProvider>
      </AuthProvider>
    </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
