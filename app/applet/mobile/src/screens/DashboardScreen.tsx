import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';
import { Sale, InventoryItem, CreditScoreResult } from '../types';

export const DashboardScreen = ({ navigation }: any) => {
  const { business, selectedBranch } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const [sales, setSales] = useState<Sale[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [creditResult, setCreditResult] = useState<CreditScoreResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const currency = business?.currency || 'SLL';

  const loadData = async () => {
    if (!business?.id) return;
    try {
      setRefreshing(true);
      const [sData, iData, cScore] = await Promise.all([
        ApiService.fetchSales(business.id, selectedBranch?.id),
        ApiService.fetchInventory(business.id),
        ApiService.calculateCreditScore(business.id),
      ]);
      setSales(sData);
      setInventory(iData);
      setCreditResult(cScore);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id, selectedBranch?.id]);

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const lowStockItems = inventory.filter((i) => i.stock_quantity <= (i.min_stock_level || 5));

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title={t('nav.dashboard')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
      >
        {/* KPI Grid */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('dashboard.totalRevenue')}</Text>
            <Text style={[styles.statValue, { color: colors.prosperityGreen }]}>
              {currency} {totalRevenue.toLocaleString()}
            </Text>
            <Text style={[styles.statSub, { color: colors.textMuted }]}>{sales.length} total sales</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('dashboard.lowStockAlerts')}</Text>
            <Text style={[styles.statValue, { color: lowStockItems.length > 0 ? colors.danger : colors.success }]}>
              {lowStockItems.length}
            </Text>
            <Text style={[styles.statSub, { color: colors.textMuted }]}>Items below threshold</Text>
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
                Eligible Micro Loan: <Text style={styles.boldText}>{currency} {creditResult.maxLoanAmount.toLocaleString()}</Text>
              </Text>
            </Card>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('dashboard.quickActions')}</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('AddSale')}
          >
            <Text style={styles.actionIcon}>🛍️</Text>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>New Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('CreateInvoice')}
          >
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Invoice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('AddInventory')}
          >
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Credit')}
          >
            <Text style={styles.actionIcon}>📈</Text>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Credit Rating</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Sales</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Sales')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {sales.slice(0, 5).map((sale) => (
          <Card key={sale.id} style={styles.saleRow}>
            <View style={styles.saleLeft}>
              <Text style={[styles.saleCustomer, { color: colors.textPrimary }]}>
                {sale.customer?.name || 'Walk-in Customer'}
              </Text>
              <Text style={[styles.saleDate, { color: colors.textMuted }]}>
                {sale.sale_date} • {sale.payment_method?.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.saleAmount, { color: colors.prosperityGreen }]}>
              {currency} {Number(sale.total_amount).toLocaleString()}
            </Text>
          </Card>
        ))}

        {sales.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No sales recorded yet. Tap "New Sale" to start!
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { padding: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { flex: 0.48, padding: 14 },
  statLabel: { fontSize: 12, fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '800', marginVertical: 4 },
  statSub: { fontSize: 11 },
  creditBanner: { padding: 16, borderRadius: 14, marginVertical: 10 },
  creditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  creditSubTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  creditScoreVal: { color: '#38BDF8', fontSize: 24, fontWeight: '800', marginTop: 2 },
  creditDesc: { color: '#E2E8F0', fontSize: 13, marginTop: 10 },
  boldText: { fontWeight: '700', color: '#38BDF8' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginVertical: 10 },
  viewAllText: { fontSize: 13, fontWeight: '700' },
  quickActionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  actionBtn: { flex: 0.23, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  actionIcon: { fontSize: 22, marginBottom: 4 },
  actionLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  saleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  saleLeft: { flex: 1 },
  saleCustomer: { fontSize: 14, fontWeight: '700' },
  saleDate: { fontSize: 12, marginTop: 2 },
  saleAmount: { fontSize: 15, fontWeight: '800' },
  emptyCard: { alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
