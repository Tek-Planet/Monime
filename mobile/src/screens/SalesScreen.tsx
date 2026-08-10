import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';
import { Sale } from '../types';

export const SalesScreen = ({ navigation }: any) => {
  const { business, selectedBranch } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();

  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const currency = business?.currency || 'SLL';

  const loadSales = async () => {
    if (!business?.id) return;
    try {
      setRefreshing(true);
      const data = await ApiService.fetchSales(business.id, selectedBranch?.id);
      setSales(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [business?.id, selectedBranch?.id]);

  const filteredSales = sales.filter((s) => {
    const custName = s.customer?.name?.toLowerCase() || 'walk-in';
    return custName.includes(searchQuery.toLowerCase()) || s.sale_date.includes(searchQuery);
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('nav.sales')} />

      <View style={styles.topBar}>
        <Input
          placeholder="Search customer or date..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Button
          title="+ New Sale"
          onPress={() => navigation.navigate('AddSale')}
          style={styles.addBtn}
        />
      </View>

      <FlatList
        data={filteredSales}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSales} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('SaleDetail', { sale: item })}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                  {item.customer?.name || 'Walk-in Customer'}
                </Text>
                <Text style={[styles.amount, { color: colors.prosperityGreen }]}>
                  {currency} {Number(item.total_amount).toLocaleString()}
                </Text>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.cardBorder }]}>
                <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
                  📅 {item.sale_date} • 💳 {item.payment_method?.replace('_', ' ').toUpperCase()}
                </Text>
                {item.notes && <Text style={[styles.notesText, { color: colors.textMuted }]}>Note: {item.notes}</Text>}
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No sales recorded yet.</Text>
          </Card>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  addBtn: { marginBottom: 10 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { fontSize: 15, fontWeight: '700' },
  amount: { fontSize: 16, fontWeight: '800' },
  cardFooter: { marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  detailsText: { fontSize: 12 },
  notesText: { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
