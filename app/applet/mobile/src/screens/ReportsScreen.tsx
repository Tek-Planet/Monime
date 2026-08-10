import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';

export const ReportsScreen = () => {
  const { business, selectedBranch } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalSalesCount, setTotalSalesCount] = useState(0);
  const [inventoryValuation, setInventoryValuation] = useState(0);

  const currency = business?.currency || 'SLL';

  const loadReportData = async () => {
    if (!business?.id) return;
    try {
      setLoading(true);
      const [sales, expenses, inventory] = await Promise.all([
        ApiService.fetchSales(business.id, selectedBranch?.id),
        ApiService.fetchExpenses(business.id),
        ApiService.fetchInventory(business.id),
      ]);

      const rev = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
      const exp = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const val = inventory.reduce((sum, i) => sum + (Number(i.unit_price || 0) * Number(i.stock_quantity || 0)), 0);

      setTotalRevenue(rev);
      setTotalExpenses(exp);
      setTotalSalesCount(sales.length);
      setInventoryValuation(val);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [business?.id, selectedBranch?.id]);

  const netProfit = totalRevenue - totalExpenses;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('nav.reports')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadReportData} tintColor={colors.primary} />}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Financial Performance Summary</Text>

        <Card style={styles.card}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Total Sales Volume</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{totalSalesCount} Transactions</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Gross Sales Revenue</Text>
          <Text style={[styles.value, { color: colors.prosperityGreen }]}>{currency} {totalRevenue.toLocaleString()}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Total Operating Expenses</Text>
          <Text style={[styles.value, { color: colors.danger }]}>{currency} {totalExpenses.toLocaleString()}</Text>
        </Card>

        <Card
          style={[
            styles.card,
            {
              backgroundColor: netProfit >= 0
                ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#F0FDF4')
                : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2'),
            },
          ]}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>Net Profit / Loss</Text>
          <Text style={[styles.value, { color: netProfit >= 0 ? colors.prosperityGreen : colors.danger }]}>
            {currency} {netProfit.toLocaleString()}
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Current Inventory Valuation</Text>
          <Text style={[styles.value, { color: colors.fintechBlue }]}>{currency} {inventoryValuation.toLocaleString()}</Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  card: { padding: 16, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  value: { fontSize: 20, fontWeight: '800', marginTop: 4 },
});
