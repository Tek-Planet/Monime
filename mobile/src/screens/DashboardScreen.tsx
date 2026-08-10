import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';
import { Sale, Invoice, InventoryItem, Customer, CreditScoreResult } from '../types';

export const DashboardScreen = ({ navigation }: any) => {
  const { user, business, selectedBranch } = useAuth();
  const { t, language } = useLanguage();
  const { colors, isDark } = useTheme();

  const [sales, setSales] = useState<Sale[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [creditResult, setCreditResult] = useState<CreditScoreResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const currency = business?.currency || 'SLL';

  const formatCurrency = (amount: number) => {
    if (currency === 'SLL') {
      return `Le ${amount.toLocaleString()}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  };

  const loadData = async () => {
    if (!business?.id) {
      setLoading(false);
      return;
    }
    try {
      setRefreshing(true);
      const [sData, invData, iData, cData, cScore] = await Promise.all([
        ApiService.fetchSales(business.id, selectedBranch?.id).catch(() => []),
        ApiService.fetchInvoices(business.id).catch(() => []),
        ApiService.fetchInventory(business.id).catch(() => []),
        ApiService.fetchCustomers(business.id).catch(() => []),
        ApiService.calculateCreditScore(business.id).catch(() => null),
      ]);
      setSales(sData);
      setInvoices(invData);
      setInventory(iData);
      setCustomers(cData);
      setCreditResult(cScore);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id, selectedBranch?.id]);

  // Calculations
  const metrics = useMemo(() => {
    const salesRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
    const paidInvoicesRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
    const totalRevenue = salesRevenue + paidInvoicesRevenue;

    const inventoryValue = inventory.reduce(
      (sum, item) => sum + Number(item.unit_price || 0) * Number(item.stock_quantity || 0),
      0
    );

    const pendingInvoices = invoices.filter(
      (inv) => inv.status === 'draft' || inv.status === 'sent' || inv.status === 'pending'
    );
    const pendingInvoiceAmount = pendingInvoices.reduce(
      (sum, inv) => sum + Number(inv.total_amount || 0),
      0
    );

    return {
      totalRevenue,
      salesCount: sales.length,
      activeCustomers: customers.length,
      inventoryValue,
      inventoryCount: inventory.length,
      pendingInvoiceAmount,
      pendingCount: pendingInvoices.length,
    };
  }, [sales, invoices, inventory, customers]);

  // Combine Recent Transactions
  const recentTransactions = useMemo(() => {
    const saleTx = sales.map((sale) => ({
      id: `sale-${sale.id}`,
      type: 'sale',
      description: sale.customer?.name
        ? `${t('dashboard.saleTo')} ${sale.customer.name}`
        : t('dashboard.walkInSale'),
      amount: Number(sale.total_amount || 0),
      date: sale.sale_date || (sale.created_at ? sale.created_at.split('T')[0] : ''),
      rawDate: sale.created_at || sale.sale_date,
      status: 'completed' as const,
      method: sale.payment_method?.toUpperCase(),
    }));

    const invTx = invoices.map((inv) => ({
      id: `inv-${inv.id}`,
      type: 'invoice',
      description: `${t('dashboard.invoice')} ${inv.invoice_number}${
        inv.customer?.name ? ` - ${inv.customer.name}` : ''
      }`,
      amount: Number(inv.total_amount || 0),
      date: inv.invoice_date || (inv.created_at ? inv.created_at.split('T')[0] : ''),
      rawDate: inv.created_at || inv.invoice_date,
      status: inv.status === 'paid' ? ('completed' as const) : ('pending' as const),
      method: inv.status?.toUpperCase(),
    }));

    return [...saleTx, ...invTx]
      .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())
      .slice(0, 6);
  }, [sales, invoices, t]);

  // Upcoming birthdays (next 7 days)
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    return customers
      .filter((c) => c.birthday)
      .map((customer) => {
        const bdate = new Date(customer.birthday!);
        const thisYearB = new Date(today.getFullYear(), bdate.getMonth(), bdate.getDate());
        if (thisYearB < today) {
          thisYearB.setFullYear(today.getFullYear() + 1);
        }
        const diffMs = thisYearB.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return {
          customer,
          daysUntil,
          isToday: daysUntil === 0,
        };
      })
      .filter((b) => b.daysUntil >= 0 && b.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [customers]);

  // Greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t('dashboard.goodMorning')
      : hour < 17
      ? t('dashboard.goodAfternoon')
      : t('dashboard.goodEvening');

  const userName = user?.full_name || t('dashboard.user');
  const businessName = business?.business_name || t('dashboard.yourBusiness');
  const formattedDate = new Date().toLocaleDateString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  const quickModules = [
    { key: 'nav.sales', icon: '🛍️', route: 'Sales', bg: isDark ? '#064E3B' : '#D1FAE5', color: '#10B981' },
    { key: 'nav.expenses', icon: '🧾', route: 'Expenses', bg: isDark ? '#7F1D1D' : '#FEE2E2', color: '#EF4444' },
    { key: 'nav.inventory', icon: '📦', route: 'Inventory', bg: isDark ? '#1E3A8A' : '#DBEAFE', color: '#3B82F6' },
    { key: 'nav.customers', icon: '👥', route: 'Customers', bg: isDark ? '#4C1D95' : '#EDE9FE', color: '#8B5CF6' },
    { key: 'nav.invoices', icon: '📄', route: 'Invoices', bg: isDark ? '#78350F' : '#FEF3C7', color: '#F59E0B' },
    { key: 'nav.reports', icon: '📊', route: 'Reports', bg: isDark ? '#164E63' : '#CFFAFE', color: '#06B6D4' },
    { key: 'nav.suppliers', icon: '🚚', route: 'Suppliers', bg: isDark ? '#7C2D12' : '#FFEDD5', color: '#F97316' },
    { key: 'nav.settings', icon: '⚙️', route: 'Settings', bg: isDark ? '#334155' : '#F1F5F9', color: '#64748B' },
  ];

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title={t('nav.dashboard')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
      >
        {/* Welcome Hero Banner */}
        <View style={[styles.heroBanner, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroGreeting}>{greeting}, {userName}! 👋</Text>
          <Text style={styles.heroSubtitle}>{t('dashboard.welcomeTo')} {businessName}</Text>
          {selectedBranch && (
            <View style={styles.branchBadge}>
              <Text style={styles.branchBadgeText}>📍 {selectedBranch.name}</Text>
            </View>
          )}
          <Text style={styles.heroDate}>{formattedDate}</Text>
        </View>

        {/* Quick Access Grid (8 Modules) */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('dashboard.quickAccess')}
          </Text>
          <View style={styles.quickGrid}>
            {quickModules.map((mod) => (
              <TouchableOpacity
                key={mod.route}
                style={styles.quickTile}
                onPress={() => navigation.navigate(mod.route)}
              >
                <View style={[styles.quickIconContainer, { backgroundColor: mod.bg }]}>
                  <Text style={styles.quickIcon}>{mod.icon}</Text>
                </View>
                <Text style={[styles.quickLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  {t(mod.key)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Metrics Grid (4 Metric Cards matching Web) */}
        <View style={styles.metricsGrid}>
          {/* Card 1: Total Revenue */}
          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>
                {t('dashboard.totalRevenue')}
              </Text>
              <Text style={styles.metricIcon}>💰</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.prosperityGreen }]}>
              {formatCurrency(metrics.totalRevenue)}
            </Text>
            <Text style={[styles.metricSub, { color: colors.textMuted }]}>
              {t('dashboard.fromSales')}
            </Text>
          </Card>

          {/* Card 2: Active Customers */}
          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>
                {t('dashboard.activeCustomers')}
              </Text>
              <Text style={styles.metricIcon}>👥</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
              {metrics.activeCustomers}
            </Text>
            <Text style={[styles.metricSub, { color: colors.textMuted }]}>
              {t('dashboard.totalCustomers')}
            </Text>
          </Card>

          {/* Card 3: Inventory Value */}
          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>
                {t('dashboard.inventoryValue')}
              </Text>
              <Text style={styles.metricIcon}>📦</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.fintechBlue }]}>
              {formatCurrency(metrics.inventoryValue)}
            </Text>
            <Text style={[styles.metricSub, { color: colors.textMuted }]}>
              {t('dashboard.currentStock')} ({metrics.inventoryCount} items)
            </Text>
          </Card>

          {/* Card 4: Pending Invoices */}
          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>
                {t('dashboard.pendingInvoices')}
              </Text>
              <Text style={styles.metricIcon}>💳</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.warning }]}>
              {formatCurrency(metrics.pendingInvoiceAmount)}
            </Text>
            <Text style={[styles.metricSub, { color: colors.textMuted }]}>
              {t('dashboard.awaitingPayment')} ({metrics.pendingCount} invoices)
            </Text>
          </Card>
        </View>

        {/* Credit Score Banner */}
        {creditResult && (
          <TouchableOpacity onPress={() => navigation.navigate('Credit')}>
            <Card style={[styles.creditBanner, { backgroundColor: isDark ? '#1E293B' : '#0F172A' }]}>
              <View style={styles.creditHeader}>
                <View>
                  <Text style={styles.creditSubTitle}>MiBuks Business Rating</Text>
                  <Text style={styles.creditScoreVal}>{creditResult.score} / 850</Text>
                </View>
                <Badge label={creditResult.rating} variant={creditResult.score >= 680 ? 'success' : 'warning'} />
              </View>
              <Text style={styles.creditDesc}>
                Eligible Micro Loan: <Text style={styles.boldText}>{formatCurrency(creditResult.maxLoanAmount)}</Text>
              </Text>
            </Card>
          </TouchableOpacity>
        )}

        {/* Recent Transactions Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('dashboard.recentTransactions')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Sales')}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.map((tx) => (
            <View key={tx.id} style={[styles.txRow, { borderBottomColor: colors.cardBorder }]}>
              <View style={styles.txLeft}>
                <View style={[styles.txIconBg, { backgroundColor: tx.status === 'completed' ? (isDark ? '#064E3B' : '#D1FAE5') : (isDark ? '#78350F' : '#FEF3C7') }]}>
                  <Text style={styles.txIcon}>{tx.status === 'completed' ? '↗' : '⏳'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.txTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {tx.description}
                  </Text>
                  <Text style={[styles.txDate, { color: colors.textMuted }]}>
                    {tx.date} {tx.method ? `• ${tx.method}` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, { color: tx.status === 'completed' ? colors.prosperityGreen : colors.warning }]}>
                  +{formatCurrency(tx.amount)}
                </Text>
                <Badge
                  label={tx.status === 'completed' ? t('dashboard.completed') : t('dashboard.pending')}
                  variant={tx.status === 'completed' ? 'success' : 'warning'}
                />
              </View>
            </View>
          ))}

          {recentTransactions.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {t('dashboard.noRecentTransactions')}
              </Text>
            </View>
          )}
        </Card>

        {/* Upcoming Birthdays Card */}
        {upcomingBirthdays.length > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                🎂 {t('dashboard.upcomingBirthdays')}
              </Text>
              <Badge label={t('dashboard.birthdaysNext7Days')} variant="info" />
            </View>
            {upcomingBirthdays.map(({ customer, daysUntil, isToday }) => (
              <View key={customer.id} style={[styles.txRow, { borderBottomColor: colors.cardBorder }]}>
                <View style={styles.txLeft}>
                  <View style={[styles.txIconBg, { backgroundColor: isDark ? '#4C1D95' : '#EDE9FE' }]}>
                    <Text style={styles.txIcon}>🎉</Text>
                  </View>
                  <View>
                    <Text style={[styles.txTitle, { color: colors.textPrimary }]}>{customer.name}</Text>
                    <Text style={[styles.txDate, { color: colors.textMuted }]}>{customer.phone || customer.email || 'Customer'}</Text>
                  </View>
                </View>
                <Badge
                  label={isToday ? `${t('dashboard.today')} 🎉` : t('dashboard.inDays').replace('{days}', daysUntil.toString())}
                  variant={isToday ? 'success' : 'secondary'}
                />
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  heroBanner: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#6E56CF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroGreeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    textAlign: 'center',
  },
  branchBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  branchBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sectionCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickTile: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 14,
  },
  quickIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickIcon: {
    fontSize: 20,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricCard: {
    width: '48%',
    padding: 14,
    marginBottom: 12,
    borderRadius: 14,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricIcon: {
    fontSize: 16,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricSub: {
    fontSize: 11,
  },
  creditBanner: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  creditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creditSubTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  creditScoreVal: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  creditDesc: {
    color: '#E2E8F0',
    fontSize: 13,
    marginTop: 10,
  },
  boldText: {
    fontWeight: '800',
    color: '#38BDF8',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  txIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  txIcon: {
    fontSize: 16,
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 11,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
