import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ApiService } from '../services/api';
import { Sale, InventoryItem, CreditScoreResult } from '../types';

export const DashboardScreen = ({ navigation }: any) => {
  const { business, selectedBranch } = useAuth();
  const { t } = useLanguage();

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
    <View style={styles.flex}>
      <Header title={t('nav.dashboard')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
      >
        {/* KPI Grid */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>{t('dashboard.totalRevenue')}</Text>
            <Text style={styles.statValue}>{currency} {totalRevenue.toLocaleString()}</Text>
            <Text style={styles.statSub}>{sales.length} total sales</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>{t('dashboard.lowStockAlerts')}</Text>
            <Text style={[styles.statValue, { color: lowStockItems.length > 0 ? '#DC2626' : '#16A34A' }]}>
              {lowStockItems.length}
            </Text>
            <Text style={styles.statSub}>Items below threshold</Text>
          </Card>
        </View>

        {/* Credit Score Banner */}
        {creditResult && (
          <TouchableOpacity onPress={() => navigation.navigate('CreditStack')}>
            <Card style={styles.creditBanner}>
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
        <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddSale')}>
            <Text style={styles.actionIcon}>🛍️</Text>
            <Text style={styles.actionLabel}>New Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreateInvoice')}>
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionLabel}>Invoice</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddInventory')}>
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionLabel}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreditStack')}>
            <Text style={styles.actionIcon}>📈</Text>
            <Text style={styles.actionLabel}>Credit Rating</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Sales</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SalesStack')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {sales.slice(0, 5).map((sale) => (
          <Card key={sale.id} style={styles.saleRow}>
            <View style={styles.saleLeft}>
              <Text style={styles.saleCustomer}>{sale.customer?.name || 'Walk-in Customer'}</Text>
              <Text style={styles.saleDate}>{sale.sale_date} • {sale.payment_method?.toUpperCase()}</Text>
            </View>
            <Text style={styles.saleAmount}>{currency} {Number(sale.total_amount).toLocaleString()}</Text>
          </Card>
        ))}

        {sales.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No sales recorded yet. Tap "New Sale" to start!</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { flex: 0.48, padding: 14 },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginVertical: 4 },
  statSub: { fontSize: 11, color: '#94A3B8' },
  creditBanner: { backgroundColor: '#1E293B', borderColor: '#334155' },
  creditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  creditSubTitle: { color: '#94A3B8', fontSize: 12 },
  creditScoreVal: { color: '#38BDF8', fontSize: 24, fontWeight: '800', marginTop: 2 },
  creditDesc: { color: '#E2E8F0', fontSize: 13, marginTop: 10 },
  boldText: { fontWeight: '700', color: '#38BDF8' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginVertical: 10 },
  viewAllText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  quickActionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  actionBtn: { flex: 0.23, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  actionIcon: { fontSize: 22, marginBottom: 4 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#334155', textAlign: 'center' },
  saleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  saleLeft: { flex: 1 },
  saleCustomer: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  saleDate: { fontSize: 12, color: '#64748B', marginTop: 2 },
  saleAmount: { fontSize: 15, fontWeight: '700', color: '#16A34A' },
  emptyCard: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#64748B', fontSize: 14, textAlign: 'center' },
});
